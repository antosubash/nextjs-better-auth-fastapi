import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { MEMBER_ERRORS, MEMBER_SUCCESS } from "@/lib/constants";
import { queryKeys } from "./query-keys";

export function useListMembers(organizationId: string) {
  return useQuery({
    queryKey: queryKeys.auth.members(organizationId),
    queryFn: async () => {
      const result = (await authClient.organization.listMembers({
        query: {
          organizationId,
        },
      } as unknown as Parameters<typeof authClient.organization.listMembers>[0])) as {
        error?: { message?: string };
        data?: unknown;
      };
      if (result.error) {
        throw new Error(result.error.message || MEMBER_ERRORS.LOAD_MEMBERS_FAILED);
      }
      return result.data || [];
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { organizationId: string; userId: string; role: string }) => {
      const result = await (
        authClient.organization as unknown as {
          addMember: (params: {
            organizationId: string;
            userId: string;
            role: string;
          }) => Promise<{ error?: { message?: string }; data?: unknown }>;
        }
      ).addMember({
        organizationId: data.organizationId,
        userId: data.userId,
        role: data.role,
      });
      if (result.error) {
        throw new Error(result.error.message || MEMBER_ERRORS.ADD_FAILED);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.members(variables.organizationId) });
      toast.success(MEMBER_SUCCESS.MEMBER_ADDED);
    },
    onError: (error: Error) => {
      toast.error(error.message || MEMBER_ERRORS.ADD_FAILED);
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      organizationId: string;
      userId?: string;
      memberIdOrEmail?: string;
    }) => {
      if (!data.userId && !data.memberIdOrEmail) {
        throw new Error("Either userId or memberIdOrEmail must be provided");
      }
      const removeParams = data.memberIdOrEmail
        ? { organizationId: data.organizationId, memberIdOrEmail: data.memberIdOrEmail }
        : { organizationId: data.organizationId, userId: data.userId as string };
      const result = await authClient.organization.removeMember(
        removeParams as unknown as Parameters<typeof authClient.organization.removeMember>[0]
      );
      if (result.error) {
        throw new Error(result.error.message || MEMBER_ERRORS.REMOVE_FAILED);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.members(variables.organizationId) });
      toast.success(MEMBER_SUCCESS.MEMBER_REMOVED);
    },
    onError: (error: Error) => {
      toast.error(error.message || MEMBER_ERRORS.REMOVE_FAILED);
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      organizationId: string;
      userId?: string;
      memberId?: string;
      role: string | string[];
    }) => {
      if (!data.userId && !data.memberId) {
        throw new Error("Either userId or memberId must be provided");
      }
      const updateParams = data.memberId
        ? { organizationId: data.organizationId, memberId: data.memberId, role: data.role }
        : { organizationId: data.organizationId, userId: data.userId as string, role: data.role };
      const result = await authClient.organization.updateMemberRole(
        updateParams as unknown as Parameters<typeof authClient.organization.updateMemberRole>[0]
      );
      if (result.error) {
        throw new Error(result.error.message || MEMBER_ERRORS.UPDATE_ROLE_FAILED);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.members(variables.organizationId) });
      toast.success(MEMBER_SUCCESS.ROLE_UPDATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || MEMBER_ERRORS.UPDATE_ROLE_FAILED);
    },
  });
}

export function useLeaveOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const result = await authClient.organization.leave({
        organizationId,
      });
      if (result.error) {
        throw new Error(result.error.message || MEMBER_ERRORS.LEAVE_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.organizations() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      toast.success(MEMBER_SUCCESS.LEFT_ORGANIZATION);
    },
    onError: (error: Error) => {
      toast.error(error.message || MEMBER_ERRORS.LEAVE_FAILED);
    },
  });
}
