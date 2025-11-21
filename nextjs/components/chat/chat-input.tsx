"use client";

import { RefreshCw, Send } from "lucide-react";
import { type FormEvent, type KeyboardEvent } from "react";
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

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  disabled,
  error,
}: ChatInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Create a synthetic form event to submit
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
        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={CHAT_LABELS.PLACEHOLDER}
            disabled={disabled}
            className="min-h-[60px] max-h-[200px] resize-none pr-16"
            rows={1}
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {input.length} {CHAT_LABELS.CHARACTER_COUNT}
          </div>
        </div>
        {error && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              // Retry by resubmitting the form
              const form = document.querySelector("form");
              if (form) {
                handleSubmit(new Event("submit") as unknown as FormEvent<HTMLFormElement>);
              }
            }}
            title={CHAT_LABELS.RETRY}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="sr-only">{CHAT_LABELS.RETRY}</span>
          </Button>
        )}
        <Button type="submit" disabled={disabled || !input.trim()} size="icon">
          <Send className="w-4 h-4" />
          <span className="sr-only">{CHAT_LABELS.SEND_MESSAGE}</span>
        </Button>
      </div>
    </form>
  );
}
