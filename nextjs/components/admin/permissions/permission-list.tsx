"use client";

import { useState, useEffect } from "react";
import { getPermissions } from "@/lib/permissions-api";
import { Permission } from "@/lib/permissions-utils";
import { PERMISSION_LABELS, PERMISSION_ERRORS } from "@/lib/constants";
import { Search, Shield } from "lucide-react";

export function PermissionList() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getPermissions();
      setPermissions(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : PERMISSION_ERRORS.LOAD_PERMISSIONS_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPermissions = permissions.filter((permission) => {
    const searchLower = searchValue.toLowerCase();
    return (
      permission.resource.toLowerCase().includes(searchLower) ||
      permission.action.toLowerCase().includes(searchLower) ||
      permission.key.toLowerCase().includes(searchLower)
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
            placeholder={PERMISSION_LABELS.SEARCH_PERMISSIONS}
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

      {filteredPermissions.length === 0 ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          {PERMISSION_LABELS.NO_PERMISSIONS}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  {PERMISSION_LABELS.RESOURCE}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  {PERMISSION_LABELS.ACTION}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  {PERMISSION_LABELS.PERMISSION}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPermissions.map((permission) => (
                <tr
                  key={permission.key}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{permission.resource}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {permission.action}
                  </td>
                  <td className="py-3 px-4">
                    <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm text-gray-900 dark:text-white">
                      {permission.key}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

