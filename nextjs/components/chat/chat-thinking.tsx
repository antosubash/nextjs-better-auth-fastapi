"use client";

import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CHAT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ChatThinkingProps {
  thinking: string;
  isStreaming?: boolean;
}

export function ChatThinking({ thinking, isStreaming }: ChatThinkingProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!thinking) {
    return null;
  }

  return (
    <div className="mb-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Brain className="w-3 h-3 mr-1" />
        {isExpanded ? CHAT_LABELS.HIDE_THINKING : CHAT_LABELS.SHOW_THINKING}
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 ml-1" />
        ) : (
          <ChevronDown className="w-3 h-3 ml-1" />
        )}
        {isStreaming && (
          <span className="ml-2 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            {CHAT_LABELS.THINKING}
          </span>
        )}
      </Button>
      {isExpanded && (
        <Card className="mt-2 border-dashed border-muted-foreground/30">
          <CardContent className="p-3">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: ({
                    inline,
                    className,
                    children,
                    ...props
                  }: {
                    inline?: boolean;
                    className?: string;
                    children?: React.ReactNode;
                  }) => {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...(props as Record<string, unknown>)}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...(props as Record<string, unknown>)}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {thinking}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
