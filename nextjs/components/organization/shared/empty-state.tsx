"use client";

import { Empty, EmptyDescription } from "@/components/ui/empty";

interface EmptyStateProps {
  message: string;
  className?: string;
}

export function EmptyState({ message, className = "" }: EmptyStateProps) {
  return (
    <Empty className={className} role="status" aria-live="polite">
      <EmptyDescription>{message}</EmptyDescription>
    </Empty>
  );
}
