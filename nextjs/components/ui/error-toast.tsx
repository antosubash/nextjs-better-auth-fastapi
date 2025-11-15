"use client";

import { AlertCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ErrorToastProps {
  message: string;
  onDismiss?: () => void;
  duration?: number;
}

export function ErrorToast({ message, onDismiss, duration = 5000 }: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) {
          setTimeout(onDismiss, 300); // Wait for fade-out animation
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      setTimeout(onDismiss, 300); // Wait for fade-out animation
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{message}</p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>
    </div>
  );
}

interface ErrorToastContainerProps {
  error: string | null;
  onDismiss: () => void;
  duration?: number;
}

export function ErrorToastContainer({
  error,
  onDismiss,
  duration = 5000,
}: ErrorToastContainerProps) {
  if (!error) {
    return null;
  }

  return <ErrorToast message={error} onDismiss={onDismiss} duration={duration} />;
}
