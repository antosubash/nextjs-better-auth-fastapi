"use client";

import { Bot, Check, Copy, RotateCcw, User } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CHAT_ERRORS, CHAT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  onRegenerate?: () => void;
  isLast?: boolean;
  showTimestamps?: boolean;
}

export function ChatMessage({
  role,
  content,
  createdAt,
  onRegenerate,
  isLast,
  showTimestamps = true,
}: ChatMessageProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const [codeBlockCopied, setCodeBlockCopied] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success(CHAT_LABELS.COPY_MESSAGE);
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      toast.error(CHAT_ERRORS.COPY_FAILED);
    }
  };

  const handleCopyCode = async (code: string, language?: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeBlockCopied(code);
      toast.success(`Copied ${language || "code"} to clipboard`);
      setTimeout(() => setCodeBlockCopied(null), 2000);
    } catch (_err) {
      toast.error(CHAT_ERRORS.COPY_FAILED);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return null;
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10">
          <Bot className="w-5 h-5 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-sm transition-all",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md border border-border/50"
          )}
        >
          <div className="space-y-2">
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-pre:bg-[#1e1e1e] prose-code:text-sm">
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
                      const codeContent = String(children).replace(/\n$/, "");
                      const language = match ? match[1] : undefined;

                      return !inline && match ? (
                        <div className="relative group">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                              "bg-background/80 hover:bg-background border shadow-sm"
                            )}
                            onClick={() => handleCopyCode(codeContent, language)}
                            title={`Copy ${language} code`}
                          >
                            {codeBlockCopied === codeContent ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: "0.5rem 0",
                              borderRadius: "0.5rem",
                              fontSize: "0.875rem",
                            }}
                            {...(props as Record<string, unknown>)}
                          >
                            {codeContent}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code
                          className={cn(
                            "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm",
                            className
                          )}
                          {...(props as Record<string, unknown>)}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 px-1">
          {showTimestamps && createdAt && (
            <span className="text-xs text-muted-foreground">{formatTime(createdAt)}</span>
          )}
          {!isUser && onRegenerate && isLast && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
              onClick={onRegenerate}
              title="Regenerate response"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="sr-only">{CHAT_LABELS.REGENERATE_RESPONSE}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
              isUser && "hover:bg-primary/20"
            )}
            onClick={handleCopy}
            title={CHAT_LABELS.COPY_MESSAGE}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="sr-only">{CHAT_LABELS.COPY_MESSAGE}</span>
          </Button>
        </div>
      </div>
      {isUser && (
        <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10">
          <User className="w-5 h-5 text-primary" />
        </div>
      )}
    </div>
  );
}
