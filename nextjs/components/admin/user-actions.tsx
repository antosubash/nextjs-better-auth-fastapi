"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { getRoles } from "@/lib/permissions-api";
import { RoleInfo } from "@/lib/permissions-utils";
import {
  ADMIN_LABELS,
  ADMIN_ERRORS,
  ADMIN_SUCCESS,
  USER_ROLES,
  ROLE_DISPLAY_NAMES,
} from "@/lib/constants";
import {
  MoreVertical,
  Ban,
  UserCheck,
  Trash2,
  Edit,
  Shield,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean;
}

interface UserActionsProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  onActionSuccess: (message: string) => void;
}

export function UserActions({
  user,
  onEdit,
  onDelete,
  onActionSuccess,
}: UserActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [newRole, setNewRole] = useState<string>(user.role || USER_ROLES.USER);
  const [availableRoles, setAvailableRoles] = useState<RoleInfo[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const roles = await getRoles();
      setAvailableRoles(roles);
      // Set initial role to user's current role or default to "user"
      if (user.role) {
        const validRole = roles.find((r) => r.name === user.role)?.name || USER_ROLES.USER;
        setNewRole(validRole);
      }
    } catch (err) {
      console.error("Failed to load roles:", err);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleBan = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.admin.banUser({
        userId: user.id,
        banReason: banReason || undefined,
      });

      if (result.error) {
        alert(result.error.message || ADMIN_ERRORS.BAN_FAILED);
      } else {
        onActionSuccess(ADMIN_SUCCESS.USER_BANNED);
        setShowBanModal(false);
        setBanReason("");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ADMIN_ERRORS.BAN_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnban = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.admin.unbanUser({
        userId: user.id,
      });

      if (result.error) {
        alert(result.error.message || ADMIN_ERRORS.UNBAN_FAILED);
      } else {
        onActionSuccess(ADMIN_SUCCESS.USER_UNBANNED);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ADMIN_ERRORS.UNBAN_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetRole = async () => {
    setIsLoading(true);
    try {
      // Ensure role is one of the allowed values
      const validRole = (newRole === USER_ROLES.ADMIN || newRole === USER_ROLES.USER)
        ? (newRole as "user" | "admin")
        : USER_ROLES.USER;
      
      const result = await authClient.admin.setRole({
        userId: user.id,
        role: validRole,
      });

      if (result.error) {
        alert(result.error.message || ADMIN_ERRORS.SET_ROLE_FAILED);
      } else {
        onActionSuccess(ADMIN_SUCCESS.ROLE_SET);
        setShowRoleModal(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ADMIN_ERRORS.SET_ROLE_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(ADMIN_LABELS.CONFIRM_DELETE)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.admin.removeUser({
        userId: user.id,
      });

      if (result.error) {
        alert(result.error.message || ADMIN_ERRORS.DELETE_FAILED);
      } else {
        onDelete();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ADMIN_ERRORS.DELETE_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onEdit();
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {ADMIN_LABELS.EDIT_USER}
              </button>

              {user.banned ? (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleUnban();
                  }}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  {ADMIN_LABELS.UNBAN_USER}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowBanModal(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  {ADMIN_LABELS.BAN_USER}
                </button>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowRoleModal(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                {ADMIN_LABELS.SET_ROLE}
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  handleDelete();
                }}
                disabled={isLoading}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {ADMIN_LABELS.DELETE_USER}
              </button>
            </div>
          </>
        )}
      </div>

      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {ADMIN_LABELS.BAN_USER}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {ADMIN_LABELS.BAN_REASON} (optional)
              </label>
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder={ADMIN_LABELS.BAN_REASON}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleBan}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Banning..." : ADMIN_LABELS.BAN_USER}
              </button>
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason("");
                }}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
              >
                {ADMIN_LABELS.CANCEL}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {ADMIN_LABELS.SET_ROLE}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {ADMIN_LABELS.ROLE}
              </label>
              {isLoadingRoles ? (
                <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Loading roles...
                </div>
              ) : (
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                >
                  {availableRoles.map((roleInfo) => (
                    <option key={roleInfo.name} value={roleInfo.name}>
                      {ROLE_DISPLAY_NAMES[roleInfo.name as keyof typeof ROLE_DISPLAY_NAMES] || roleInfo.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSetRole}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-50"
              >
                {isLoading ? "Saving..." : ADMIN_LABELS.SAVE}
              </button>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setNewRole(user.role || USER_ROLES.USER);
                }}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
              >
                {ADMIN_LABELS.CANCEL}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
