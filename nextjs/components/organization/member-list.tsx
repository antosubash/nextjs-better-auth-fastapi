"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import {
  MEMBER_LABELS,
  MEMBER_ERRORS,
  MEMBER_SUCCESS,
  MEMBER_PLACEHOLDERS,
  ORGANIZATION_ROLES,
} from "@/lib/constants";
import { MemberActions } from "./member-actions";
import { Plus, Users } from "lucide-react";
import { MemberRoleSelector } from "./member-role-selector";
import { formatDate } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSearch } from "@/hooks/organization/use-search";
import { useSuccessMessage } from "@/hooks/organization/use-success-message";
import { useErrorMessage } from "@/hooks/organization/use-error-message";
import { SearchInput } from "./shared/search-input";
import { SuccessMessage } from "./shared/success-message";
import { ErrorMessage } from "./shared/error-message";
import { LoadingState } from "./shared/loading-state";
import { EmptyState } from "./shared/empty-state";
import {
  normalizeMembers,
  extractMembers,
} from "@/lib/utils/organization-data";
import type { NormalizedMember, MemberListProps } from "@/lib/utils/organization-types";

export function MemberList({ organizationId }: MemberListProps) {
  const [members, setMembers] = useState<NormalizedMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<string>(
    ORGANIZATION_ROLES.MEMBER,
  );
  const [isAdding, setIsAdding] = useState(false);

  const { searchValue, handleSearch } = useSearch();
  const { success, showSuccess, clearSuccess } = useSuccessMessage();
  const { error, showError, clearError } = useErrorMessage();

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      const [membersResult, sessionResult] = await Promise.all([
        authClient.organization.listMembers({
          query: {
            organizationId,
          },
        }),
        authClient.getSession(),
      ]);

      if (membersResult.error) {
        showError(
          membersResult.error.message || MEMBER_ERRORS.LOAD_MEMBERS_FAILED,
        );
      } else if (membersResult.data) {
        const normalizedMembers = normalizeMembers(
          extractMembers(membersResult.data),
        );
        setMembers(normalizedMembers);
      }

      if (sessionResult.data?.user?.id) {
        setCurrentUserId(sessionResult.data.user.id);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : MEMBER_ERRORS.LOAD_MEMBERS_FAILED;
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, clearError, showError]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    clearError();
    try {
      const result = await authClient.organization.addMember({
        organizationId,
        userId: newMemberEmail,
        role: newMemberRole,
      });

      if (result.error) {
        showError(result.error.message || MEMBER_ERRORS.ADD_FAILED);
      } else {
        showSuccess(MEMBER_SUCCESS.MEMBER_ADDED);
        setNewMemberEmail("");
        setNewMemberRole(ORGANIZATION_ROLES.MEMBER);
        setShowAddForm(false);
        loadMembers();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : MEMBER_ERRORS.ADD_FAILED;
      showError(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleActionSuccess = (message: string) => {
    showSuccess(message);
    loadMembers();
  };

  const handleMemberRemoved = () => {
    showSuccess(MEMBER_SUCCESS.MEMBER_REMOVED);
    loadMembers();
  };

  const filteredMembers = members.filter(
    (member) =>
      member.user?.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
      member.user?.name?.toLowerCase().includes(searchValue.toLowerCase()),
  );

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-gray-900 dark:text-white" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {MEMBER_LABELS.TITLE}
          </h2>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {MEMBER_LABELS.ADD_MEMBER}
        </Button>
      </div>

      <ErrorMessage message={error} onDismiss={clearError} className="mb-4" />
      <SuccessMessage message={success} onDismiss={clearSuccess} className="mb-4" />

      {showAddForm && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {MEMBER_LABELS.ADD_MEMBER}
          </h3>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {MEMBER_LABELS.EMAIL}
              </label>
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder={MEMBER_PLACEHOLDERS.EMAIL}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {MEMBER_LABELS.ROLE}
              </label>
              <MemberRoleSelector
                value={newMemberRole}
                onChange={(value) => setNewMemberRole(value)}
                disabled={isAdding}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isAdding}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? MEMBER_LABELS.ADDING : MEMBER_LABELS.ADD_MEMBER}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewMemberEmail("");
                }}
                disabled={isAdding}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {MEMBER_LABELS.CANCEL}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4">
        <SearchInput
          placeholder={MEMBER_LABELS.SEARCH_MEMBERS}
          value={searchValue}
          onChange={handleSearch}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState message={MEMBER_LABELS.LOADING} />
          ) : filteredMembers.length === 0 ? (
            <EmptyState message={MEMBER_LABELS.NO_MEMBERS} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{MEMBER_LABELS.EMAIL}</TableHead>
                  <TableHead>{MEMBER_LABELS.ROLE}</TableHead>
                  <TableHead>{MEMBER_LABELS.JOINED_AT}</TableHead>
                  <TableHead>{MEMBER_LABELS.ACTIONS}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.user?.email || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{member.role}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(member.createdAt)}</TableCell>
                    <TableCell>
                      <MemberActions
                        member={member}
                        organizationId={organizationId}
                        currentUserId={currentUserId}
                        onActionSuccess={handleActionSuccess}
                        onMemberRemoved={handleMemberRemoved}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
