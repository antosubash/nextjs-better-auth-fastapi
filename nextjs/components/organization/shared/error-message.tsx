"use client";

import { X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorMessage({ message, onDismiss, className = "" }: ErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <Alert variant="destructive" className={cn(className)} role="alert" aria-live="assertive">
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDismiss}
            className="ml-2 h-auto w-auto p-1 hover:bg-destructive/20"
            aria-label="Dismiss error message"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
