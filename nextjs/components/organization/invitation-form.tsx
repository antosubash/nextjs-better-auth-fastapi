"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  COMMON_LABELS,
  INVITATION_ERRORS,
  INVITATION_LABELS,
  INVITATION_PLACEHOLDERS,
  ORGANIZATION_ROLES,
} from "@/lib/constants";
import { MemberRoleSelector } from "./member-role-selector";

interface InvitationFormProps {
  organizationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InvitationForm({ organizationId, onSuccess, onCancel }: InvitationFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>(ORGANIZATION_ROLES.MEMBER);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // @ts-expect-error - better-auth organization client API method
      const result = await authClient.organization.createInvitation({
        organizationId,
        email,
        role,
      });

      if (result.error) {
        setError(result.error.message || INVITATION_ERRORS.SEND_FAILED);
      } else {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : INVITATION_ERRORS.SEND_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {INVITATION_LABELS.SEND_INVITATION}
      </h3>
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {INVITATION_LABELS.EMAIL}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={INVITATION_PLACEHOLDERS.EMAIL}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {INVITATION_LABELS.ROLE}
          </label>
          <MemberRoleSelector
            value={role}
            onChange={(value) => setRole(value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? INVITATION_LABELS.SENDING : INVITATION_LABELS.SEND_INVITATION}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {COMMON_LABELS.CANCEL}
          </button>
        </div>
      </form>
    </div>
  );
}
