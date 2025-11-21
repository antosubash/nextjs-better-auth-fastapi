"use client";

interface ChatThinkingProps {
  thinking: string;
  isStreaming?: boolean;
}

export function ChatThinking({ thinking }: ChatThinkingProps) {
  // Simplified: Hide thinking by default for cleaner UI
  if (!thinking) {
    return null;
  }

  return null;
}
