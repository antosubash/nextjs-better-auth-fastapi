"use client";

import { useState, useEffect } from "react";
import { getRoles } from "@/lib/permissions-api";
import { RoleInfo } from "@/lib/permissions-utils";
import {
  ROLE_MANAGEMENT_LABELS,
  ROLE_MANAGEMENT_ERRORS,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
} from "@/lib/constants";
import { Search, Shield, Users, Edit2, ArrowLeft } from "lucide-react";
import { RolePermissionEditor } from "../permissions/role-permission-editor";

export function RoleManagement() {
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [editingRole, setEditingRole] = useState<RoleInfo | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : ROLE_MANAGEMENT_ERRORS.LOAD_ROLES_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (role: RoleInfo) => {
    setEditingRole(role);
  };

  const handleCancelEdit = () => {
    setEditingRole(null);
  };

  const handleSaveRole = (updatedRole: RoleInfo) => {
    setRoles((prevRoles) =>
      prevRoles.map((r) => (r.name === updatedRole.name ? updatedRole : r))
    );
    setEditingRole(null);
  };

  const filteredRoles = roles.filter((role) => {
    const searchLower = searchValue.toLowerCase();
    const displayName =
      ROLE_DISPLAY_NAMES[role.name as keyof typeof ROLE_DISPLAY_NAMES] ||
      role.name;
    return (
      role.name.toLowerCase().includes(searchLower) ||
      displayName.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">
          {ROLE_MANAGEMENT_LABELS.LOADING}
        </div>
      </div>
    );
  }

  if (editingRole) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={handleCancelEdit}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {ROLE_MANAGEMENT_LABELS.BACK_TO_ROLES}
          </button>
        </div>
        <RolePermissionEditor
          role={editingRole}
          onSave={handleSaveRole}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-gray-900 dark:text-white" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {ROLE_MANAGEMENT_LABELS.TITLE}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {ROLE_MANAGEMENT_LABELS.DESCRIPTION}
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={ROLE_MANAGEMENT_LABELS.SEARCH_ROLES}
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

      {filteredRoles.length === 0 ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          {ROLE_MANAGEMENT_LABELS.NO_ROLES}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRoles.map((role) => {
            const displayName =
              ROLE_DISPLAY_NAMES[role.name as keyof typeof ROLE_DISPLAY_NAMES] ||
              role.name;
            const description =
              ROLE_DESCRIPTIONS[
                role.name as keyof typeof ROLE_DESCRIPTIONS
              ] || "";

            return (
              <div
                key={role.name}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Users className="w-5 h-5 text-gray-900 dark:text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {displayName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {description}
                        </p>
                        <code className="mt-2 inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
                          {role.name}
                        </code>
                      </div>
                      <button
                        onClick={() => handleEditRole(role)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        {ROLE_MANAGEMENT_LABELS.EDIT_PERMISSIONS}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {ROLE_MANAGEMENT_LABELS.PERMISSIONS} ({role.permissions.length})
                  </h4>
                  {role.permissions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {ROLE_MANAGEMENT_LABELS.NO_PERMISSIONS}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {role.permissions.map((permission) => (
                        <div
                          key={permission.key}
                          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

