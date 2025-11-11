"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { TEAM_LABELS, TEAM_ERRORS, MEMBER_PLACEHOLDERS, TEAM_MEMBER_LABELS, MEMBER_LABELS, COMMON_LABELS } from "@/lib/constants";
import { TeamMemberActions } from "./team-member-actions";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  normalizeMembers,
  extractMembers,
} from "@/lib/utils/organization-data";
import type { NormalizedMember } from "@/lib/utils/organization-types";

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
  organizationId?: string;
}

export function TeamMemberList({
  teamId,
  organizationId,
}: TeamMemberListProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<NormalizedMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrgMembers, setIsLoadingOrgMembers] = useState(false);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
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

  const loadOrganizationMembers = useCallback(async () => {
    if (!organizationId) return;
    
    setIsLoadingOrgMembers(true);
    try {
      const result = await authClient.organization.listMembers({
        query: {
          organizationId,
        },
      });

      if (result.error) {
        console.error("Failed to load organization members:", result.error);
      } else if (result.data) {
        const normalizedMembers = normalizeMembers(
          extractMembers(result.data),
        );
        // Filter out members already in the team
        const teamMemberIds = new Set(members.map(m => m.userId));
        const availableMembers = normalizedMembers.filter(
          m => !teamMemberIds.has(m.userId)
        );
        setOrganizationMembers(availableMembers);
      }
    } catch (err) {
      console.error("Error loading organization members:", err);
    } finally {
      setIsLoadingOrgMembers(false);
    }
  }, [organizationId, members]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (showAddForm && organizationId) {
      loadOrganizationMembers();
    }
  }, [showAddForm, organizationId, loadOrganizationMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError("Please select a member");
      return;
    }

    setIsAdding(true);
    setError("");
    try {
      // @ts-expect-error - better-auth organization client API method
      const result = await authClient.organization.addTeamMember({
        teamId,
        userId: selectedUserId,
      });

      if (result.error) {
        setError(result.error.message || TEAM_ERRORS.ADD_MEMBER_FAILED);
      } else {
        setSelectedUserId("");
        setShowAddForm(false);
        await loadMembers();
        // Reload organization members to update the dropdown
        if (organizationId) {
          await loadOrganizationMembers();
        }
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
        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {TEAM_LABELS.ADD_MEMBER}
        </Button>
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
                {organizationId ? TEAM_MEMBER_LABELS.SELECT_MEMBER || "Select Member" : TEAM_MEMBER_LABELS.EMAIL}
              </label>
              {organizationId && organizationMembers.length > 0 ? (
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={isAdding || isLoadingOrgMembers}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={MEMBER_PLACEHOLDERS.SELECT_MEMBER || "Select a member"} />
                  </SelectTrigger>
                  <SelectContent>
                    {organizationMembers.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.user?.email || member.userId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : organizationId ? (
                <input
                  type="text"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  placeholder={MEMBER_PLACEHOLDERS.EMAIL}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
                />
              ) : (
                <input
                  type="email"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  placeholder={MEMBER_PLACEHOLDERS.EMAIL}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
                />
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isAdding || !selectedUserId}
                className="flex-1"
              >
                {isAdding ? MEMBER_LABELS.ADDING : TEAM_LABELS.ADD_MEMBER}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedUserId("");
                }}
                disabled={isAdding}
              >
                {COMMON_LABELS.CANCEL}
              </Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="p-4 text-center text-gray-600 dark:text-gray-400 text-sm">
          {TEAM_MEMBER_LABELS.LOADING}
        </div>
      ) : members.length === 0 ? (
        <div className="p-4 text-center text-gray-600 dark:text-gray-400 text-sm">
          {TEAM_MEMBER_LABELS.NO_MEMBERS}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {TEAM_MEMBER_LABELS.EMAIL}
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {TEAM_MEMBER_LABELS.ACTIONS}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  {member.user?.email || "Unknown"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <TeamMemberActions
                    member={member}
                    teamId={teamId}
                    onMemberRemoved={handleMemberRemoved}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
