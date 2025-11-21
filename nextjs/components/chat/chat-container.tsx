"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import type { Message } from "ai";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CHAT_ERRORS, CHAT_LABELS, CHAT_MODELS } from "@/lib/constants";
import { useConversation, useCreateConversation } from "@/lib/hooks/api/use-chat";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/hooks/api/query-keys";
import { createLogger } from "@/lib/utils/logger";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";
import { ChatSidebar } from "./chat-sidebar";
import { ChatThinking } from "./chat-thinking";

const logger = createLogger("chat-container");

export function ChatContainer() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [model, setModel] = useState<string>(CHAT_MODELS.QWEN_8B);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [temperature, setTemperature] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const createConversationMutation = useCreateConversation();
  // Track thinking tokens per message ID
  const [thinkingMap, setThinkingMap] = useState<Record<string, string>>({});

  const { data: conversationData } = useConversation(selectedConversationId);
  const queryClient = useQueryClient();
  const initializedConversationIdRef = useRef<string | null>(null);

  // Convert conversation messages to AI SDK format
  const initialMessages =
    conversationData?.messages
      ?.filter((msg) => msg.role !== "system")
      .map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })) || [];

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error: chatError,
    stop,
    setMessages,
  } = useChat({
    api: "/api/chat",
    initialMessages,
    body: {
      model,
      system_prompt: systemPrompt || undefined,
      temperature: temperature || undefined,
      conversation_id: selectedConversationId || undefined,
    },
    onFinish: async () => {
      // Refresh conversation to get saved messages (but don't update UI messages)
      // The useChat hook already manages the messages state from streaming
      if (selectedConversationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.chat.conversations.detail(selectedConversationId),
        });
      }
    },
    onError: (error) => {
      // Log parsing errors for debugging
      logger.error("Chat stream error", error);
    },
  });

  // Reset messages only when conversation ID changes (not on data refresh)
  useEffect(() => {
    const conversationChanged = initializedConversationIdRef.current !== selectedConversationId;

    if (conversationChanged) {
      // Clear messages if no conversation selected
      if (!selectedConversationId) {
        setMessages([]);
        initializedConversationIdRef.current = null;
      } else if (
        conversationData?.messages &&
        // Only update if conversationData matches the selected conversation
        // (check first message's conversation_id if available, or trust the query)
        conversationData.id === selectedConversationId
      ) {
        // Load messages for the new conversation
        const convertedMessages = conversationData.messages
          .filter((msg) => msg.role !== "system")
          .map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));
        setMessages(convertedMessages);
        initializedConversationIdRef.current = selectedConversationId;
      }
    }
  }, [selectedConversationId, conversationData, setMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle form submission with conversation creation
  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Create conversation if none selected and this is the first message
    if (!selectedConversationId && messages.length === 0 && input.trim()) {
      try {
        const conversation = await createConversationMutation.mutateAsync({
          title: input.slice(0, 50) || CHAT_LABELS.NEW_CONVERSATION,
        });
        setSelectedConversationId(conversation.id);
      } catch (err) {
        // Continue without saving if creation fails
        logger.error("Failed to create conversation", err);
      }
    }

    // Call the original handleSubmit
    handleSubmit(e);
  };

  const handleClear = () => {
    stop();
    setSelectedConversationId(null);
    setMessages([]);
    setThinkingMap({});
  };

  const handleStop = () => {
    stop();
  };

  // Get message creation time from conversation data
  const getMessageCreatedAt = (messageId: string) => {
    return conversationData?.messages?.find((msg) => msg.id === messageId)?.created_at;
  };

  const errorMessage = chatError?.message || (chatError ? CHAT_ERRORS.SEND_FAILED : null);

  return (
    <div className="flex h-full">
      <div className="w-64 shrink-0">
        <ChatSidebar
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          model={model}
          onModelChange={setModel}
          onClear={handleClear}
          isStreaming={isLoading}
          onStop={handleStop}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
          temperature={temperature}
          onTemperatureChange={setTemperature}
        />
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">{CHAT_LABELS.NO_MESSAGES}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages
                .filter(
                  (message: Message) => message.role === "user" || message.role === "assistant"
                )
                .map((message: Message) => {
                  const thinking = thinkingMap[message.id];
                  const isLastMessage = message.id === messages[messages.length - 1]?.id;
                  const isStreaming = isLoading && isLastMessage && message.role === "assistant";

                  return (
                    <div key={message.id}>
                      {message.role === "assistant" && thinking && (
                        <ChatThinking thinking={thinking} isStreaming={isStreaming} />
                      )}
                      <ChatMessage
                        id={message.id}
                        role={message.role as "user" | "assistant"}
                        content={message.content}
                        createdAt={getMessageCreatedAt(message.id)}
                      />
                    </div>
                  );
                })}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="text-sm text-muted-foreground">{CHAT_LABELS.STREAMING}</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
          {errorMessage && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </ScrollArea>
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleChatSubmit}
          disabled={isLoading}
          error={errorMessage}
        />
      </div>
    </div>
  );
}
