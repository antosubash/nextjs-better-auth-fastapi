"use client";

import { AlertCircle, Bot, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CHAT_ERRORS, CHAT_LABELS, CHAT_MODELS } from "@/lib/constants";
import { useConversation, useCreateConversation } from "@/lib/hooks/api/use-chat";
import { queryKeys } from "@/lib/hooks/api/query-keys";
import { createLogger } from "@/lib/utils/logger";
import { cn } from "@/lib/utils";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";
import { ChatSidebar } from "./chat-sidebar";

const logger = createLogger("chat-container");

export function ChatContainer() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [model, setModel] = useState<string>(CHAT_MODELS.QWEN_8B);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const createConversationMutation = useCreateConversation();

  const { data: conversationData } = useConversation(selectedConversationId);
  const queryClient = useQueryClient();
  const initializedConversationIdRef = useRef<string | null>(null);

  // Convert conversation messages to AI SDK format
  const initialMessages = useMemo(
    () =>
      conversationData?.messages
        ?.filter((msg) => msg.role !== "system")
        .map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          parts: [{ type: "text" as const, text: msg.content }],
        })) || [],
    [conversationData?.messages]
  );

  // Manage input state manually
  const [input, setInput] = useState("");

  // Use useChat hook for message management, but handle API calls manually
  const chatState = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: async () => {
      // Refresh conversation to get saved messages (but don't update UI messages)
      // The useChat hook already manages the messages state from streaming
      if (selectedConversationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.chat.conversations.detail(selectedConversationId),
        });
      }
    },
    onError: (error: unknown) => {
      // Log parsing errors for debugging
      logger.error("Chat stream error", error);
    },
  });

  const { messages, status, error: chatError, stop, setMessages } = chatState;

  // Initialize messages from conversation data
  useEffect(() => {
    if (initialMessages.length > 0 && messages.length === 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, messages.length, setMessages]);
  const isLoading = status === "streaming" || status === "submitted";

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: input }],
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    // Make the API call manually since AI SDK v2 API is different
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages.map((msg: UIMessage) => {
            const textPart = msg.parts.find((p) => p.type === "text");
            return {
              role: msg.role,
              content: textPart && "text" in textPart ? (textPart.text as string) : "",
            };
          }),
          model,
          conversation_id: selectedConversationId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const assistantMessageId = crypto.randomUUID();
      let assistantContent = "";

      if (reader) {
        const assistantMessage: UIMessage = {
          id: assistantMessageId,
          role: "assistant",
          parts: [{ type: "text", text: "" }],
        };
        setMessages([...updatedMessages, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  assistantContent += parsed.choices[0].delta.content;
                  setMessages([
                    ...updatedMessages,
                    {
                      id: assistantMessageId,
                      role: "assistant",
                      parts: [{ type: "text", text: assistantContent }],
                    },
                  ]);
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error("Failed to send message", error);
      // Remove the user message on error
      setMessages(messages);
    }
  };

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
            parts: [{ type: "text" as const, text: msg.content }],
          }));
        setMessages(convertedMessages);
        initializedConversationIdRef.current = selectedConversationId;
      }
    }
  }, [selectedConversationId, conversationData, setMessages]);

  // Get the scrollable viewport (now it's the container itself)
  const getViewport = () => {
    return scrollContainerRef.current;
  };

  // Auto-scroll to bottom when new messages arrive or during streaming
  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;

    const scrollToBottom = (smooth = true) => {
      const scrollHeight = viewport.scrollHeight;
      const clientHeight = viewport.clientHeight;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      
      viewport.scrollTo({
        top: maxScroll,
        behavior: smooth ? "smooth" : "auto",
      });
      setShowScrollButton(false);
    };

    // Auto-scroll during streaming or when new messages arrive
    if (isLoading || messages.length > 0) {
      const scrollHeight = viewport.scrollHeight;
      const scrollTop = viewport.scrollTop;
      const clientHeight = viewport.clientHeight;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
      
      if (isNearBottom) {
        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToBottom(true);
          }, 50);
        });
      }
    }
  }, [messages, isLoading]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    const viewport = getViewport();
    if (viewport && selectedConversationId) {
      // Wait for DOM to update
      requestAnimationFrame(() => {
        setTimeout(() => {
          const scrollHeight = viewport.scrollHeight;
          const clientHeight = viewport.clientHeight;
          const maxScroll = Math.max(0, scrollHeight - clientHeight);
          viewport.scrollTo({
            top: maxScroll,
            behavior: "auto",
          });
        }, 150);
      });
    }
  }, [selectedConversationId]);

  // Scroll to bottom when messages are loaded initially
  useEffect(() => {
    if (messages.length > 0) {
      const viewport = getViewport();
      if (viewport) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const scrollHeight = viewport.scrollHeight;
            const clientHeight = viewport.clientHeight;
            const maxScroll = Math.max(0, scrollHeight - clientHeight);
            viewport.scrollTo({
              top: maxScroll,
              behavior: "auto",
            });
          }, 100);
        });
      }
    }
  }, [messages.length]);

  const handleScrollToBottom = () => {
    const viewport = getViewport();
    if (viewport) {
      const scrollHeight = viewport.scrollHeight;
      const clientHeight = viewport.clientHeight;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      viewport.scrollTo({
        top: maxScroll,
        behavior: "smooth",
      });
      setShowScrollButton(false);
    }
  };

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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ChatHeader
          model={model}
          onModelChange={setModel}
          onClear={handleClear}
          isStreaming={isLoading}
          onStop={handleStop}
        />
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
          onScroll={() => {
            const viewport = scrollContainerRef.current;
            if (viewport) {
              const scrollHeight = viewport.scrollHeight;
              const scrollTop = viewport.scrollTop;
              const clientHeight = viewport.clientHeight;
              const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
              setShowScrollButton(!isNearBottom && messages.length > 0);
            }
          }}
        >
          <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">{CHAT_LABELS.NO_MESSAGES}</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {CHAT_LABELS.START_CONVERSATION}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {messages
                  .filter(
                    (message: UIMessage) => message.role === "user" || message.role === "assistant"
                  )
                  .map((message: UIMessage) => {
                    const textPart = message.parts.find((p) => p.type === "text");
                    const content = textPart && "text" in textPart ? (textPart.text as string) : "";
                    return (
                      <ChatMessage
                        key={message.id}
                        id={message.id}
                        role={message.role as "user" | "assistant"}
                        content={content}
                        createdAt={getMessageCreatedAt(message.id)}
                      />
                    );
                  })}
                {isLoading && (
                  <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
                    <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-md bg-muted border border-border/50">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" />
                      </div>
                      <span className="text-sm text-muted-foreground ml-2">{CHAT_LABELS.STREAMING}</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
            {errorMessage && (
              <Alert variant="destructive" className="mt-4 max-w-4xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </div>
          {showScrollButton && (
            <Button
              onClick={handleScrollToBottom}
              size="icon"
              className={cn(
                "absolute bottom-20 right-6 z-10 h-10 w-10 rounded-full shadow-lg",
                "bg-background border-2 hover:bg-accent transition-all duration-200",
                "animate-in fade-in slide-in-from-bottom-4"
              )}
              title={CHAT_LABELS.SCROLL_TO_BOTTOM}
            >
              <ChevronDown className="w-5 h-5" />
              <span className="sr-only">{CHAT_LABELS.SCROLL_TO_BOTTOM}</span>
            </Button>
          )}
        </div>
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
