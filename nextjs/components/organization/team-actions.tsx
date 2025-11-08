"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { TEAM_LABELS, TEAM_ERRORS, TEAM_SUCCESS } from "@/lib/constants";
import { MoreVertical, Trash2, Edit, CheckCircle2 } from "lucide-react";

interface Team {
  id: string;
  name: string;
}

interface TeamActionsProps {
  team: Team;
  organizationId: string;
  onEdit: () => void;
  onDelete: () => void;
  onActionSuccess: (message: string) => void;
  isActive?: boolean;
}

export function TeamActions({
  team,
  organizationId,
  onEdit,
  onDelete,
  onActionSuccess,
  isActive,
}: TeamActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSetActive = async () => {
    setIsLoading(true);
    try {
      // @ts-expect-error - better-auth organization client API method
      const result = await authClient.organization.setActiveTeam({
        teamId: team.id,
      });

      if (result.error) {
        alert(result.error.message || TEAM_ERRORS.SET_ACTIVE_FAILED);
      } else {
        onActionSuccess(TEAM_SUCCESS.TEAM_ACTIVATED);
        setIsOpen(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : TEAM_ERRORS.SET_ACTIVE_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(TEAM_LABELS.CONFIRM_DELETE)) {
      return;
    }

    setIsLoading(true);
    try {
      // @ts-expect-error - better-auth organization client API method
      const result = await authClient.organization.removeTeam({
        organizationId,
        teamId: team.id,
      });

      if (result.error) {
        alert(result.error.message || TEAM_ERRORS.DELETE_FAILED);
      } else {
        onDelete();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : TEAM_ERRORS.DELETE_FAILED;
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
                {TEAM_LABELS.SET_ACTIVE}
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
              {TEAM_LABELS.EDIT_TEAM}
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
              {TEAM_LABELS.DELETE_TEAM}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
