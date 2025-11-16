import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { INVITATION_ERRORS, INVITATION_SUCCESS } from "@/lib/constants";
import { queryKeys } from "./query-keys";

export function useListInvitations(organizationId: string) {
  return useQuery({
    queryKey: queryKeys.auth.invitations.list(organizationId),
    queryFn: async () => {
      const result = await authClient.organization.listInvitations({
        query: {},
      });
      if (result.error) {
        throw new Error(result.error.message || INVITATION_ERRORS.LOAD_INVITATIONS_FAILED);
      }
      return result.data || [];
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; email: string; role: string }) => {
      const result = await (
        authClient.organization as unknown as {
          createInvitation: (params: {
            organizationId: string;
            email: string;
            role: string;
          }) => Promise<{ error?: { message?: string }; data?: unknown }>;
        }
      ).createInvitation({
        organizationId: data.organizationId,
        email: data.email,
        role: data.role,
      });
      if (result.error) {
        throw new Error(result.error.message || INVITATION_ERRORS.SEND_FAILED);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.invitations.list(variables.organizationId),
      });
      toast.success(INVITATION_SUCCESS.INVITATION_SENT);
    },
    onError: (error: Error) => {
      toast.error(error.message || INVITATION_ERRORS.SEND_FAILED);
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const result = await authClient.organization.acceptInvitation({
        invitationId: token,
      });
      if (result.error) {
        throw new Error(result.error.message || INVITATION_ERRORS.ACCEPT_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.organizations() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      toast.success(INVITATION_SUCCESS.INVITATION_ACCEPTED);
    },
    onError: (error: Error) => {
      toast.error(error.message || INVITATION_ERRORS.ACCEPT_FAILED);
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId?: string; invitationId: string }) => {
      const result = await authClient.organization.cancelInvitation({
        invitationId: data.invitationId,
      });
      if (result.error) {
        throw new Error(result.error.message || INVITATION_ERRORS.CANCEL_FAILED);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      if (variables.organizationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.auth.invitations.list(variables.organizationId),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.invitations.all() });
      }
      toast.success(INVITATION_SUCCESS.INVITATION_CANCELLED);
    },
    onError: (error: Error) => {
      toast.error(error.message || INVITATION_ERRORS.CANCEL_FAILED);
    },
  });
}

export function useRejectInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const result = await authClient.organization.rejectInvitation({
        invitationId: token,
      });
      if (result.error) {
        throw new Error(result.error.message || INVITATION_ERRORS.REJECT_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.organizations() });
      toast.success(INVITATION_SUCCESS.INVITATION_REJECTED);
    },
    onError: (error: Error) => {
      toast.error(error.message || INVITATION_ERRORS.REJECT_FAILED);
    },
  });
}
