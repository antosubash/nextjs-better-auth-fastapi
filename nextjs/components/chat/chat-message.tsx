"use client";

import { Bot, Copy, RefreshCw, Trash2, User } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteMessage } from "@/lib/hooks/api/use-chat";
import { CHAT_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  onRegenerate?: () => void;
}

export function ChatMessage({ id, role, content, createdAt, onRegenerate }: ChatMessageProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteMessage = useDeleteMessage();
  const isUser = role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(CHAT_LABELS.COPY_MESSAGE);
    } catch (err) {
      toast.error("Failed to copy message");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMessage.mutateAsync(id);
      setDeleteDialogOpen(false);
    } catch (err) {
      // Error handled by mutation
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <>
      <div className={cn("flex gap-3 group", isUser ? "justify-end" : "justify-start")}>
        {!isUser && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
        )}
        <Card className={cn("max-w-[80%]", isUser ? "bg-primary text-primary-foreground" : "")}>
          <CardContent className="p-4">
            <div className="space-y-2">
              {isUser ? (
                <p className="text-sm whitespace-pre-wrap wrap-break-word">{content}</p>
              ) : (
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
                    {content}
                  </ReactMarkdown>
                </div>
              )}
              {createdAt && (
                <p className={cn("text-xs opacity-70", isUser && "text-primary-foreground/70")}>
                  {formatDate(createdAt)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
                title={CHAT_LABELS.COPY_MESSAGE}
              >
                <Copy className="w-3 h-3" />
                <span className="sr-only">{CHAT_LABELS.COPY_MESSAGE}</span>
              </Button>
              {!isUser && onRegenerate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onRegenerate}
                  title={CHAT_LABELS.REGENERATE}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span className="sr-only">{CHAT_LABELS.REGENERATE}</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setDeleteDialogOpen(true)}
                title={CHAT_LABELS.DELETE_MESSAGE}
              >
                <Trash2 className="w-3 h-3" />
                <span className="sr-only">{CHAT_LABELS.DELETE_MESSAGE}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        {isUser && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{CHAT_LABELS.DELETE_MESSAGE}</AlertDialogTitle>
            <AlertDialogDescription>{CHAT_LABELS.CONFIRM_DELETE_MESSAGE}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{CHAT_LABELS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {CHAT_LABELS.DELETE_MESSAGE}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
