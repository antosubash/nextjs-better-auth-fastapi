"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CHAT_ERRORS, CHAT_LABELS, CHAT_MODELS } from "@/lib/constants";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState(CHAT_MODELS.QWEN_8B);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  const parseStreamLine = (line: string): { content?: string; done?: boolean } | null => {
    if (!line.startsWith("data: ")) {
      return null;
    }
    try {
      return JSON.parse(line.slice(6));
    } catch (_e) {
      // Ignore JSON parse errors for incomplete chunks
      return null;
    }
  };

  const processStreamChunk = (
    chunk: string,
    assistantMessage: string,
    newMessages: Message[]
  ): { message: string; done: boolean } => {
    const lines = chunk.split("\n");
    let updatedMessage = assistantMessage;
    let isDone = false;

    for (const line of lines) {
      const data = parseStreamLine(line);
      if (!data) continue;

      if (data.content) {
        updatedMessage += data.content;
        setMessages([
          ...newMessages,
          { id: `assistant-${Date.now()}`, role: "assistant", content: updatedMessage },
        ]);
      }
      if (data.done) {
        isDone = true;
      }
    }

    return { message: updatedMessage, done: isDone };
  };

  const streamResponse = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    newMessages: Message[]
  ): Promise<void> => {
    const decoder = new TextDecoder();
    let assistantMessage = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const result = processStreamChunk(chunk, assistantMessage, newMessages);
      assistantMessage = result.message;

      if (result.done) {
        setIsStreaming(false);
        return;
      }
    }

    setIsStreaming(false);
  };

  const createUserMessage = (content: string): Message => ({
    id: `user-${Date.now()}`,
    role: "user",
    content,
  });

  const prepareRequest = (newMessages: Message[]) => {
    abortControllerRef.current = new AbortController();
    return {
      method: "POST" as const,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: newMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        model,
        stream: true,
      }),
      signal: abortControllerRef.current.signal,
    };
  };

  const handleResponseError = async (response: Response): Promise<never> => {
    const errorData = await response.json().catch(() => ({ error: CHAT_ERRORS.SEND_FAILED }));
    throw new Error(errorData.error || CHAT_ERRORS.SEND_FAILED);
  };

  const handleSendError = (error: unknown) => {
    setIsStreaming(false);
    if (error instanceof Error && error.name === "AbortError") {
      return;
    }
    setError(error instanceof Error ? error.message : CHAT_ERRORS.SEND_FAILED);
    setMessages(messages);
  };

  const handleSend = async (userMessage: string) => {
    if (isStreaming) return;

    const userMsg = createUserMessage(userMessage);
    const newMessages: Message[] = [...messages, userMsg];
    setMessages(newMessages);
    setIsStreaming(true);
    setError(null);

    try {
      const requestOptions = prepareRequest(newMessages);
      const response = await fetch("/api/chat", requestOptions);

      if (!response.ok) {
        await handleResponseError(response);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error(CHAT_ERRORS.STREAM_ERROR);
      }

      await streamResponse(reader, newMessages);
    } catch (error) {
      handleSendError(error);
    }
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader model={model} onModelChange={setModel} onClear={handleClear} />
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">{CHAT_LABELS.NO_MESSAGES}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} role={message.role} content={message.content} />
            ))}
            {isStreaming && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-sm text-muted-foreground">{CHAT_LABELS.STREAMING}</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </ScrollArea>
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
