"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { TEAM_LABELS, TEAM_ERRORS, MEMBER_PLACEHOLDERS } from "@/lib/constants";
import { TeamMemberActions } from "./team-member-actions";
import { Plus } from "lucide-react";

interface TeamMember {
  id: string;
  userId: string;
  user?: {
    email: string;
    name?: string;
  };
}

interface TeamMemberListProps {
  teamId: string;
}

export function TeamMemberList({
  teamId,
}: TeamMemberListProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // @ts-expect-error - better-auth organization client API method
      const result = await authClient.organization.listTeamMembers({
        query: {
          teamId,
        },
      });

      if (result.error) {
        setError(result.error.message || TEAM_ERRORS.ADD_MEMBER_FAILED);
      } else if (result.data) {
        const membersData = Array.isArray(result.data)
          ? result.data
          : (result.data as { members?: TeamMember[] })?.members || [];
        setMembers(membersData);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : TEAM_ERRORS.ADD_MEMBER_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setError("");
    try {
      // @ts-expect-error - better-auth organization client API method
      const result = await authClient.organization.addTeamMember({
        teamId,
        userId: newMemberEmail, // Note: This should be a user ID, not email. You may need to look up the user first.
      });

      if (result.error) {
        setError(result.error.message || TEAM_ERRORS.ADD_MEMBER_FAILED);
      } else {
        setNewMemberEmail("");
        setShowAddForm(false);
        loadMembers();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : TEAM_ERRORS.ADD_MEMBER_FAILED;
      setError(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleMemberRemoved = () => {
    loadMembers();
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {TEAM_LABELS.MEMBERS}
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          <Plus className="w-4 h-4" />
          {TEAM_LABELS.ADD_MEMBER}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleAddMember} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder={MEMBER_PLACEHOLDERS.EMAIL}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isAdding}
                className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isAdding ? "Adding..." : TEAM_LABELS.ADD_MEMBER}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewMemberEmail("");
                }}
                disabled={isAdding}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="p-4 text-center text-gray-600 dark:text-gray-400 text-sm">
          Loading...
        </div>
      ) : members.length === 0 ? (
        <div className="p-4 text-center text-gray-600 dark:text-gray-400 text-sm">
          No team members
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                >
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {member.user?.email || "Unknown"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <TeamMemberActions
                      member={member}
                      teamId={teamId}
                      onMemberRemoved={handleMemberRemoved}
                    />
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
