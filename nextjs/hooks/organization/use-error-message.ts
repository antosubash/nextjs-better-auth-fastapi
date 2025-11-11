"use client";

import { useState, useCallback } from "react";

/**
 * Hook for managing error messages
 */
export function useErrorMessage() {
  const [error, setError] = useState("");

  const showError = useCallback((message: string) => {
    setError(message);
  }, []);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    error,
    showError,
    clearError,
  };
}

