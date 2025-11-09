"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import {
  INVITATION_LABELS,
  INVITATION_ERRORS,
  INVITATION_SUCCESS,
} from "@/lib/constants";
import { InvitationForm } from "./invitation-form";
import { InvitationActions } from "./invitation-actions";
import { Plus, Mail, Search } from "lucide-react";
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

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: number;
  expiresAt?: number;
}

interface InvitationListProps {
  organizationId: string;
}

export function InvitationList({ organizationId }: InvitationListProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);

  const loadInvitations = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await authClient.organization.listInvitations({
        query: {
          organizationId,
        },
      });

      if (result.error) {
        setError(
          result.error.message || INVITATION_ERRORS.LOAD_INVITATIONS_FAILED,
        );
      } else if (result.data) {
        const invitationsData = Array.isArray(result.data)
          ? (result.data as Array<Record<string, unknown>>)
          : (
              result.data as unknown as {
                invitations?: Array<Record<string, unknown>>;
              }
            )?.invitations || [];
        setInvitations(
          invitationsData.map((inv: Record<string, unknown>) => {
            const createdAt = inv.createdAt as
              | number
              | Date
              | string
              | undefined;
            const expiresAt = inv.expiresAt as
              | number
              | Date
              | string
              | undefined;
            return {
              id: inv.id as string,
              email: inv.email as string,
              role: inv.role as string,
              status:
                typeof inv.status === "string"
                  ? inv.status
                  : String(inv.status),
              createdAt:
                typeof createdAt === "number"
                  ? createdAt
                  : createdAt instanceof Date
                    ? createdAt.getTime()
                    : createdAt
                      ? new Date(createdAt as string).getTime()
                      : Date.now(),
              expiresAt:
                typeof expiresAt === "number"
                  ? expiresAt
                  : expiresAt instanceof Date
                    ? expiresAt.getTime()
                    : expiresAt
                      ? new Date(expiresAt as string).getTime()
                      : undefined,
            };
          }),
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : INVITATION_ERRORS.LOAD_INVITATIONS_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleInvitationSent = () => {
    setShowInviteForm(false);
    setSuccess(INVITATION_SUCCESS.INVITATION_SENT);
    setTimeout(() => setSuccess(""), 3000);
    loadInvitations();
  };

  const handleActionSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
    loadInvitations();
  };

  const handleInvitationRemoved = () => {
    loadInvitations();
  };

  const filteredInvitations = invitations.filter((inv) =>
    inv.email.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-300 dark:border-yellow-800">
            {INVITATION_LABELS.PENDING}
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-300 dark:border-green-800">
            {INVITATION_LABELS.ACCEPTED}
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-300 dark:border-red-800">
            {INVITATION_LABELS.REJECTED}
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="secondary">
            {INVITATION_LABELS.EXPIRED}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
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

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
          {success}
        </div>
      )}

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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search invitations..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              {INVITATION_LABELS.LOADING}
            </div>
          ) : filteredInvitations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {INVITATION_LABELS.NO_INVITATIONS}
            </div>
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
                    <TableCell className="font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invitation.status)}
                    </TableCell>
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
