"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  INVITATION_LABELS,
  INVITATION_ERRORS,
  INVITATION_SUCCESS,
} from "@/lib/constants";
import { MoreVertical, X, RotateCcw } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: number;
  expiresAt?: number;
}

interface InvitationActionsProps {
  invitation: Invitation;
  organizationId: string;
  onActionSuccess: (message: string) => void;
  onInvitationRemoved: () => void;
}

export function InvitationActions({
  invitation,
  organizationId,
  onActionSuccess,
  onInvitationRemoved,
}: InvitationActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm(INVITATION_LABELS.CONFIRM_CANCEL)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.organization.cancelInvitation({
        invitationId: invitation.id,
      });

      if (result.error) {
        alert(result.error.message || INVITATION_ERRORS.CANCEL_FAILED);
      } else {
        onActionSuccess(INVITATION_SUCCESS.INVITATION_CANCELLED);
        onInvitationRemoved();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : INVITATION_ERRORS.CANCEL_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      // @ts-expect-error - better-auth organization client API method
      const result = await authClient.organization.createInvitation({
        organizationId,
        email: invitation.email,
        role: invitation.role,
      });

      if (result.error) {
        alert(result.error.message || INVITATION_ERRORS.RESEND_FAILED);
      } else {
        onActionSuccess(INVITATION_SUCCESS.INVITATION_RESENT);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : INVITATION_ERRORS.RESEND_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const isPending = invitation.status === "pending";

  return (
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
            {isPending && (
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {INVITATION_LABELS.RESEND_INVITATION}
              </button>
            )}

            {isPending && (
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {INVITATION_LABELS.CANCEL_INVITATION}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
