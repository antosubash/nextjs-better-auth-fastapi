import { useCallback, useEffect, useState } from "react";
import { ADMIN_ERRORS, USER_ROLES } from "@/lib/constants";
import {
  useAdminBanUser,
  useAdminDeleteUser,
  useAdminGetUser,
  useAdminImpersonateUser,
  useAdminSetRole,
  useAdminSetUserPassword,
  useAdminUnbanUser,
} from "@/lib/hooks/api/use-auth";
import { useToast } from "@/lib/hooks/use-toast";
import { useAssignableUserRoles } from "@/lib/hooks/api/use-permissions";
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
  const [error, setError] = useState("");
  const { data: availableRoles = [], isLoading: isLoadingRoles } = useAssignableUserRoles();

  const {
    data: userData,
    isLoading,
    error: queryError,
    refetch: reloadUser,
  } = useAdminGetUser(userId);

  const user = (userData as User) || null;

  useEffect(() => {
    if (queryError) {
      setError(queryError.message || ADMIN_ERRORS.LOAD_USERS_FAILED);
    } else {
      setError("");
    }
  }, [queryError]);

  const banUserMutation = useAdminBanUser();
  const unbanUserMutation = useAdminUnbanUser();
  const setRoleMutation = useAdminSetRole();
  const deleteUserMutation = useAdminDeleteUser();
  const impersonateUserMutation = useAdminImpersonateUser();
  const setPasswordMutation = useAdminSetUserPassword();

  const isActionLoading =
    banUserMutation.isPending ||
    unbanUserMutation.isPending ||
    setRoleMutation.isPending ||
    deleteUserMutation.isPending ||
    impersonateUserMutation.isPending ||
    setPasswordMutation.isPending;

  const handleBan = useCallback(
    async (banReason: string) => {
      if (!user || !canBanRole(user.role)) {
        toast.error(ADMIN_ERRORS.CANNOT_BAN_ADMIN);
        return false;
      }

      try {
        await banUserMutation.mutateAsync({
          userId: user.id,
          reason: banReason || undefined,
        });
        await reloadUser();
        return true;
      } catch (_err) {
        // Error is handled by the mutation hook
        return false;
      }
    },
    [user, toast, reloadUser, banUserMutation]
  );

  const handleUnban = useCallback(async () => {
    if (!user) return false;
    try {
      await unbanUserMutation.mutateAsync(user.id);
      await reloadUser();
      return true;
    } catch (_err) {
      // Error is handled by the mutation hook
      return false;
    }
  }, [user, reloadUser, unbanUserMutation]);

  const handleSetRole = useCallback(
    async (newRole: string) => {
      if (!user) return false;
      try {
        const validRole = getValidAssignableRole(
          newRole,
          availableRoles[0]?.name || USER_ROLES.USER
        );

        await setRoleMutation.mutateAsync({
          userId: user.id,
          role: validRole,
        });
        await reloadUser();
        return true;
      } catch (_err) {
        // Error is handled by the mutation hook
        return false;
      }
    },
    [user, availableRoles, reloadUser, setRoleMutation]
  );

  const handleDelete = useCallback(async () => {
    if (!user) return false;
    try {
      await deleteUserMutation.mutateAsync(user.id);
      return true;
    } catch (_err) {
      // Error is handled by the mutation hook
      return false;
    }
  }, [user, deleteUserMutation]);

  const handleImpersonate = useCallback(async () => {
    if (!user) return false;
    try {
      await impersonateUserMutation.mutateAsync(user.id);
      window.location.href = "/";
      return true;
    } catch (_err) {
      // Error is handled by the mutation hook
      return false;
    }
  }, [user, impersonateUserMutation]);

  const handleResendVerificationEmail = useCallback(async () => {
    if (!user) return false;
    toast.info("Verification email functionality needs to be implemented");
    return true;
  }, [user, toast]);

  const handlePasswordReset = useCallback(
    async (newPassword: string) => {
      if (!user) return false;
      try {
        await setPasswordMutation.mutateAsync({
          userId: user.id,
          newPassword,
        });
        await reloadUser();
        return true;
      } catch (_err) {
        // Error is handled by the mutation hook
        return false;
      }
    },
    [user, reloadUser, setPasswordMutation]
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
