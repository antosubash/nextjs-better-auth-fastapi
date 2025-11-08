"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  ORGANIZATION_LABELS,
  ORGANIZATION_ERRORS,
  ORGANIZATION_SUCCESS,
} from "@/lib/constants";
import { MoreVertical, Trash2, Edit, CheckCircle2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationActionsProps {
  organization: Organization;
  onEdit: () => void;
  onDelete: () => void;
  onActionSuccess: (message: string) => void;
  isActive?: boolean;
}

export function OrganizationActions({
  organization,
  onEdit,
  onDelete,
  onActionSuccess,
  isActive,
}: OrganizationActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSetActive = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.organization.setActive({
        organizationId: organization.id,
      });

      if (result.error) {
        alert(result.error.message || ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
      } else {
        onActionSuccess(ORGANIZATION_SUCCESS.ORGANIZATION_ACTIVATED);
        setIsOpen(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : ORGANIZATION_ERRORS.SET_ACTIVE_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(ORGANIZATION_LABELS.CONFIRM_DELETE)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.organization.delete({
        organizationId: organization.id,
      });

      if (result.error) {
        alert(result.error.message || ORGANIZATION_ERRORS.DELETE_FAILED);
      } else {
        onDelete();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ORGANIZATION_ERRORS.DELETE_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
            {!isActive && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSetActive();
                }}
                disabled={isLoading}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {ORGANIZATION_LABELS.SET_ACTIVE}
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                onEdit();
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {ORGANIZATION_LABELS.EDIT_ORGANIZATION}
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
              {ORGANIZATION_LABELS.DELETE_ORGANIZATION}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
