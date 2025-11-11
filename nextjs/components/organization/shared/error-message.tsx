"use client";

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorMessage({
  message,
  onDismiss,
  className = "",
}: ErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {message}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          aria-label="Dismiss error message"
        >
          ×
        </button>
      )}
    </div>
  );
}

