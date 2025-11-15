"use client";

import { Empty, EmptyDescription } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Loading...", className = "" }: LoadingStateProps) {
  return (
    <Empty className={cn(className)} role="status" aria-live="polite">
      <Spinner className="mx-auto mb-2" />
      <EmptyDescription>{message}</EmptyDescription>
    </Empty>
  );
}
