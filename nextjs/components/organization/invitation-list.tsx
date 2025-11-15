"use client";

import { Mail, Plus } from "lucide-react";
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
import { INVITATION_ERRORS, INVITATION_LABELS, INVITATION_SUCCESS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";
import { extractInvitations, normalizeInvitations } from "@/lib/utils/organization-data";
import type {
  Invitation,
  InvitationListProps,
  InvitationListResponse,
  NormalizedInvitation,
} from "@/lib/utils/organization-types";
import { InvitationActions } from "./invitation-actions";
import { InvitationForm } from "./invitation-form";
import { EmptyState } from "./shared/empty-state";
import { ErrorMessage } from "./shared/error-message";
import { LoadingState } from "./shared/loading-state";
import { SearchInput } from "./shared/search-input";
import { SuccessMessage } from "./shared/success-message";

export function InvitationList({ organizationId }: InvitationListProps) {
  const [invitations, setInvitations] = useState<NormalizedInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const { searchValue, handleSearch } = useSearch();
  const { success, showSuccess, clearSuccess } = useSuccessMessage();
  const { error, showError, clearError } = useErrorMessage();

  const loadInvitations = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      const result = await authClient.organization.listInvitations({
        query: {
          organizationId,
        },
      });

      if (result.error) {
        showError(result.error.message || INVITATION_ERRORS.LOAD_INVITATIONS_FAILED);
      } else if (result.data) {
        const normalizedInvitations = normalizeInvitations(
          extractInvitations(result.data as InvitationListResponse | Invitation[])
        );
        setInvitations(normalizedInvitations);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : INVITATION_ERRORS.LOAD_INVITATIONS_FAILED;
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, clearError, showError]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleInvitationSent = () => {
    setShowInviteForm(false);
    showSuccess(INVITATION_SUCCESS.INVITATION_SENT);
    loadInvitations();
  };

  const handleActionSuccess = (message: string) => {
    showSuccess(message);
    loadInvitations();
  };

  const handleInvitationRemoved = () => {
    loadInvitations();
  };

  const filteredInvitations = invitations.filter((inv) =>
    inv.email.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-300 dark:border-yellow-800"
          >
            {INVITATION_LABELS.PENDING}
          </Badge>
        );
      case "accepted":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-300 dark:border-green-800"
          >
            {INVITATION_LABELS.ACCEPTED}
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-300 dark:border-red-800"
          >
            {INVITATION_LABELS.REJECTED}
          </Badge>
        );
      case "expired":
        return <Badge variant="secondary">{INVITATION_LABELS.EXPIRED}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-gray-900 dark:text-white" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {INVITATION_LABELS.TITLE}
          </h2>
        </div>
        <Button onClick={() => setShowInviteForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {INVITATION_LABELS.SEND_INVITATION}
        </Button>
      </div>

      <ErrorMessage message={error} onDismiss={clearError} className="mb-4" />
      <SuccessMessage message={success} onDismiss={clearSuccess} className="mb-4" />

      {showInviteForm && (
        <div className="mb-6">
          <InvitationForm
            organizationId={organizationId}
            onSuccess={handleInvitationSent}
            onCancel={() => setShowInviteForm(false)}
          />
        </div>
      )}

      <div className="mb-4">
        <SearchInput
          placeholder={INVITATION_LABELS.SEARCH_INVITATIONS}
          value={searchValue}
          onChange={handleSearch}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState message={INVITATION_LABELS.LOADING} />
          ) : filteredInvitations.length === 0 ? (
            <EmptyState message={INVITATION_LABELS.NO_INVITATIONS} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{INVITATION_LABELS.EMAIL}</TableHead>
                  <TableHead>{INVITATION_LABELS.ROLE}</TableHead>
                  <TableHead>{INVITATION_LABELS.STATUS}</TableHead>
                  <TableHead>{INVITATION_LABELS.SENT_AT}</TableHead>
                  <TableHead>{INVITATION_LABELS.ACTIONS}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                    <TableCell>{formatDate(invitation.createdAt)}</TableCell>
                    <TableCell>
                      <InvitationActions
                        invitation={invitation}
                        organizationId={organizationId}
                        onActionSuccess={handleActionSuccess}
                        onInvitationRemoved={handleInvitationRemoved}
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
