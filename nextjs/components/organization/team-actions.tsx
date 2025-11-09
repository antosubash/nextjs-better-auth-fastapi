"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { TEAM_LABELS, TEAM_ERRORS, TEAM_SUCCESS } from "@/lib/constants";
import { MoreVertical, Trash2, Edit, CheckCircle2 } from "lucide-react";
import { ErrorToast } from "@/components/ui/error-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetActive = async () => {
    setIsLoading(true);
    try {
      // @ts-expect-error - better-auth organization client API method
      const result = await authClient.organization.setActiveTeam({
        teamId: team.id,
      });

      if (result.error) {
        setError(result.error.message || TEAM_ERRORS.SET_ACTIVE_FAILED);
      } else {
        onActionSuccess(TEAM_SUCCESS.TEAM_ACTIVATED);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : TEAM_ERRORS.SET_ACTIVE_FAILED;
      setError(errorMessage);
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
        setError(result.error.message || TEAM_ERRORS.DELETE_FAILED);
      } else {
        onDelete();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : TEAM_ERRORS.DELETE_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <ErrorToast
          message={error}
          onDismiss={() => setError(null)}
          duration={5000}
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isActive && (
            <DropdownMenuItem
              onClick={handleSetActive}
              disabled={isLoading}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {TEAM_LABELS.SET_ACTIVE}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            {TEAM_LABELS.EDIT_TEAM}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {TEAM_LABELS.DELETE_TEAM}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
