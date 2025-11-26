import type { UIMessage } from "ai";

export function createUserMessage(text: string): UIMessage {
  return {
    id: crypto.randomUUID(),
    role: "user",
    parts: [{ type: "text", text }],
  };
}

export function convertMessagesToApiFormat(msgs: UIMessage[]) {
  return msgs.map((msg: UIMessage) => {
    const textPart = msg.parts.find((p) => p.type === "text");
    return {
      role: msg.role,
      content: textPart && "text" in textPart ? (textPart.text as string) : "",
    };
  });
}

export function parseStreamingData(data: string): string | null {
  if (data === "[DONE]") return null;
  try {
    const parsed = JSON.parse(data);
    return parsed.choices?.[0]?.delta?.content || null;
  } catch {
    return null;
  }
}

export function parseMessageIds(line: string): {
  user_message_id?: string;
  assistant_message_id?: string;
} | null {
  if (!line.trim().startsWith(":message_ids")) return null;
  try {
    const jsonStr = line.slice(":message_ids".length).trim();
    if (!jsonStr) return null;
    const parsed = JSON.parse(jsonStr);
    return {
      user_message_id: parsed.user_message_id,
      assistant_message_id: parsed.assistant_message_id,
    };
  } catch {
    return null;
  }
}

export function processStreamingChunk(
  chunk: string,
  assistantMessageId: string,
  setMessages: (messages: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void,
  assistantContent: string
): string {
  const lines = chunk.split("\n");
  let newContent = assistantContent;

  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;

    const content = parseStreamingData(line.slice(6));
    if (content) {
      newContent += content;
      // Use functional update to get current messages state
      setMessages((prevMessages) => {
        // Find if assistant message already exists
        const assistantIndex = prevMessages.findIndex(
          (msg) => msg.id === assistantMessageId && msg.role === "assistant"
        );

        if (assistantIndex >= 0) {
          // Update existing assistant message
          const updated = [...prevMessages];
          updated[assistantIndex] = {
            id: assistantMessageId,
            role: "assistant",
            parts: [{ type: "text", text: newContent }],
          };
          return updated;
        } else {
          // Add new assistant message
          return [
            ...prevMessages,
            {
              id: assistantMessageId,
              role: "assistant",
              parts: [{ type: "text", text: newContent }],
            },
          ];
        }
      });
    }
  }

  return newContent;
}

interface StreamState {
  assistantMessageId: string;
  userMessageId?: string;
  assistantContent: string;
}

function createUpdateMessageId(
  setMessages: (messages: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void
) {
  return (messageId: string, role: "user" | "assistant", newId: string) => {
    setMessages((prevMessages) => {
      const messageIndex = prevMessages.findIndex(
        (msg) => msg.id === messageId && msg.role === role
      );
      if (messageIndex >= 0) {
        const updated = [...prevMessages];
        updated[messageIndex] = {
          ...updated[messageIndex],
          id: newId,
        };
        return updated;
      }
      return prevMessages;
    });
  };
}

function initializeStreamState(updatedMessages: UIMessage[]): StreamState {
  const assistantMessageId = crypto.randomUUID();
  const userMessages = updatedMessages.filter((msg) => msg.role === "user");
  const userMessageId = userMessages[userMessages.length - 1]?.id;

  return {
    assistantMessageId,
    userMessageId,
    assistantContent: "",
  };
}

function addInitialAssistantMessage(
  state: StreamState,
  updatedMessages: UIMessage[],
  setMessages: (messages: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void
) {
  setMessages([
    ...updatedMessages,
    {
      id: state.assistantMessageId,
      role: "assistant",
      parts: [{ type: "text", text: "" }],
    },
  ]);
}

function processMessageIds(
  line: string,
  state: StreamState,
  updateMessageId: (messageId: string, role: "user" | "assistant", newId: string) => void
) {
  const messageIds = parseMessageIds(line);
  if (!messageIds) return;

  if (messageIds.user_message_id && state.userMessageId !== messageIds.user_message_id) {
    if (state.userMessageId) {
      const oldUserMessageId = state.userMessageId;
      state.userMessageId = messageIds.user_message_id;
      updateMessageId(oldUserMessageId, "user", state.userMessageId);
    }
  }

  if (
    messageIds.assistant_message_id &&
    state.assistantMessageId !== messageIds.assistant_message_id
  ) {
    const oldAssistantMessageId = state.assistantMessageId;
    state.assistantMessageId = messageIds.assistant_message_id;
    updateMessageId(oldAssistantMessageId, "assistant", state.assistantMessageId);
  }
}

async function processStreamChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  state: StreamState,
  updateMessageId: (messageId: string, role: "user" | "assistant", newId: string) => void,
  setMessages: (messages: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void
) {
  const { done, value } = await reader.read();
  if (done) return true;

  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk.split("\n");

  for (const line of lines) {
    processMessageIds(line, state, updateMessageId);
  }

  state.assistantContent = processStreamingChunk(
    chunk,
    state.assistantMessageId,
    setMessages,
    state.assistantContent
  );

  return false;
}

export async function handleStreamingResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  updatedMessages: UIMessage[],
  setMessages: (messages: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void
) {
  const decoder = new TextDecoder();
  const state = initializeStreamState(updatedMessages);
  const updateMessageId = createUpdateMessageId(setMessages);

  addInitialAssistantMessage(state, updatedMessages, setMessages);

  while (true) {
    const isDone = await processStreamChunk(reader, decoder, state, updateMessageId, setMessages);

    if (isDone) break;
  }
}

export function getMessagesBeforeLastAssistant(msgs: UIMessage[]) {
  const lastAssistantIndex = msgs
    .map((msg, idx) => ({ msg, idx }))
    .filter(({ msg }) => msg.role === "assistant")
    .pop()?.idx;

  return lastAssistantIndex !== undefined ? msgs.slice(0, lastAssistantIndex) : null;
}
