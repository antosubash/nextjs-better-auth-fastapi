import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
  ADMIN_ERRORS,
  ADMIN_SUCCESS,
  AUTH_ERRORS,
  CHANGE_PASSWORD_ERRORS,
  CHANGE_PASSWORD_SUCCESS,
  EMAIL_VERIFICATION_ERRORS,
  EMAIL_VERIFICATION_SUCCESS,
  FORGOT_PASSWORD_ERRORS,
  FORGOT_PASSWORD_SUCCESS,
  INVITATION_ERRORS,
  INVITATION_SUCCESS,
  MEMBER_ERRORS,
  MEMBER_SUCCESS,
  ORGANIZATION_ERRORS,
  ORGANIZATION_SUCCESS,
  PROFILE_UPDATE_ERRORS,
  PROFILE_UPDATE_SUCCESS,
  RESET_PASSWORD_ERRORS,
  RESET_PASSWORD_SUCCESS,
} from "@/lib/constants";
import { queryKeys } from "./query-keys";

// Session hooks
export function useSession(options?: { disableCookieCache?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.auth.session(), options?.disableCookieCache],
    queryFn: async () => {
      const result = await authClient.getSession(
        options?.disableCookieCache
          ? { query: { disableCookieCache: true } }
          : undefined
      );
      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const result = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
      });
      if (result.error) {
        throw new Error(result.error.message || AUTH_ERRORS.INVALID_CREDENTIALS);
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      // Navigation will be handled by the component
    },
    onError: (error: Error) => {
      toast.error(error.message || AUTH_ERRORS.LOGIN_FAILED);
    },
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });
      if (result.error) {
        throw new Error(result.error.message || AUTH_ERRORS.SIGNUP_FAILED);
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      // Navigation will be handled by the component
    },
    onError: (error: Error) => {
      toast.error(error.message || AUTH_ERRORS.SIGNUP_FAILED);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      queryClient.clear(); // Clear all queries on logout
    },
    onError: (error: Error) => {
      toast.error(error.message || AUTH_ERRORS.LOGIN_FAILED);
    },
  });
}

// Organization hooks
export function useOrganizations() {
  return useQuery({
    queryKey: queryKeys.auth.organizations(),
    queryFn: async () => {
      const result = await authClient.organization.list();
      if (result.error) {
        throw new Error(result.error.message || ORGANIZATION_ERRORS.LOAD_ORGANIZATIONS_FAILED);
      }
      return Array.isArray(result.data) ? result.data : [];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSetActiveOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const result = await authClient.organization.setActive({
        organizationId,
      });
      if (result.error) {
        throw new Error(result.error.message || ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.organizations() });
    },
    onError: (error: Error) => {
      toast.error(error.message || ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
    },
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      slug?: string;
      metadata?: { description?: string };
    }) => {
      const result = await authClient.organization.create({
        name: data.name,
        ...(data.slug ? { slug: data.slug } : {}),
        ...(data.metadata ? { metadata: data.metadata } : {}),
      } as Parameters<typeof authClient.organization.create>[0]);
      if (result.error) {
        throw new Error(result.error.message || ORGANIZATION_ERRORS.CREATE_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.organizations() });
      toast.success(ORGANIZATION_SUCCESS.ORGANIZATION_CREATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ORGANIZATION_ERRORS.CREATE_FAILED);
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      organizationId: string;
      name?: string;
      slug?: string;
      metadata?: { description?: string };
    }) => {
      const result = await authClient.organization.update({
        organizationId: data.organizationId,
        ...(data.name !== undefined
          ? {
              data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.slug !== undefined ? { slug: data.slug } : {}),
                ...(data.metadata ? { metadata: data.metadata } : {}),
              },
            }
          : {}),
      } as Parameters<typeof authClient.organization.update>[0]);
      if (result.error) {
        throw new Error(result.error.message || ORGANIZATION_ERRORS.UPDATE_FAILED);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.organizations() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.organization(variables.organizationId),
      });
      toast.success(ORGANIZATION_SUCCESS.ORGANIZATION_UPDATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ORGANIZATION_ERRORS.UPDATE_FAILED);
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const result = await authClient.organization.delete({
        organizationId,
      });
      if (result.error) {
        throw new Error(result.error.message || ORGANIZATION_ERRORS.DELETE_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.organizations() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      toast.success(ORGANIZATION_SUCCESS.ORGANIZATION_DELETED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ORGANIZATION_ERRORS.DELETE_FAILED);
    },
  });
}

// Member hooks
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

// Invitation hooks
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

