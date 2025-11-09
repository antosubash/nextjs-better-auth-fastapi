"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { getRoles } from "@/lib/permissions-api";
import { RoleInfo } from "@/lib/permissions-utils";
import {
  ADMIN_LABELS,
  ADMIN_PLACEHOLDERS,
  ADMIN_ERRORS,
  USER_ROLES,
  ROLE_DISPLAY_NAMES,
  PERMISSION_LABELS,
  AUTH_ERRORS,
} from "@/lib/constants";
import { X } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>(USER_ROLES.USER);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableRoles, setAvailableRoles] = useState<RoleInfo[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const isEditing = !!user;

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      // Validate user role against available roles, default to "user" if invalid
      const validRole = availableRoles.find((r) => r.name === user.role)?.name || 
                        availableRoles.find((r) => r.name === USER_ROLES.USER)?.name || 
                        availableRoles[0]?.name || 
                        USER_ROLES.USER;
      setRole(validRole);
    }
  }, [user, availableRoles]);

  const loadRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const roles = await getRoles();
      setAvailableRoles(roles);
      // Set default role to first available role or "user"
      if (!user && roles.length > 0) {
        const defaultRole = roles.find((r) => r.name === USER_ROLES.USER)?.name || roles[0]?.name || USER_ROLES.USER;
        setRole(defaultRole);
      }
    } catch (err) {
      console.error("Failed to load roles:", err);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isEditing) {
        // Ensure role is one of the allowed values
        const validRole = (role === USER_ROLES.ADMIN || role === USER_ROLES.USER)
          ? (role as "user" | "admin")
          : USER_ROLES.USER;
        
        const result = await authClient.admin.updateUser({
          userId: user.id,
          data: {
            name,
            email,
            role: validRole,
          },
        });

        if (result.error) {
          setError(result.error.message || ADMIN_ERRORS.UPDATE_FAILED);
        } else {
          onSuccess();
        }
      } else {
        if (!password) {
          setError(AUTH_ERRORS.PASSWORD_REQUIRED);
          setIsLoading(false);
          return;
        }

        // Ensure role is one of the allowed values
        const validRole = (role === USER_ROLES.ADMIN || role === USER_ROLES.USER)
          ? (role as "user" | "admin")
          : USER_ROLES.USER;
        
        const result = await authClient.admin.createUser({
          email,
          password,
          name,
          role: validRole,
        });

        if (result.error) {
          setError(result.error.message || ADMIN_ERRORS.CREATE_FAILED);
        } else {
          onSuccess();
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : isEditing
            ? ADMIN_ERRORS.UPDATE_FAILED
            : ADMIN_ERRORS.CREATE_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEditing ? ADMIN_LABELS.EDIT_USER : ADMIN_LABELS.CREATE_USER}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {ADMIN_LABELS.NAME}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={ADMIN_PLACEHOLDERS.NAME}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {ADMIN_LABELS.EMAIL}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={ADMIN_PLACEHOLDERS.EMAIL}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>

        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {ADMIN_PLACEHOLDERS.PASSWORD}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={ADMIN_PLACEHOLDERS.PASSWORD}
              required={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {ADMIN_LABELS.ROLE}
          </label>
          {isLoadingRoles ? (
            <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {PERMISSION_LABELS.LOADING}
            </div>
          ) : (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
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

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : ADMIN_LABELS.SAVE}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ADMIN_LABELS.CANCEL}
          </button>
        </div>
      </form>
    </div>
  );
}
