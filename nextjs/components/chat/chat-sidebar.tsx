"use client";

import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CHAT_LABELS } from "@/lib/constants";
import { useConversations, useCreateConversation } from "@/lib/hooks/api/use-chat";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  selectedConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
}

export function ChatSidebar({ selectedConversationId, onSelectConversation }: ChatSidebarProps) {
  const { data: conversationsData, isLoading } = useConversations();
  const createConversation = useCreateConversation();

  const conversations = conversationsData?.conversations || [];

  const handleNewConversation = async () => {
    const result = await createConversation.mutateAsync({
      title: CHAT_LABELS.NEW_CONVERSATION,
    });
    onSelectConversation(result.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="p-4 border-b">
        <Button
          onClick={handleNewConversation}
          className="w-full font-medium shadow-sm hover:shadow transition-shadow"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {CHAT_LABELS.NEW_CONVERSATION}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">{CHAT_LABELS.LOADING}</div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{CHAT_LABELS.NO_CONVERSATIONS}</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all duration-200",
                  "hover:bg-accent/80 cursor-pointer group",
                  selectedConversationId === conversation.id &&
                    "bg-accent shadow-sm ring-1 ring-border"
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare
                    className={cn(
                      "w-4 h-4 mt-0.5 shrink-0 transition-colors",
                      selectedConversationId === conversation.id
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conversation.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(conversation.updated_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
