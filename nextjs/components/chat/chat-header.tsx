"use client";

import { Square, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CHAT_LABELS, CHAT_MODELS } from "@/lib/constants";

interface ChatHeaderProps {
  model: string;
  onModelChange: (model: string) => void;
  onClear: () => void;
  isStreaming?: boolean;
  onStop?: () => void;
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
  systemPrompt = "",
  onSystemPromptChange,
  temperature = null,
  onTemperatureChange,
}: ChatHeaderProps) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
        {(onSystemPromptChange || onTemperatureChange) && (
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                {onSystemPromptChange && (
                  <div className="space-y-2">
                    <Label htmlFor="system-prompt">{CHAT_LABELS.SYSTEM_PROMPT}</Label>
                    <Input
                      id="system-prompt"
                      value={systemPrompt}
                      onChange={(e) => onSystemPromptChange(e.target.value)}
                      placeholder={CHAT_LABELS.SYSTEM_PROMPT_PLACEHOLDER}
                    />
                  </div>
                )}
                {onTemperatureChange && (
                  <div className="space-y-2">
                    <Label htmlFor="temperature">
                      {CHAT_LABELS.TEMPERATURE}: {temperature ?? 1.0}
                    </Label>
                    <Slider
                      id="temperature"
                      min={0}
                      max={2}
                      step={0.1}
                      value={temperature !== null ? [temperature] : [1.0]}
                      onValueChange={(value) => onTemperatureChange(value[0])}
                    />
                    <p className="text-xs text-muted-foreground">
                      {CHAT_LABELS.TEMPERATURE_DESCRIPTION}
                    </p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isStreaming && onStop && (
          <Button variant="outline" size="icon" onClick={onStop}>
            <Square className="w-4 h-4" />
            <span className="sr-only">{CHAT_LABELS.STOP_GENERATION}</span>
          </Button>
        )}
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
    </div>
  );
}
