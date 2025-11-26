import { useCallback, useEffect, useState } from "react";
import { CHAT_ERRORS } from "@/lib/constants";

interface ErrorState {
  message: string;
  type: "network" | "server" | "validation" | "unknown";
  canRetry: boolean;
}

export function useChatError(chatError: Error | null | undefined) {
  const [errorState, setErrorState] = useState<ErrorState | null>(null);

  const determineErrorType = useCallback(
    (
      errorMessage?: string
    ): { type: "network" | "server" | "validation" | "unknown"; canRetry: boolean } => {
      if (errorMessage?.includes("Failed to fetch") || errorMessage?.includes("NetworkError")) {
        return { type: "network", canRetry: true };
      }
      if (
        errorMessage?.includes("500") ||
        errorMessage?.includes("502") ||
        errorMessage?.includes("503")
      ) {
        return { type: "server", canRetry: true };
      }
      if (errorMessage?.includes("400") || errorMessage?.includes("422")) {
        return { type: "validation", canRetry: false };
      }
      return { type: "unknown", canRetry: true };
    },
    []
  );

  useEffect(() => {
    if (chatError) {
      const { type, canRetry } = determineErrorType(chatError.message);
      setErrorState({
        message: chatError.message || CHAT_ERRORS.SEND_FAILED,
        type,
        canRetry,
      });
    } else {
      setErrorState(null);
    }
  }, [chatError, determineErrorType]);

  const errorMessage = chatError?.message || (chatError ? CHAT_ERRORS.SEND_FAILED : null);

  return {
    errorState,
    errorMessage,
    setErrorState,
  };
}
