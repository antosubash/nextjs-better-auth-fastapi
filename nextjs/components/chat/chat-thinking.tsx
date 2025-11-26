"use client";
"use client";

import { Brain, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHAT_LABELS } from "@/lib/constants";
import { useThinkingStore } from "@/lib/stores/thinking-store";
import { cn } from "@/lib/utils";

interface ChatThinkingProps {
  isStreaming?: boolean;
  className?: string;
}

export function ChatThinking({ isStreaming = false, className }: ChatThinkingProps) {
  const current = useThinkingStore((state) => state.current);
  const isVisible = useThinkingStore((state) => state.isVisible);
  const toggleVisibility = useThinkingStore((state) => state.toggleVisibility);

  if (!current || (!isStreaming && current.content.length === 0)) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/50 backdrop-blur-sm p-4 shadow-sm",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{CHAT_LABELS.THINKING}</span>
            <span className="text-xs text-muted-foreground">{CHAT_LABELS.REASONING}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={toggleVisibility}
        >
          {isVisible ? (
            <div className="flex items-center gap-1">
              <EyeOff className="h-3.5 w-3.5" />
              {CHAT_LABELS.HIDE_THINKING}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {CHAT_LABELS.SHOW_THINKING}
            </div>
          )}
        </Button>
      </div>

      {isVisible && (
        <div className="mt-3 max-h-48 overflow-auto rounded-lg bg-background/70 p-3 text-xs text-muted-foreground">
          <pre className="whitespace-pre-wrap break-words font-sans leading-relaxed">
            {current.content.trim() || CHAT_LABELS.THINKING}
          </pre>
        </div>
      )}
    </div>
  );
}
