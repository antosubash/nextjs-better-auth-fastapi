"use client";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  className = "",
}: LoadingStateProps) {
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

