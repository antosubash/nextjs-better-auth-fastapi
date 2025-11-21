"use client";

import { Plus } from "lucide-react";
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

  return (
    <div className="flex flex-col h-full border-r bg-background">
      <div className="p-4 border-b">
        <Button onClick={handleNewConversation} className="w-full" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {CHAT_LABELS.NEW_CONVERSATION}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">{CHAT_LABELS.LOADING}</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">{CHAT_LABELS.NO_CONVERSATIONS}</div>
        ) : (
          <div className="p-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={cn(
                  "w-full text-left p-2 rounded-lg hover:bg-accent cursor-pointer",
                  selectedConversationId === conversation.id && "bg-accent"
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <p className="text-sm font-medium truncate">{conversation.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(conversation.updated_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
