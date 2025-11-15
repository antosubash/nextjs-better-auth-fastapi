"use client";

import { X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function SuccessMessage({ message, onDismiss, className = "" }: SuccessMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <Alert className={cn(className)} role="alert" aria-live="polite">
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDismiss}
            className="ml-2 h-auto w-auto p-1"
            aria-label="Dismiss success message"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
