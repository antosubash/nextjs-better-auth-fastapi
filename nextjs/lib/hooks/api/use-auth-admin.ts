import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { ADMIN_ERRORS, ADMIN_SUCCESS } from "@/lib/constants";
import { queryKeys } from "./query-keys";

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
