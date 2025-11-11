"use client";

interface EmptyStateProps {
  message: string;
  className?: string;
}

export function EmptyState({
  message,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`p-8 text-center text-gray-600 dark:text-gray-400 ${className}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

