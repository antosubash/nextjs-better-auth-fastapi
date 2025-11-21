"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHAT_LABELS, CHAT_MODELS } from "@/lib/constants";

interface ChatHeaderProps {
  model: string;
  onModelChange: (model: string) => void;
  onClear: () => void;
}

export function ChatHeader({ model, onModelChange, onClear }: ChatHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">{CHAT_LABELS.CHAT_WITH_AI}</h2>
        <Select value={model} onValueChange={onModelChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={CHAT_LABELS.SELECT_MODEL} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CHAT_MODELS.QWEN_8B}>Qwen 8B</SelectItem>
            <SelectItem value={CHAT_MODELS.QWEN_14B}>Qwen 14B</SelectItem>
            <SelectItem value={CHAT_MODELS.LLAMA2}>Llama 2</SelectItem>
            <SelectItem value={CHAT_MODELS.MISTRAL}>Mistral</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Trash2 className="w-4 h-4" />
            <span className="sr-only">{CHAT_LABELS.CLEAR_CHAT}</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{CHAT_LABELS.CLEAR_CHAT}</AlertDialogTitle>
            <AlertDialogDescription>{CHAT_LABELS.CONFIRM_CLEAR}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{CHAT_LABELS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              {CHAT_LABELS.CLEAR_CHAT}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
