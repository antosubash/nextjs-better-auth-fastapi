"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { TEAM_LABELS, TEAM_ERRORS, COMMON_LABELS } from "@/lib/constants";
import { MoreVertical, UserMinus } from "lucide-react";
import { ErrorToast } from "@/components/ui/error-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamMember {
  id: string;
  userId: string;
  user?: {
    email: string;
    name?: string;
  };
}

interface TeamMemberActionsProps {
  member: TeamMember;
  teamId: string;
  onMemberRemoved: () => void;
}

export function TeamMemberActions({
  member,
  teamId,
  onMemberRemoved,
}: TeamMemberActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async () => {
    if (!confirm(COMMON_LABELS.CONFIRM_REMOVE)) {
      return;
    }

    setIsLoading(true);
    try {
      // @ts-expect-error - better-auth organization client API method
      const result = await authClient.organization.removeTeamMember({
        teamId,
        userId: member.userId,
      });

      if (result.error) {
        setError(result.error.message || TEAM_ERRORS.REMOVE_MEMBER_FAILED);
      } else {
        onMemberRemoved();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : TEAM_ERRORS.REMOVE_MEMBER_FAILED;
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
          <DropdownMenuItem
            onClick={handleRemove}
            disabled={isLoading}
            variant="destructive"
          >
            <UserMinus className="w-4 h-4 mr-2" />
            {TEAM_LABELS.REMOVE_MEMBER}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
