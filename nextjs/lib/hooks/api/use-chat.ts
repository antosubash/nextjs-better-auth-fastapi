import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  type CreateConversationRequest,
  createConversation,
  deleteConversation,
  deleteMessage,
  getConversation,
  getConversations,
  getModels,
  type UpdateConversationRequest,
  updateConversation,
} from "@/lib/api/chat";
import { CHAT_ERRORS, CHAT_SUCCESS } from "@/lib/constants";
import { queryKeys } from "./query-keys";

export function useConversations(limit = 100, offset = 0) {
  return useQuery({
    queryKey: queryKeys.chat.conversations.list(limit, offset),
    queryFn: () => getConversations(limit, offset),
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: queryKeys.chat.conversations.detail(id || ""),
    queryFn: () => getConversation(id || ""),
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConversationRequest) => createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations.lists() });
      toast.success(CHAT_SUCCESS.CONVERSATION_CREATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || CHAT_ERRORS.CONVERSATION_CREATE_ERROR);
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConversationRequest }) =>
      updateConversation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations.detail(variables.id),
      });
      toast.success(CHAT_SUCCESS.CONVERSATION_UPDATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || CHAT_ERRORS.CONVERSATION_UPDATE_ERROR);
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations.lists() });
      toast.success(CHAT_SUCCESS.CONVERSATION_DELETED);
    },
    onError: (error: Error) => {
      toast.error(error.message || CHAT_ERRORS.CONVERSATION_DELETE_ERROR);
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations.lists() });
      toast.success(CHAT_SUCCESS.MESSAGE_DELETED);
    },
    onError: (error: Error) => {
      toast.error(error.message || CHAT_ERRORS.MESSAGE_DELETE_ERROR);
    },
  });
}

export function useModels() {
  return useQuery({
    queryKey: queryKeys.chat.models(),
    queryFn: () => getModels(),
  });
}
