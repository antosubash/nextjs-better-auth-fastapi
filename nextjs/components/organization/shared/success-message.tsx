"use client";

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
    <div
      className={`p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {message}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
          aria-label="Dismiss success message"
        >
          ×
        </button>
      )}
    </div>
  );
}
