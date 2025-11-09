"use client";

import { useState, useEffect } from "react";
import { getRoles } from "@/lib/permissions-api";
import { RoleInfo } from "@/lib/permissions-utils";
import { PERMISSION_LABELS, PERMISSION_ERRORS, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from "@/lib/constants";
import { Search, Shield, Users } from "lucide-react";

export function RolePermissions() {
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");

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
          : PERMISSION_ERRORS.LOAD_ROLES_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRoles = roles.filter((role) => {
    const searchLower = searchValue.toLowerCase();
    const displayName = ROLE_DISPLAY_NAMES[role.name as keyof typeof ROLE_DISPLAY_NAMES] || role.name;
    return (
      role.name.toLowerCase().includes(searchLower) ||
      displayName.toLowerCase().includes(searchLower)
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
            placeholder={PERMISSION_LABELS.SEARCH_ROLES}
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
          {PERMISSION_LABELS.NO_ROLES}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRoles.map((role) => {
            const displayName = ROLE_DISPLAY_NAMES[role.name as keyof typeof ROLE_DISPLAY_NAMES] || role.name;
            const description = ROLE_DESCRIPTIONS[role.name as keyof typeof ROLE_DESCRIPTIONS] || "";
            
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
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Permissions ({role.permissions.length})
                  </h4>
                  {role.permissions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No permissions assigned
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

