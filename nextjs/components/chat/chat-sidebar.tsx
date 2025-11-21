"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CHAT_LABELS } from "@/lib/constants";
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useUpdateConversation,
} from "@/lib/hooks/api/use-chat";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  selectedConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
}

export function ChatSidebar({ selectedConversationId, onSelectConversation }: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: conversationsData, isLoading } = useConversations();
  const createConversation = useCreateConversation();
  const updateConversation = useUpdateConversation();
  const deleteConversation = useDeleteConversation();

  const conversations = conversationsData?.conversations || [];

  const handleNewConversation = async () => {
    const result = await createConversation.mutateAsync({
      title: CHAT_LABELS.NEW_CONVERSATION,
    });
    onSelectConversation(result.id);
  };

  const handleStartEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = async (id: string) => {
    if (editingTitle.trim()) {
      await updateConversation.mutateAsync({
        id,
        data: { title: editingTitle.trim() },
      });
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteConversation.mutateAsync(deleteId);
      if (selectedConversationId === deleteId) {
        onSelectConversation(null);
      }
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
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
              <div
                key={conversation.id}
                className={cn(
                  "group flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer",
                  selectedConversationId === conversation.id && "bg-accent"
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                {editingId === conversation.id ? (
                  <div
                    className="flex-1 flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleSaveEdit(conversation.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveEdit(conversation.id);
                        } else if (e.key === "Escape") {
                          handleCancelEdit();
                        }
                      }}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conversation.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversation.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(conversation.id, conversation.title);
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                        <span className="sr-only">{CHAT_LABELS.EDIT_TITLE}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(conversation.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="sr-only">{CHAT_LABELS.DELETE_CONVERSATION}</span>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{CHAT_LABELS.DELETE_CONVERSATION}</AlertDialogTitle>
            <AlertDialogDescription>
              {CHAT_LABELS.CONFIRM_DELETE_CONVERSATION}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{CHAT_LABELS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {CHAT_LABELS.DELETE_CONVERSATION}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
