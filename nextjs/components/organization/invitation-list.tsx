"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import {
  INVITATION_LABELS,
  INVITATION_ERRORS,
  INVITATION_SUCCESS,
} from "@/lib/constants";
import { InvitationForm } from "./invitation-form";
import { InvitationActions } from "./invitation-actions";
import { Plus, Mail, Search } from "lucide-react";

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

  const loadInvitations = async () => {
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
  };

  useEffect(() => {
    loadInvitations();
  }, [organizationId]);

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
            {INVITATION_LABELS.PENDING}
          </span>
        );
      case "accepted":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
            {INVITATION_LABELS.ACCEPTED}
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
            {INVITATION_LABELS.REJECTED}
          </span>
        );
      case "expired":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200">
            {INVITATION_LABELS.EXPIRED}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200">
            {status}
          </span>
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
        <button
          onClick={() => setShowInviteForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          <Plus className="w-5 h-5" />
          {INVITATION_LABELS.SEND_INVITATION}
        </button>
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

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            {INVITATION_LABELS.LOADING}
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            {INVITATION_LABELS.NO_INVITATIONS}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {INVITATION_LABELS.EMAIL}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {INVITATION_LABELS.ROLE}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {INVITATION_LABELS.STATUS}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {INVITATION_LABELS.SENT_AT}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {INVITATION_LABELS.ACTIONS}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInvitations.map((invitation) => (
                  <tr
                    key={invitation.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {invitation.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                        {invitation.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(invitation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(invitation.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <InvitationActions
                        invitation={invitation}
                        organizationId={organizationId}
                        onActionSuccess={handleActionSuccess}
                        onInvitationRemoved={handleInvitationRemoved}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
