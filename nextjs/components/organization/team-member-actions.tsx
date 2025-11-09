"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { TEAM_LABELS, TEAM_ERRORS } from "@/lib/constants";
import { MoreVertical, UserMinus } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove this team member?")) {
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
        alert(result.error.message || TEAM_ERRORS.REMOVE_MEMBER_FAILED);
      } else {
        onMemberRemoved();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : TEAM_ERRORS.REMOVE_MEMBER_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
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
            <button
              onClick={handleRemove}
              disabled={isLoading}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <UserMinus className="w-4 h-4" />
              {TEAM_LABELS.REMOVE_MEMBER}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
