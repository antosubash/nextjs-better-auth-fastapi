"use client";

import { Clock, Menu, Square, Trash2 } from "lucide-react";
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
import { CHAT_LABELS } from "@/lib/constants";
import { useModels } from "@/lib/hooks/api/use-chat";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  model: string;
  onModelChange: (model: string) => void;
  onClear: () => void;
  isStreaming?: boolean;
  onStop?: () => void;
  onToggleSidebar?: () => void;
  showTimestamps?: boolean;
  onToggleTimestamps?: () => void;
  systemPrompt?: string;
  onSystemPromptChange?: (prompt: string) => void;
  temperature?: number | null;
  onTemperatureChange?: (temp: number | null) => void;
}

export function ChatHeader({
  model,
  onModelChange,
  onClear,
  isStreaming = false,
  onStop,
  onToggleSidebar,
  showTimestamps = true,
  onToggleTimestamps,
}: ChatHeaderProps) {
  const [open, setOpen] = useState(false);
  const { data: modelsData, isLoading: modelsLoading } = useModels();

  if (modelsLoading) {
    return (
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{CHAT_LABELS.CHAT_WITH_AI}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden h-9 w-9"
          >
            <Menu className="w-4 h-4" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        )}
        <h2 className="text-lg font-semibold">{CHAT_LABELS.CHAT_WITH_AI}</h2>
        <Select value={model} onValueChange={onModelChange} disabled={modelsLoading}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue
              placeholder={modelsLoading ? "Loading models..." : CHAT_LABELS.SELECT_MODEL}
            />
          </SelectTrigger>
          <SelectContent>
            {modelsData?.models
              ?.filter((modelInfo) => modelInfo.name?.trim())
              .map((modelInfo, index) => (
                <SelectItem key={`${modelInfo.name}-${index}`} value={modelInfo.name}>
                  {modelInfo.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        {onToggleTimestamps && (
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleTimestamps}
            className={cn("h-9 w-9 transition-colors", showTimestamps && "bg-accent")}
            title={showTimestamps ? "Hide timestamps" : "Show timestamps"}
          >
            <Clock className="w-4 h-4" />
            <span className="sr-only">
              {showTimestamps ? "Hide timestamps" : "Show timestamps"}
            </span>
          </Button>
        )}
        {isStreaming && onStop && (
          <Button
            variant="outline"
            size="icon"
            onClick={onStop}
            className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
          >
            <Square className="w-4 h-4" />
            <span className="sr-only">{CHAT_LABELS.STOP_GENERATION}</span>
          </Button>
        )}
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
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
    </div>
  );
}
