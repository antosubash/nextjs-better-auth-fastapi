"use client";

import { Send } from "lucide-react";
import type { FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CHAT_LABELS } from "@/lib/constants";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  error?: string | null;
}

export function ChatInput({ input, handleInputChange, handleSubmit, disabled }: ChatInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form) {
        const syntheticEvent = new Event("submit", { bubbles: true, cancelable: true });
        form.dispatchEvent(syntheticEvent);
        handleSubmit(syntheticEvent as unknown as FormEvent<HTMLFormElement>);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
      <div className="flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={CHAT_LABELS.PLACEHOLDER}
          disabled={disabled}
          className="min-h-[60px] max-h-[200px] resize-none flex-1"
          rows={1}
        />
        <Button type="submit" disabled={disabled || !input.trim()} size="icon">
          <Send className="w-4 h-4" />
          <span className="sr-only">{CHAT_LABELS.SEND_MESSAGE}</span>
        </Button>
      </div>
    </form>
  );
}
