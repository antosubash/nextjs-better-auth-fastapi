"use client";

import { Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
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
import { MEMBER_LABELS, MEMBER_SUCCESS } from "@/lib/constants";
import { useListMembers, useSession } from "@/lib/hooks/api/use-auth";
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
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { searchValue, handleSearch } = useSearch();
  const { success, showSuccess, clearSuccess } = useSuccessMessage();
  const { error, clearError } = useErrorMessage();

  const { data: membersData, isLoading, refetch: refetchMembers } = useListMembers(organizationId);
  const { data: sessionData } = useSession();

  useEffect(() => {
    if (membersData) {
      const normalizedMembers = normalizeMembers(extractMembers(membersData));
      setMembers(normalizedMembers);

      const userId = sessionData?.user?.id;
      if (userId) {
        setCurrentUserId(userId);
        const currentMember = normalizedMembers.find((m) => m.userId === userId);
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
        }
      }
    }
  }, [membersData, sessionData]);

  const handleAddMemberSuccess = () => {
    showSuccess(MEMBER_SUCCESS.MEMBER_ADDED);
    refetchMembers();
  };

  const handleActionSuccess = (message: string) => {
    showSuccess(message);
    refetchMembers();
  };

  const handleMemberRemoved = () => {
    showSuccess(MEMBER_SUCCESS.MEMBER_REMOVED);
    refetchMembers();
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
