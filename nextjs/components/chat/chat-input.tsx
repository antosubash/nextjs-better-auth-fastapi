"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CHAT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  error?: string | null;
}

export function ChatInput({ input, handleInputChange, handleSubmit, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form && !disabled && input.trim()) {
        const syntheticEvent = new Event("submit", { bubbles: true, cancelable: true });
        form.dispatchEvent(syntheticEvent);
        handleSubmit(syntheticEvent as unknown as FormEvent<HTMLFormElement>);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="p-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={CHAT_LABELS.PLACEHOLDER}
              disabled={disabled}
              className={cn(
                "min-h-[52px] max-h-[200px] resize-none flex-1 pr-12",
                "rounded-xl border-2 focus-visible:ring-2 focus-visible:ring-offset-0",
                "transition-all duration-200"
              )}
              rows={1}
            />
            {input.trim() && (
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {input.length}
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={disabled || !input.trim()}
            size="icon"
            className={cn(
              "h-[52px] w-[52px] shrink-0 rounded-xl",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
            <span className="sr-only">{CHAT_LABELS.SEND_MESSAGE}</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
