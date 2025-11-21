/**
 * Server-Sent Events (SSE) utility functions.
 * Provides utilities for handling SSE streams in the browser.
 */

import { createLogger } from "./logger";

const logger = createLogger("sse");

export interface SSEEvent {
  data: string;
  event?: string;
  id?: string;
  retry?: number;
}

export interface SSEOptions {
  onMessage?: (event: SSEEvent) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

/**
 * Parse SSE data line into an SSEEvent object.
 *
 * @param line - Raw SSE line (e.g., "data: {...}" or "event: message")
 * @returns Parsed SSE event or null if line is empty/invalid
 */
export function parseSSELine(line: string): Partial<SSEEvent> | null {
  if (!line.trim()) {
    return null;
  }

  const colonIndex = line.indexOf(":");
  if (colonIndex === -1) {
    return null;
  }

  const field = line.slice(0, colonIndex).trim();
  const value = line.slice(colonIndex + 1).trim();

  switch (field) {
    case "data":
      return { data: value };
    case "event":
      return { event: value };
    case "id":
      return { id: value };
    case "retry":
      return { retry: parseInt(value, 10) };
    default:
      return null;
  }
}

/**
 * Read SSE stream from a Response object.
 *
 * @param response - Fetch Response object with SSE stream
 * @param options - SSE event handlers and options
 * @returns AbortController for canceling the stream
 */
export function readSSEStream(response: Response, options: SSEOptions = {}): AbortController {
  const { onMessage, onError, onOpen, onClose } = options;
  const abortController = new AbortController();

  if (!response.body) {
    const error = new Error("Response body is null");
    logger.error("SSE stream error", error);
    onError?.(error);
    return abortController;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processEventLine = (line: string, currentEvent: Partial<SSEEvent>): Partial<SSEEvent> => {
    const parsed = parseSSELine(line);
    if (!parsed) {
      return currentEvent;
    }

    if (parsed.data !== undefined) {
      currentEvent.data = parsed.data;
    }
    if (parsed.event !== undefined) {
      currentEvent.event = parsed.event;
    }
    if (parsed.id !== undefined) {
      currentEvent.id = parsed.id;
    }
    if (parsed.retry !== undefined) {
      currentEvent.retry = parsed.retry;
    }

    return currentEvent;
  };

  const processLines = (lines: string[]): void => {
    let currentEvent: Partial<SSEEvent> = {};

    for (const line of lines) {
      currentEvent = processEventLine(line, currentEvent);

      // Empty line indicates end of event
      if (!line.trim() && currentEvent.data !== undefined) {
        onMessage?.(currentEvent as SSEEvent);
        currentEvent = {};
      }
    }
  };

  const processStream = async () => {
    try {
      onOpen?.();

      while (true) {
        if (abortController.signal.aborted) {
          break;
        }

        const { done, value } = await reader.read();

        if (done) {
          onClose?.();
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        processLines(lines);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        logger.error("SSE stream error", error);
        onError?.(error);
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // Ignore errors when releasing lock
      }
    }
  };

  processStream().catch((error) => {
    logger.error("SSE stream processing error", error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
  });

  return abortController;
}

/**
 * Create an SSE connection using EventSource API.
 * Note: EventSource only supports GET requests and doesn't support custom headers.
 * For POST requests or custom headers, use readSSEStream instead.
 *
 * @param url - SSE endpoint URL
 * @param options - SSE event handlers
 * @returns EventSource instance
 */
export function createSSEConnection(url: string, options: SSEOptions = {}): EventSource {
  const { onMessage, onError, onOpen, onClose } = options;

  const eventSource = new EventSource(url);

  eventSource.onopen = () => {
    logger.debug("SSE connection opened", { url });
    onOpen?.();
  };

  eventSource.onmessage = (event) => {
    const sseEvent: SSEEvent = {
      data: event.data,
      event: event.type,
      id: event.lastEventId,
    };
    onMessage?.(sseEvent);
  };

  eventSource.onerror = (error) => {
    logger.error("SSE connection error", error);
    if (eventSource.readyState === EventSource.CLOSED) {
      onClose?.();
    }
    onError?.(new Error("SSE connection error"));
  };

  // Handle custom event types
  eventSource.addEventListener("error", (event) => {
    const sseEvent: SSEEvent = {
      data: (event as MessageEvent).data || "",
      event: "error",
    };
    onMessage?.(sseEvent);
  });

  return eventSource;
}

/**
 * Fetch SSE stream with POST support and custom headers.
 * This is a wrapper around fetch() that handles SSE streams properly.
 *
 * @param url - SSE endpoint URL
 * @param options - Fetch options and SSE handlers
 * @returns AbortController for canceling the stream
 */
export function fetchSSE(url: string, options: RequestInit & SSEOptions = {}): AbortController {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    headers,
    body,
    method = "POST",
    ...fetchOptions
  } = options;

  const abortController = new AbortController();

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "text/event-stream");
  requestHeaders.set("Cache-Control", "no-cache");

  fetch(url, {
    ...fetchOptions,
    method,
    headers: requestHeaders,
    body,
    signal: abortController.signal,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`SSE request failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("text/event-stream")) {
        logger.warn("Response is not SSE stream", { contentType });
      }

      return readSSEStream(response, {
        onMessage,
        onError,
        onOpen,
        onClose,
      });
    })
    .catch((error) => {
      if (error.name !== "AbortError") {
        logger.error("SSE fetch error", error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    });

  return abortController;
}