// Admin hooks
export function useAdminListUsers(options?: {
  searchValue?: string;
  limit?: string;
  offset?: string;
  sortBy?: string;
  sortDirection?: string;
  filterField?: string;
  filterValue?: string;
  filterOperator?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: [
      ...queryKeys.auth.admin.users(),
      options?.searchValue,
      options?.limit,
      options?.offset,
      options?.sortBy,
      options?.sortDirection,
      options?.filterField,
      options?.filterValue,
      options?.filterOperator,
    ],
    queryFn: async () => {
      const result = await authClient.admin.listUsers({
        query: {
          ...(options?.searchValue && { searchValue: options.searchValue }),
          ...(options?.limit && { limit: options.limit }),
          ...(options?.offset && { offset: options.offset }),
          ...(options?.sortBy && { sortBy: options.sortBy }),
          ...(options?.sortDirection && { sortDirection: options.sortDirection as "asc" | "desc" }),
          ...(options?.filterField && { filterField: options.filterField }),
          ...(options?.filterValue && { filterValue: options.filterValue }),
          ...(options?.filterOperator && {
            filterOperator: options.filterOperator as
              | "contains"
              | "eq"
              | "ne"
              | "lt"
              | "lte"
              | "gt"
              | "gte",
          }),
        },
      });
      if (result.error) {
        throw new Error(result.error.message || ADMIN_ERRORS.LOAD_USERS_FAILED);
      }
      return result.data || [];
    },
    enabled: options?.enabled !== false,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useAdminGetUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.auth.admin.user(userId),
    queryFn: async () => {
      const result = await authClient.admin.listUsers({
        query: {
          filterField: "id",
          filterValue: userId,
          filterOperator: "eq",
          limit: "1",
        },
      });
      if (result.error) {
        throw new Error(result.error.message || ADMIN_ERRORS.LOAD_USERS_FAILED);
      }
      const usersData = (result.data as { users?: unknown[] })?.users || [];
      if (usersData.length === 0) {
        throw new Error(ADMIN_ERRORS.LOAD_USERS_FAILED);
      }
      return usersData[0];
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useAdminCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; role?: string }) => {
      const result = await authClient.admin.createUser({
        email: data.email,
        password: data.password,
        name: data.name,
        ...(data.role && { role: data.role as "user" | "admin" }),
      });
      if (result.error) {
        throw new Error(result.error.message || ADMIN_ERRORS.CREATE_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.admin.users() });
      toast.success(ADMIN_SUCCESS.USER_CREATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ADMIN_ERRORS.CREATE_FAILED);
    },
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      email?: string;
      name?: string;
      role?: string;
      image?: string | null;
      data?: {
        email?: string;
        name?: string;
        role?: string;
        image?: string | null;
      };
    }) => {
      const updateData: Record<string, unknown> = {};
      if (data.email !== undefined) updateData.email = data.email;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.image !== undefined) updateData.image = data.image;
      if (data.data) Object.assign(updateData, data.data);

      const result = await authClient.admin.updateUser({
        userId: data.userId,
        data: updateData,
      });
      if (result.error) {
        throw new Error(result.error.message || ADMIN_ERRORS.UPDATE_FAILED);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.admin.user(variables.userId) });
      toast.success(ADMIN_SUCCESS.USER_UPDATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ADMIN_ERRORS.UPDATE_FAILED);
    },
  });
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await authClient.admin.removeUser({
        userId,
      });
      if (result.error) {
        throw new Error(result.error.message || ADMIN_ERRORS.DELETE_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.admin.users() });
      toast.success(ADMIN_SUCCESS.USER_DELETED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ADMIN_ERRORS.DELETE_FAILED);
    },
  });
}

export function useAdminSetRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      const result = await authClient.admin.setRole({
        userId: data.userId,
        role: data.role as "user" | "admin" | ("user" | "admin")[],
      });
      if (result.error) {
        throw new Error(result.error.message || ADMIN_ERRORS.SET_ROLE_FAILED);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.admin.user(variables.userId) });
      toast.success(ADMIN_SUCCESS.ROLE_SET);
    },
    onError: (error: Error) => {
      toast.error(error.message || ADMIN_ERRORS.SET_ROLE_FAILED);
    },
  });
}

export function useAdminBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; reason?: string }) => {
      const result = await authClient.admin.banUser({
        userId: data.userId,
        ...(data.reason && { banReason: data.reason }),
      });
      if (result.error) {
        throw new Error(result.error.message || ADMIN_ERRORS.BAN_FAILED);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.admin.user(variables.userId) });
      toast.success(ADMIN_SUCCESS.USER_BANNED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ADMIN_ERRORS.BAN_FAILED);
    },
  });
}

export function useAdminUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await authClient.admin.unbanUser({
        userId,
      });
      if (result.error) {
        throw new Error(result.error.message || ADMIN_ERRORS.UNBAN_FAILED);
      }
      return result.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.admin.user(userId) });
      toast.success(ADMIN_SUCCESS.USER_UNBANNED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ADMIN_ERRORS.UNBAN_FAILED);
    },
  });
}

