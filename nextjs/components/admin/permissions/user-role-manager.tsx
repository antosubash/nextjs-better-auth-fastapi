"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { getUserPermissions, getRoles } from "@/lib/permissions-api";
import { Permission, RoleInfo } from "@/lib/permissions-utils";
import {
  PERMISSION_LABELS,
  PERMISSION_ERRORS,
  PERMISSION_SUCCESS,
  ROLE_DISPLAY_NAMES,
  ADMIN_LABELS,
} from "@/lib/constants";
import { Search, Users, Shield, ChevronDown, ChevronUp } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string | null;
}

interface UserWithPermissions extends User {
  permissions: Permission[];
}

export function UserRoleManager() {
  const [usersWithPermissions, setUsersWithPermissions] = useState<
    UserWithPermissions[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [editingRole, setEditingRole] = useState<{
    userId: string;
    newRole: string;
  } | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<RoleInfo[]>([]);

  useEffect(() => {
    loadRoles();
    loadUsers();
  }, []);

  const loadRoles = async () => {
    try {
      const roles = await getRoles();
      setAvailableRoles(roles);
    } catch (err) {
      console.error("Failed to load roles:", err);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await authClient.admin.listUsers({
        query: {
          limit: "100",
          offset: "0",
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });

      if (result.error) {
        setError(result.error.message || PERMISSION_ERRORS.LOAD_USER_PERMISSIONS_FAILED);
      } else if (result.data) {
        const usersData = (result.data as { users?: User[] })?.users || [];

        const usersWithPerms = await Promise.all(
          usersData.map(async (user) => {
            try {
              const permData = await getUserPermissions(user.id);
              return {
                ...user,
                permissions: permData.permissions,
              };
            } catch {
              return {
                ...user,
                permissions: [],
              };
            }
          })
        );
        setUsersWithPermissions(usersWithPerms);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : PERMISSION_ERRORS.LOAD_USER_PERMISSIONS_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpand = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const handleStartEditRole = (userId: string, currentRole: string | null | undefined) => {
    // Validate current role against available roles, default to first available role or "user"
    const validRole = availableRoles.find((r) => r.name === currentRole)?.name || 
                      availableRoles.find((r) => r.name === "user")?.name || 
                      availableRoles[0]?.name || 
                      "user";
    setEditingRole({
      userId,
      newRole: validRole,
    });
  };

  const handleCancelEditRole = () => {
    setEditingRole(null);
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    setIsUpdatingRole(true);
    setError("");
    try {
      const result = await authClient.admin.setRole({
        userId: editingRole.userId,
        role: editingRole.newRole as "user" | "admin",
      });

      if (result.error) {
        setError(result.error.message || PERMISSION_ERRORS.ASSIGN_ROLE_FAILED);
      } else {
        setSuccess(PERMISSION_SUCCESS.ROLE_UPDATED);
        setTimeout(() => setSuccess(""), 3000);
        setEditingRole(null);
        await loadUsers();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : PERMISSION_ERRORS.ASSIGN_ROLE_FAILED;
      setError(errorMessage);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const filteredUsers = usersWithPermissions.filter((user) => {
    const searchLower = searchValue.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.role && user.role.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">
          {PERMISSION_LABELS.LOADING}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={ADMIN_LABELS.SEARCH_USERS}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
          {success}
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          {ADMIN_LABELS.NO_USERS}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => {
            const isExpanded = expandedUsers.has(user.id);
            const isEditing = editingRole?.userId === user.id;
            const displayRole = user.role
              ? ROLE_DISPLAY_NAMES[user.role as keyof typeof ROLE_DISPLAY_NAMES] ||
                user.role
              : "No role";

            return (
              <div
                key={user.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <Users className="w-5 h-5 text-gray-900 dark:text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {user.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {PERMISSION_LABELS.CURRENT_ROLE}
                        </div>
                        {isEditing ? (
                          <select
                            value={editingRole?.newRole || "user"}
                            onChange={(e) =>
                              setEditingRole({
                                userId: user.id,
                                newRole: e.target.value,
                              })
                            }
                            className="mt-1 px-3 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                            disabled={isUpdatingRole}
                          >
                            {availableRoles.map((roleInfo) => (
                              <option key={roleInfo.name} value={roleInfo.name}>
                                {ROLE_DISPLAY_NAMES[roleInfo.name as keyof typeof ROLE_DISPLAY_NAMES] || roleInfo.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="mt-1 font-medium text-gray-900 dark:text-white">
                            {displayRole}
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateRole}
                            disabled={isUpdatingRole}
                            className="px-3 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 text-sm disabled:opacity-50"
                          >
                            {ADMIN_LABELS.SAVE}
                          </button>
                          <button
                            onClick={handleCancelEditRole}
                            disabled={isUpdatingRole}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm disabled:opacity-50"
                          >
                            {ADMIN_LABELS.CANCEL}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditRole(user.id, user.role)}
                          className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {PERMISSION_LABELS.UPDATE_ROLE}
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleExpand(user.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {PERMISSION_LABELS.EFFECTIVE_PERMISSIONS} ({user.permissions.length})
                    </h4>
                    {user.permissions.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No permissions assigned
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {user.permissions.map((permission) => (
                          <div
                            key={permission.key}
                            className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                          >
                            <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {permission.resource}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {permission.action}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

