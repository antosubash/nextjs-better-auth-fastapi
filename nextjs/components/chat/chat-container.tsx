"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";

import { queryKeys } from "@/lib/hooks/api/query-keys";
import { useConversation, useCreateConversation, useModels } from "@/lib/hooks/api/use-chat";
import { useChatStore } from "@/lib/stores/chat-store";
import { cn } from "@/lib/utils";
import { createLogger } from "@/lib/utils/logger";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";
import { ChatSidebar } from "./chat-sidebar";
import {
  convertMessagesToApiFormat,
  createUserMessage,
  handleStreamingResponse,
} from "./chat-utils";
import { ExamplePrompts } from "./example-prompts";
import { useChatError } from "./use-chat-error";
import { useChatScroll } from "./use-chat-scroll";

const logger = createLogger("chat-container");

interface ChatContainerProps {
  className?: string;
}

export function ChatContainer({ className }: ChatContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlConversationId = searchParams.get("conversation");

  const {
    selectedConversationId,
    setSelectedConversationId,
    sidebarOpen,
    setSidebarOpen,
    showTimestamps,
    toggleTimestamps,
    model,
    setModel,
    input,
    setInput,
  } = useChatStore();

  const queryClient = useQueryClient();
  const { data: models } = useModels();
  const { data: conversation } = useConversation(selectedConversationId);
  const { mutateAsync: createConversation } = useCreateConversation();

  const { messages, status, error, setMessages, regenerate, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        conversation_id: selectedConversationId,
        model,
      },
    }),
    onFinish: async (_message) => {
      if (selectedConversationId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.chat.conversations.detail(selectedConversationId),
        });
      }
    },
  });

  const { errorMessage } = useChatError(error);

  const { scrollContainerRef, messagesEndRef, showScrollButton, handleScrollToBottom } =
    useChatScroll(messages, status === "streaming", selectedConversationId);

  useEffect(() => {
    if (urlConversationId && urlConversationId !== selectedConversationId) {
      setSelectedConversationId(urlConversationId);
    }
  }, [urlConversationId, selectedConversationId, setSelectedConversationId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedConversationId is needed to trigger message clearing
  useEffect(() => {
    // Clear messages when switching conversations
    setMessages([]);
  }, [selectedConversationId, setMessages]);

  useEffect(() => {
    if (conversation?.messages) {
      const formattedMessages = conversation.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: msg.content }],
        createdAt: msg.created_at,
      }));
      setMessages(formattedMessages);
    }
  }, [conversation, setMessages]);

  const availableModels = useMemo(() => {
    if (!models?.models) return [];
    return models.models.map((m) => m.name);
  }, [models]);

  useEffect(() => {
    if (availableModels.length > 0 && !availableModels.includes(model)) {
      setModel(availableModels[0]);
    }
  }, [availableModels, model, setModel]);

  const _handleNewConversation = async () => {
    const newConversation = await createConversation({ title: "New Conversation" });
    setSelectedConversationId(newConversation.id);
    setMessages([]);
    router.push(`/chat?conversation=${newConversation.id}`);
  };

  const handleSelectConversation = (conversationId: string | null) => {
    if (conversationId) {
      setSelectedConversationId(conversationId);
      router.push(`/chat?conversation=${conversationId}`);
    }
  };

  const handleRegenerate = async () => {
    await regenerate();
  };

  const getMessageCreatedAt = (messageId: string) => {
    if (!conversation?.messages) return undefined;
    return conversation.messages.find((msg) => msg.id === messageId)?.created_at;
  };

  const onSubmit = async (data: { message: string }) => {
    if (!selectedConversationId) {
      const newConversation = await createConversation({ title: "New Conversation" });
      setSelectedConversationId(newConversation.id);
      router.push(`/chat?conversation=${newConversation.id}`);
    }

    const userMessage = createUserMessage(data.message);
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: convertMessagesToApiFormat(updatedMessages),
          model,
          conversation_id: selectedConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      await handleStreamingResponse(reader, updatedMessages, setMessages);
    } catch (error) {
      logger.error("Chat submission error:", error);
      setMessages(messages);
    }
  };

  return (
    <div className={cn("flex h-full bg-background", className)}>
      <ChatSidebar
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          model={model}
          onModelChange={setModel}
          onClear={() => setMessages([])}
          isStreaming={status === "streaming"}
          onStop={stop}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleTimestamps={toggleTimestamps}
          showTimestamps={showTimestamps}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col relative">
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <ExamplePrompts setInput={setInput} />
                </div>
              ) : (
                <div className="space-y-6 pb-4">
                  {(() => {
                    const filteredMessages = messages.filter(
                      (message: UIMessage) =>
                        message.role === "user" || message.role === "assistant"
                    );
                    const messagesWithIndices = filteredMessages.map((msg, idx) => ({ msg, idx }));
                    messagesWithIndices.sort((a, b) => {
                      const aCreatedAt = getMessageCreatedAt(a.msg.id);
                      const bCreatedAt = getMessageCreatedAt(b.msg.id);
                      if (aCreatedAt && bCreatedAt) {
                        return new Date(aCreatedAt).getTime() - new Date(bCreatedAt).getTime();
                      }
                      return a.idx - b.idx;
                    });
                    return messagesWithIndices.map(({ msg: message }, index) => {
                      const textPart = message.parts.find((p) => p.type === "text");
                      const content =
                        textPart && "text" in textPart ? (textPart.text as string) : "";
                      const isLastAssistant =
                        message.role === "assistant" && index === messagesWithIndices.length - 1;
                      return (
                        <ChatMessage
                          key={message.id}
                          id={message.id}
                          role={message.role as "user" | "assistant"}
                          content={content}
                          createdAt={getMessageCreatedAt(message.id)}
                          onRegenerate={isLastAssistant ? handleRegenerate : undefined}
                          isLast={isLastAssistant}
                          showTimestamps={showTimestamps}
                        />
                      );
                    });
                  })()}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <ChatInput
              input={input}
              handleInputChange={(e) => setInput(e.target.value)}
              handleSubmit={(e) => {
                e.preventDefault();
                onSubmit({ message: input });
              }}
              disabled={status !== "ready"}
              error={errorMessage}
            />

            {showScrollButton && (
              <Button
                onClick={handleScrollToBottom}
                size="icon"
                className={cn(
                  "absolute bottom-20 right-6 z-10 h-10 w-10 rounded-full shadow-lg",
                  "bg-background border-2 hover:bg-accent transition-all duration-200",
                  "animate-in fade-in slide-in-from-bottom-4"
                )}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
