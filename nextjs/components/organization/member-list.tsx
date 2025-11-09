"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import {
  MEMBER_LABELS,
  MEMBER_ERRORS,
  MEMBER_SUCCESS,
  ORGANIZATION_ROLES,
} from "@/lib/constants";
import { MemberActions } from "./member-actions";
import { Plus, Users, Search } from "lucide-react";
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

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: number;
  user?: {
    email: string;
    name?: string;
  };
}

interface MemberListProps {
  organizationId: string;
}

export function MemberList({ organizationId }: MemberListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<string>(
    ORGANIZATION_ROLES.MEMBER,
  );
  const [isAdding, setIsAdding] = useState(false);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setError("");
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
        setError(
          membersResult.error.message || MEMBER_ERRORS.LOAD_MEMBERS_FAILED,
        );
      } else if (membersResult.data) {
        const membersData = Array.isArray(membersResult.data)
          ? (membersResult.data as Array<Record<string, unknown>>)
          : (
              membersResult.data as unknown as {
                members?: Array<Record<string, unknown>>;
              }
            )?.members || [];
        setMembers(
          membersData.map((m: Record<string, unknown>) => {
            const createdAt = m.createdAt as number | Date | string | undefined;
            return {
              id: m.id as string,
              userId: m.userId as string,
              role: m.role as string,
              createdAt:
                typeof createdAt === "number"
                  ? createdAt
                  : createdAt instanceof Date
                    ? createdAt.getTime()
                    : createdAt
                      ? new Date(createdAt as string).getTime()
                      : Date.now(),
              user: m.user as Member["user"],
            };
          }),
        );
      }

      if (sessionResult.data?.user?.id) {
        setCurrentUserId(sessionResult.data.user.id);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : MEMBER_ERRORS.LOAD_MEMBERS_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setError("");
    try {
      // @ts-expect-error - better-auth organization client API method
      const result = await authClient.organization.addMember({
        organizationId,
        userId: newMemberEmail, // Better Auth will look up user by email if userId is an email
        role: newMemberRole,
      });

      if (result.error) {
        setError(result.error.message || MEMBER_ERRORS.ADD_FAILED);
      } else {
        setSuccess(MEMBER_SUCCESS.MEMBER_ADDED);
        setTimeout(() => setSuccess(""), 3000);
        setNewMemberEmail("");
        setNewMemberRole(ORGANIZATION_ROLES.MEMBER);
        setShowAddForm(false);
        loadMembers();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : MEMBER_ERRORS.ADD_FAILED;
      setError(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const handleActionSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
    loadMembers();
  };

  const handleMemberRemoved = () => {
    setSuccess(MEMBER_SUCCESS.MEMBER_REMOVED);
    setTimeout(() => setSuccess(""), 3000);
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
                placeholder="Enter member email"
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
                {isAdding ? "Adding..." : MEMBER_LABELS.ADD_MEMBER}
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
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={MEMBER_LABELS.SEARCH_MEMBERS}
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
              {MEMBER_LABELS.LOADING}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {MEMBER_LABELS.NO_MEMBERS}
            </div>
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
