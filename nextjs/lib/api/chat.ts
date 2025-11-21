import { callFastApi } from "@/lib/api-client";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string | null;
  stream?: boolean;
  conversation_id?: string | null;
  system_prompt?: string | null;
  temperature?: number | null;
}

export interface ChatResponse {
  content: string;
  model: string;
  done: boolean;
}

export interface MessageResponse {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  model: string | null;
  created_at: string;
}

export interface ConversationResponse {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: MessageResponse[] | null;
}

export interface ConversationListResponse {
  conversations: ConversationResponse[];
  total: number;
}

export interface CreateConversationRequest {
  title: string;
}

export interface UpdateConversationRequest {
  title: string;
}

export async function getConversations(limit = 100, offset = 0): Promise<ConversationListResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  return callFastApi<ConversationListResponse>(`/chat/conversations?${params.toString()}`);
}

export async function getConversation(id: string): Promise<ConversationResponse> {
  return callFastApi<ConversationResponse>(`/chat/conversations/${id}`);
}

export async function createConversation(
  data: CreateConversationRequest
): Promise<ConversationResponse> {
  return callFastApi<ConversationResponse>("/chat/conversations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateConversation(
  id: string,
  data: UpdateConversationRequest
): Promise<ConversationResponse> {
  return callFastApi<ConversationResponse>(`/chat/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteConversation(id: string): Promise<void> {
  return callFastApi<void>(`/chat/conversations/${id}`, {
    method: "DELETE",
  });
}

export async function deleteMessage(id: string): Promise<void> {
  return callFastApi<void>(`/chat/messages/${id}`, {
    method: "DELETE",
  });
}
