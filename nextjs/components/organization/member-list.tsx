"use client";

import { Plus, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useErrorMessage } from "@/hooks/organization/use-error-message";
import { useSearch } from "@/hooks/organization/use-search";
import { useSuccessMessage } from "@/hooks/organization/use-success-message";
import { authClient } from "@/lib/auth-client";
import { MEMBER_ERRORS, MEMBER_LABELS, MEMBER_SUCCESS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";
import { extractMembers, normalizeMembers } from "@/lib/utils/organization-data";
import type { MemberListProps, NormalizedMember } from "@/lib/utils/organization-types";
import { AddMemberDialog } from "./add-member-dialog";
import { MemberActions } from "./member-actions";
import { EmptyState } from "./shared/empty-state";
import { ErrorMessage } from "./shared/error-message";
import { LoadingState } from "./shared/loading-state";
import { SearchInput } from "./shared/search-input";
import { SuccessMessage } from "./shared/success-message";

export function MemberList({ organizationId }: MemberListProps) {
  const [members, setMembers] = useState<NormalizedMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

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
        showError(membersResult.error.message || MEMBER_ERRORS.LOAD_MEMBERS_FAILED);
      } else if (membersResult.data) {
        const normalizedMembers = normalizeMembers(extractMembers(membersResult.data));
        setMembers(normalizedMembers);

        // Find current user's role in the organization
        if (sessionResult.data?.user?.id) {
          setCurrentUserId(sessionResult.data.user.id);
          const currentMember = normalizedMembers.find(
            (m) => m.userId === sessionResult.data.user.id
          );
          if (currentMember) {
            setCurrentUserRole(currentMember.role);
          }
        }
      } else {
        if (sessionResult.data?.user?.id) {
          setCurrentUserId(sessionResult.data.user.id);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : MEMBER_ERRORS.LOAD_MEMBERS_FAILED;
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, clearError, showError]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAddMemberSuccess = () => {
    showSuccess(MEMBER_SUCCESS.MEMBER_ADDED);
    loadMembers();
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
      member.user?.name?.toLowerCase().includes(searchValue.toLowerCase())
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
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {MEMBER_LABELS.ADD_MEMBER}
        </Button>
      </div>

      <ErrorMessage message={error} onDismiss={clearError} className="mb-4" />
      <SuccessMessage message={success} onDismiss={clearSuccess} className="mb-4" />

      <AddMemberDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        organizationId={organizationId}
        existingMembers={members}
        onSuccess={handleAddMemberSuccess}
      />

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
                    <TableCell className="font-medium">{member.user?.email || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{member.role}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(member.createdAt)}</TableCell>
                    <TableCell>
                      <MemberActions
                        member={member}
                        organizationId={organizationId}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
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
