import { Suspense } from "react";
import { ChatContainer } from "@/components/chat/chat-container";
import { CHAT_LABELS, PAGE_CONTAINER } from "@/lib/constants";

export default function ChatPage() {
  return (
    <main className={PAGE_CONTAINER.CLASS}>
      <div className="h-[calc(100vh-12rem)] rounded-lg border bg-card">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">{CHAT_LABELS.LOADING}</div>
          }
        >
          <ChatContainer />
        </Suspense>
      </div>
    </main>
  );
}
