import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ADMIN_ERRORS, ADMIN_SUCCESS, USER_ROLES } from "@/lib/constants";
import { useToast } from "@/lib/hooks/use-toast";
import { getAssignableUserRoles } from "@/lib/permissions-api";
import type { RoleInfo } from "@/lib/permissions-utils";
import { canBanRole, getValidAssignableRole } from "@/lib/utils/role-validation";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean;
  createdAt?: number;
  emailVerified?: boolean;
  image?: string | null;
}

export function useUserEdit(userId: string) {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<RoleInfo[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const loadUser = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError("");
    try {
      const result = await authClient.admin.listUsers({
        query: {
          filterField: "id",
          filterValue: userId,
          filterOperator: "eq",
          limit: "1",
        },
      });

      if (result.error) {
        setError(result.error.message || ADMIN_ERRORS.LOAD_USERS_FAILED);
      } else if (result.data) {
        const usersData = (result.data as { users?: User[] })?.users || [];
        if (usersData.length === 0) {
          setError(ADMIN_ERRORS.LOAD_USERS_FAILED);
        } else {
          setUser(usersData[0]);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ADMIN_ERRORS.LOAD_USERS_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const loadRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const roles = await getAssignableUserRoles();
      setAvailableRoles(roles);
    } catch (err) {
      console.error("Failed to load roles:", err);
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      loadRoles();
    }
  }, [user, loadRoles]);

  const reloadUser = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await authClient.admin.listUsers({
        query: {
          filterField: "id",
          filterValue: userId,
          filterOperator: "eq",
          limit: "1",
        },
      });

      if (result.data) {
        const usersData = (result.data as { users?: User[] })?.users || [];
        if (usersData.length > 0) {
          setUser(usersData[0]);
        }
      }
    } catch (err) {
      console.error("Failed to reload user:", err);
    }
  }, [userId]);

  const handleBan = useCallback(
    async (banReason: string) => {
      if (!user || !canBanRole(user.role)) {
        toast.error(ADMIN_ERRORS.CANNOT_BAN_ADMIN);
        return false;
      }

      setIsActionLoading(true);
      try {
        const result = await authClient.admin.banUser({
          userId: user.id,
          banReason: banReason || undefined,
        });

        if (result.error) {
          toast.error(result.error.message || ADMIN_ERRORS.BAN_FAILED);
          return false;
        } else {
          toast.success(ADMIN_SUCCESS.USER_BANNED);
          await reloadUser();
          return true;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : ADMIN_ERRORS.BAN_FAILED;
        toast.error(errorMessage);
        return false;
      } finally {
        setIsActionLoading(false);
      }
    },
    [user, toast, reloadUser]
  );

  const handleUnban = useCallback(async () => {
    if (!user) return false;
    setIsActionLoading(true);
    try {
      const result = await authClient.admin.unbanUser({
        userId: user.id,
      });

      if (result.error) {
        toast.error(result.error.message || ADMIN_ERRORS.UNBAN_FAILED);
        return false;
      } else {
        toast.success(ADMIN_SUCCESS.USER_UNBANNED);
        await reloadUser();
        return true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ADMIN_ERRORS.UNBAN_FAILED;
      toast.error(errorMessage);
      return false;
    } finally {
      setIsActionLoading(false);
    }
  }, [user, toast, reloadUser]);

  const handleSetRole = useCallback(
    async (newRole: string) => {
      if (!user) return false;
      setIsActionLoading(true);
      try {
        const validRole = getValidAssignableRole(
          newRole,
          availableRoles[0]?.name || USER_ROLES.USER
        );

        const result = await authClient.admin.setRole({
          userId: user.id,
          // @ts-expect-error - Better Auth types only include "user" | "admin" but custom roles are supported
          role: validRole,
        });

        if (result.error) {
          toast.error(result.error.message || ADMIN_ERRORS.SET_ROLE_FAILED);
          return false;
        } else {
          toast.success(ADMIN_SUCCESS.ROLE_SET);
          await reloadUser();
          return true;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : ADMIN_ERRORS.SET_ROLE_FAILED;
        toast.error(errorMessage);
        return false;
      } finally {
        setIsActionLoading(false);
      }
    },
    [user, availableRoles, toast, reloadUser]
  );

  const handleDelete = useCallback(async () => {
    if (!user) return false;
    setIsActionLoading(true);
    try {
      const result = await authClient.admin.removeUser({
        userId: user.id,
      });

      if (result.error) {
        toast.error(result.error.message || ADMIN_ERRORS.DELETE_FAILED);
        return false;
      } else {
        toast.success(ADMIN_SUCCESS.USER_DELETED);
        return true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ADMIN_ERRORS.DELETE_FAILED;
      toast.error(errorMessage);
      return false;
    } finally {
      setIsActionLoading(false);
    }
  }, [user, toast]);

  const handleImpersonate = useCallback(async () => {
    if (!user) return false;
    setIsActionLoading(true);
    try {
      const result = await authClient.admin.impersonateUser({ userId: user.id });

      if (result.error) {
        toast.error(result.error.message || ADMIN_ERRORS.IMPERSONATION_FAILED);
        return false;
      } else {
        toast.success(ADMIN_SUCCESS.IMPERSONATION_STARTED);
        window.location.href = "/";
        return true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ADMIN_ERRORS.IMPERSONATION_FAILED;
      toast.error(errorMessage);
      return false;
    } finally {
      setIsActionLoading(false);
    }
  }, [user, toast]);

  const handleResendVerificationEmail = useCallback(async () => {
    if (!user) return false;
    setIsActionLoading(true);
    try {
      toast.info("Verification email functionality needs to be implemented");
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ADMIN_ERRORS.EMAIL_VERIFICATION_FAILED;
      toast.error(errorMessage);
      return false;
    } finally {
      setIsActionLoading(false);
    }
  }, [user, toast]);

  const handlePasswordReset = useCallback(
    async (newPassword: string) => {
      if (!user) return false;
      setIsActionLoading(true);
      try {
        const result = await authClient.admin.setUserPassword({
          userId: user.id,
          newPassword,
        });

        if (result.error) {
          toast.error(result.error.message || ADMIN_ERRORS.PASSWORD_RESET_FAILED);
          return false;
        } else {
          toast.success(ADMIN_SUCCESS.PASSWORD_RESET);
          await reloadUser();
          return true;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : ADMIN_ERRORS.PASSWORD_RESET_FAILED;
        toast.error(errorMessage);
        return false;
      } finally {
        setIsActionLoading(false);
      }
    },
    [user, toast, reloadUser]
  );

  return {
    user,
    isLoading,
    error,
    isActionLoading,
    availableRoles,
    isLoadingRoles,
    reloadUser,
    handleBan,
    handleUnban,
    handleSetRole,
    handleDelete,
    handleImpersonate,
    handleResendVerificationEmail,
    handlePasswordReset,
  };
}