export function useAdminSetUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; password?: string; newPassword?: string }) => {
      if (!data.newPassword) {
        throw new Error("newPassword is required");
      }
      const result = await authClient.admin.setUserPassword({
        userId: data.userId,
        newPassword: data.newPassword,
        ...(data.password && { password: data.password }),
      });
      if (result.error) {
        throw new Error(result.error.message || ADMIN_ERRORS.PASSWORD_RESET_FAILED);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.admin.user(variables.userId) });
      toast.success(ADMIN_SUCCESS.PASSWORD_RESET);
    },
    onError: (error: Error) => {
      toast.error(error.message || ADMIN_ERRORS.PASSWORD_RESET_FAILED);
    },
  });
}

export function useAdminListUserSessions(userId: string) {
  return useQuery({
    queryKey: queryKeys.auth.admin.userSessions(userId),
    queryFn: async () => {
      const result = await authClient.admin.listUserSessions({
        userId,
      });
      if (result.error) {
        throw new Error(result.error.message || ADMIN_ERRORS.LOAD_SESSIONS_FAILED);
      }
      return result.data || [];
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useAdminRevokeUserSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; sessionToken: string }) => {
      const result = await authClient.admin.revokeUserSession({
        sessionToken: data.sessionToken,
      });
      if (result.error) {
        throw new Error(result.error.message || ADMIN_ERRORS.REVOKE_SESSION_FAILED);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.admin.userSessions(variables.userId),
      });
      toast.success(ADMIN_SUCCESS.SESSION_REVOKED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ADMIN_ERRORS.REVOKE_SESSION_FAILED);
    },
  });
}

export function useAdminRevokeUserSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await authClient.admin.revokeUserSessions({
        userId,
      });
      if (result.error) {
        throw new Error(result.error.message || ADMIN_ERRORS.REVOKE_SESSIONS_FAILED);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.admin.userSessions(variables) });
      toast.success(ADMIN_SUCCESS.SESSIONS_REVOKED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ADMIN_ERRORS.REVOKE_SESSIONS_FAILED);
    },
  });
}

export function useAdminImpersonateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await authClient.admin.impersonateUser({
        userId,
      });
      if (result.error) {
        throw new Error(result.error.message || ADMIN_ERRORS.IMPERSONATION_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      toast.success(ADMIN_SUCCESS.IMPERSONATION_STARTED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ADMIN_ERRORS.IMPERSONATION_FAILED);
    },
  });
}

export function useAdminStopImpersonating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await authClient.admin.stopImpersonating();
      if (result.error) {
        throw new Error(result.error.message || ADMIN_ERRORS.STOP_IMPERSONATION_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      toast.success(ADMIN_SUCCESS.IMPERSONATION_STOPPED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ADMIN_ERRORS.STOP_IMPERSONATION_FAILED);
    },
  });
}

// User profile hooks
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
      revokeOtherSessions?: boolean;
    }) => {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          revokeOtherSessions: data.revokeOtherSessions,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || CHANGE_PASSWORD_ERRORS.CHANGE_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      toast.success(CHANGE_PASSWORD_SUCCESS.PASSWORD_CHANGED);
    },
    onError: (error: Error) => {
      toast.error(error.message || CHANGE_PASSWORD_ERRORS.CHANGE_FAILED);
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (data: { email: string; redirectTo?: string }) => {
      const response = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          redirectTo: data.redirectTo,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || FORGOT_PASSWORD_ERRORS.REQUEST_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(FORGOT_PASSWORD_SUCCESS.EMAIL_SENT);
    },
    onError: (error: Error) => {
      toast.error(error.message || FORGOT_PASSWORD_ERRORS.REQUEST_FAILED);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: { newPassword: string; token: string }) => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: data.newPassword,
          token: data.token,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || RESET_PASSWORD_ERRORS.RESET_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(RESET_PASSWORD_SUCCESS.PASSWORD_RESET);
    },
    onError: (error: Error) => {
      toast.error(error.message || RESET_PASSWORD_ERRORS.RESET_FAILED);
    },
  });
}

export function useSendVerificationEmail() {
  return useMutation({
    mutationFn: async (data: { email: string; callbackURL?: string }) => {
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          callbackURL: data.callbackURL,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || EMAIL_VERIFICATION_ERRORS.RESEND_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(EMAIL_VERIFICATION_SUCCESS.EMAIL_SENT);
    },
    onError: (error: Error) => {
      toast.error(error.message || EMAIL_VERIFICATION_ERRORS.RESEND_FAILED);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name?: string; email?: string; image?: string | null }) => {
      const result = await authClient.updateUser({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.image !== undefined && { image: data.image }),
      });

      if (result.error) {
        throw new Error(result.error.message || PROFILE_UPDATE_ERRORS.UPDATE_FAILED);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      toast.success(PROFILE_UPDATE_SUCCESS.PROFILE_UPDATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || PROFILE_UPDATE_ERRORS.UPDATE_FAILED);
    },
  });
}
