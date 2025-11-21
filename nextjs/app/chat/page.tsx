import { ChatContainer } from "@/components/chat/chat-container";
import { PAGE_CONTAINER } from "@/lib/constants";

export default function ChatPage() {
  return (
    <main className={PAGE_CONTAINER.CLASS}>
      <div className="h-[calc(100vh-12rem)] rounded-lg border bg-card">
        <ChatContainer />
      </div>
    </main>
  );
}
