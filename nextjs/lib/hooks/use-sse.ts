/**
 * React hook for consuming Server-Sent Events (SSE) streams.
 * Provides a simple interface for handling SSE connections in React components.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createLogger } from "@/lib/utils/logger";
import { fetchSSE, type SSEEvent, type SSEOptions } from "@/lib/utils/sse";

const logger = createLogger("use-sse");

export interface UseSSEOptions
  extends Omit<SSEOptions, "onMessage" | "onError" | "onOpen" | "onClose"> {
  url?: string;
  enabled?: boolean;
  onMessage?: (event: SSEEvent) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  body?: BodyInit;
  method?: string;
}

export interface UseSSEReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

/**
 * React hook for consuming Server-Sent Events streams.
 *
 * @param options - SSE configuration options
 * @returns SSE connection state and control functions
 *
 * @example
 * ```tsx
 * const { isConnected, error, connect, disconnect } = useSSE({
 *   url: "/api/chat",
 *   body: JSON.stringify({ messages: [...] }),
 *   onMessage: (event) => {
 *     console.log("Received:", event.data);
 *   },
 *   onError: (error) => {
 *     console.error("SSE error:", error);
 *   },
 * });
 * ```
 */
export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const {
    url,
    enabled = true,
    onMessage,
    onError,
    onOpen,
    onClose,
    body,
    method = "POST",
    headers,
    ...sseOptions
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize sseOptions ref
  const sseOptionsRef = useRef(sseOptions);

  // Keep sseOptions ref updated without causing dependency issues
  useEffect(() => {
    sseOptionsRef.current = sseOptions;
  });

  const handleMessage = useCallback(
    (event: SSEEvent) => {
      logger.debug("SSE message received", { event: event.event, dataLength: event.data.length });
      onMessage?.(event);
    },
    [onMessage]
  );

  const handleError = useCallback(
    (err: Error) => {
      logger.error("SSE error", err);
      setError(err);
      setIsConnected(false);
      setIsConnecting(false);
      onError?.(err);
    },
    [onError]
  );

  const handleOpen = useCallback(() => {
    logger.debug("SSE connection opened");
    setIsConnected(true);
    setIsConnecting(false);
    setError(null);
    onOpen?.();
  }, [onOpen]);

  const handleClose = useCallback(() => {
    logger.debug("SSE connection closed");
    setIsConnected(false);
    setIsConnecting(false);
    onClose?.();
  }, [onClose]);

  const connect = useCallback(() => {
    if (!url) {
      logger.warn("Cannot connect: URL is required");
      return;
    }

    // Disconnect existing connection if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsConnecting(true);
    setError(null);

    abortControllerRef.current = fetchSSE(url, {
      ...sseOptionsRef.current,
      method,
      body,
      headers,
      onMessage: handleMessage,
      onError: handleError,
      onOpen: handleOpen,
      onClose: handleClose,
    });
  }, [url, method, body, headers, handleMessage, handleError, handleOpen, handleClose]);

  const disconnect = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    // Small delay to ensure cleanup
    setTimeout(() => {
      connect();
    }, 100);
  }, [connect, disconnect]);

  // Auto-connect when enabled and URL is provided
  useEffect(() => {
    if (enabled && url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, url, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    reconnect,
  };
}
