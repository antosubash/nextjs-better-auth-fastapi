import { useCallback, useEffect, useRef, useState } from "react";

export function useChatScroll(
  messages: unknown[],
  isLoading: boolean,
  selectedConversationId: string | null
) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const getViewport = useCallback(() => {
    return scrollContainerRef.current;
  }, []);

  // Auto-scroll to bottom when new messages arrive or during streaming
  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;

    const scrollToBottom = (smooth = true) => {
      const scrollHeight = viewport.scrollHeight;
      const clientHeight = viewport.clientHeight;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);

      viewport.scrollTo({
        top: maxScroll,
        behavior: smooth ? "smooth" : "auto",
      });
      setShowScrollButton(false);
    };

    // Auto-scroll during streaming or when new messages arrive
    if (isLoading || messages.length > 0) {
      const scrollHeight = viewport.scrollHeight;
      const scrollTop = viewport.scrollTop;
      const clientHeight = viewport.clientHeight;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

      if (isNearBottom) {
        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToBottom(true);
          }, 50);
        });
      }
    }
  }, [messages, isLoading, getViewport]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    const viewport = getViewport();
    if (viewport && selectedConversationId) {
      // Wait for DOM to update
      requestAnimationFrame(() => {
        setTimeout(() => {
          const scrollHeight = viewport.scrollHeight;
          const clientHeight = viewport.clientHeight;
          const maxScroll = Math.max(0, scrollHeight - clientHeight);
          viewport.scrollTo({
            top: maxScroll,
            behavior: "auto",
          });
        }, 150);
      });
    }
  }, [selectedConversationId, getViewport]);

  // Scroll to bottom when messages are loaded initially
  useEffect(() => {
    if (messages.length > 0) {
      const viewport = getViewport();
      if (viewport) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const scrollHeight = viewport.scrollHeight;
            const clientHeight = viewport.clientHeight;
            const maxScroll = Math.max(0, scrollHeight - clientHeight);
            viewport.scrollTo({
              top: maxScroll,
              behavior: "auto",
            });
          }, 100);
        });
      }
    }
  }, [messages.length, getViewport]);

  const handleScrollToBottom = useCallback(() => {
    const viewport = getViewport();
    if (viewport) {
      const scrollHeight = viewport.scrollHeight;
      const clientHeight = viewport.clientHeight;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      viewport.scrollTo({
        top: maxScroll,
        behavior: "smooth",
      });
      setShowScrollButton(false);
    }
  }, [getViewport]);

  return {
    scrollContainerRef,
    messagesEndRef,
    showScrollButton,
    setShowScrollButton,
    handleScrollToBottom,
  };
}
