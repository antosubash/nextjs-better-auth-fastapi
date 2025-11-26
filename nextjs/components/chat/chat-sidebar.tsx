"use client";

import { MessageSquare, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CHAT_LABELS } from "@/lib/constants";
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
} from "@/lib/hooks/api/use-chat";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  selectedConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
}

export function ChatSidebar({ selectedConversationId, onSelectConversation }: ChatSidebarProps) {
  const { data: conversationsData, isLoading } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const conversations = conversationsData?.conversations || [];

  const filteredConversations = conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    try {
      await deleteConversation.mutateAsync(conversationToDelete);
      // Clear selection if the deleted conversation was selected
      if (selectedConversationId === conversationToDelete) {
        onSelectConversation(null);
      }
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    } catch (_error) {
      // Error is handled by the mutation hook (toast notification)
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  return (
    <div className="flex flex-col h-full border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="p-4 border-b space-y-3">
        <Button
          onClick={handleNewConversation}
          className="w-full font-medium shadow-sm hover:shadow transition-shadow"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {CHAT_LABELS.NEW_CONVERSATION}
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
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
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{CHAT_LABELS.NO_CONVERSATIONS_FOUND}</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "relative w-full rounded-lg transition-all duration-200 group",
                    isSelected && "bg-primary/10 ring-2 ring-primary/20 shadow-md"
                  )}
                >
                  <button
                    type="button"
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all duration-200",
                      "hover:bg-accent/80 cursor-pointer",
                      isSelected && "bg-transparent"
                    )}
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare
                        className={cn(
                          "w-4 h-4 mt-0.5 shrink-0 transition-colors",
                          isSelected
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            isSelected && "text-primary font-semibold"
                          )}
                        >
                          {conversation.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(conversation.updated_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                      "hover:bg-destructive/10 hover:text-destructive",
                      isSelected && "opacity-100"
                    )}
                    onClick={(e) => handleDeleteClick(e, conversation.id)}
                    aria-label={CHAT_LABELS.DELETE_CONVERSATION}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{CHAT_LABELS.DELETE_CONVERSATION}</DialogTitle>
            <DialogDescription>{CHAT_LABELS.CONFIRM_DELETE_CONVERSATION}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              {CHAT_LABELS.CANCEL}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteConversation.isPending}
            >
              {deleteConversation.isPending ? CHAT_LABELS.LOADING : CHAT_LABELS.DELETE_CONVERSATION}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
