"use client";

import { useState, useEffect } from "react";
import { Permission, RoleInfo } from "@/lib/permissions-utils";
import { getPermissions, updateRolePermissions } from "@/lib/permissions-api";
import {
  PERMISSION_LABELS,
  PERMISSION_ERRORS,
  PERMISSION_SUCCESS,
} from "@/lib/constants";
import { Shield, Check, X } from "lucide-react";

interface RolePermissionEditorProps {
  role: RoleInfo;
  onSave: (updatedRole: RoleInfo) => void;
  onCancel: () => void;
}

export function RolePermissionEditor({
  role,
  onSave,
  onCancel,
}: RolePermissionEditorProps) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    const selected = new Set(role.permissions.map((p) => p.key));
    setSelectedPermissions(selected);
  }, [role]);

  const loadPermissions = async () => {
    setIsLoading(true);
    setError("");
    try {
      const permissions = await getPermissions();
      setAllPermissions(permissions);
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

  const handleTogglePermission = (permissionKey: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionKey)) {
      newSelected.delete(permissionKey);
    } else {
      newSelected.add(permissionKey);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSelectAll = () => {
    const allKeys = new Set(allPermissions.map((p) => p.key));
    setSelectedPermissions(allKeys);
  };

  const handleDeselectAll = () => {
    setSelectedPermissions(new Set());
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const permissionsToSave = allPermissions.filter((p) =>
        selectedPermissions.has(p.key)
      );

      const updatedRole = await updateRolePermissions(role.name, permissionsToSave);
      setSuccess(PERMISSION_SUCCESS.ROLE_PERMISSIONS_UPDATED);
      setTimeout(() => {
        onSave(updatedRole);
        setSuccess("");
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : PERMISSION_ERRORS.UPDATE_ROLE_PERMISSIONS_FAILED;
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const groupedPermissions = allPermissions.reduce(
    (acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

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
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {PERMISSION_LABELS.PERMISSIONS_FOR_ROLE} {role.name}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {PERMISSION_LABELS.SELECT_ALL}
          </button>
          <button
            onClick={handleDeselectAll}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {PERMISSION_LABELS.DESELECT_ALL}
          </button>
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

      <div className="space-y-6 mb-6">
        {Object.entries(groupedPermissions).map(([resource, permissions]) => (
          <div key={resource}>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase">
              {resource}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {permissions.map((permission) => {
                const isSelected = selectedPermissions.has(permission.key);
                return (
                  <label
                    key={permission.key}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                      ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                          : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleTogglePermission(permission.key)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <Shield
                      className={`w-4 h-4 flex-shrink-0 ${
                        isSelected
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {permission.action}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {permission.resource}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          {PERMISSION_LABELS.CANCEL_EDIT}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          {isSaving ? PERMISSION_LABELS.LOADING : PERMISSION_LABELS.SAVE_PERMISSIONS}
        </button>
      </div>
    </div>
  );
}

