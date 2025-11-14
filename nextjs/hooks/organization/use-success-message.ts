"use client";

import { useState, useCallback } from "react";

/**
 * Hook for managing success messages with auto-dismiss
 */
export function useSuccessMessage(autoDismissDelay = 3000) {
  const [success, setSuccess] = useState("");

  const showSuccess = useCallback(
    (message: string) => {
      setSuccess(message);
      if (autoDismissDelay > 0) {
        setTimeout(() => setSuccess(""), autoDismissDelay);
      }
    },
    [autoDismissDelay]
  );

  const clearSuccess = useCallback(() => {
    setSuccess("");
  }, []);

  return {
    success,
    showSuccess,
    clearSuccess,
  };
}
