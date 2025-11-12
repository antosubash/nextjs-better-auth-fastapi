"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { MEMBER_LABELS, MEMBER_ERRORS, MEMBER_SUCCESS } from "@/lib/constants";
import { MoreVertical, UserMinus, Shield, LogOut } from "lucide-react";
import { MemberRoleSelector } from "./member-role-selector";
import { ErrorToast } from "@/components/ui/error-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Member {
  id: string;
  userId: string;
  role: string;
  user?: {
    email: string;
    name?: string;
  };
}

interface MemberActionsProps {
  member: Member;
  organizationId: string;
  currentUserId?: string;
  currentUserRole?: string;
  onActionSuccess: (message: string) => void;
  onMemberRemoved: () => void;
}

export function MemberActions({
  member,
  organizationId,
  currentUserId,
  currentUserRole,
  onActionSuccess,
  onMemberRemoved,
}: MemberActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState(member.role);
  const [error, setError] = useState<string | null>(null);

  const isCurrentUser = member.userId === currentUserId;
  const isOwner = currentUserRole === "owner";

  const handleUpdateRole = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.organization.updateMemberRole({
        organizationId,
        memberId: member.id,
        role: [newRole],
      });

      if (result.error) {
        setError(result.error.message || MEMBER_ERRORS.UPDATE_ROLE_FAILED);
      } else {
        onActionSuccess(MEMBER_SUCCESS.ROLE_UPDATED);
        setShowRoleModal(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : MEMBER_ERRORS.UPDATE_ROLE_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(MEMBER_LABELS.CONFIRM_REMOVE)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.organization.removeMember({
        organizationId,
        memberIdOrEmail: member.id,
      });

      if (result.error) {
        // Better Auth returns "You are not allowed to delete this member" when user is not an owner
        const errorMessage = result.error.message || MEMBER_ERRORS.REMOVE_FAILED;
        if (errorMessage.includes("not allowed")) {
          setError("Only organization owners can remove members");
        } else {
          setError(errorMessage);
        }
      } else {
        onMemberRemoved();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : MEMBER_ERRORS.REMOVE_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm(MEMBER_LABELS.CONFIRM_LEAVE)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.organization.leave({
        organizationId,
      });

      if (result.error) {
        setError(result.error.message || MEMBER_ERRORS.LEAVE_FAILED);
      } else {
        onActionSuccess(MEMBER_SUCCESS.LEFT_ORGANIZATION);
        window.location.href = "/admin/organizations";
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : MEMBER_ERRORS.LEAVE_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <ErrorToast
          message={error}
          onDismiss={() => setError(null)}
          duration={5000}
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setShowRoleModal(true)}
            disabled={isLoading}
          >
            <Shield className="w-4 h-4 mr-2" />
            {MEMBER_LABELS.UPDATE_ROLE}
          </DropdownMenuItem>

          {isCurrentUser ? (
            <DropdownMenuItem
              onClick={handleLeave}
              disabled={isLoading}
              className="text-red-600 dark:text-red-400"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {MEMBER_LABELS.LEAVE_ORGANIZATION}
            </DropdownMenuItem>
          ) : isOwner ? (
            <DropdownMenuItem
              onClick={handleRemove}
              disabled={isLoading}
              className="text-red-600 dark:text-red-400"
            >
              <UserMinus className="w-4 h-4 mr-2" />
              {MEMBER_LABELS.REMOVE_MEMBER}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{MEMBER_LABELS.UPDATE_ROLE}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2">
              {MEMBER_LABELS.ROLE}
            </label>
            <MemberRoleSelector
              value={newRole}
              onChange={setNewRole}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRoleModal(false);
                setNewRole(member.role);
              }}
              disabled={isLoading}
            >
              {MEMBER_LABELS.CANCEL}
            </Button>
            <Button onClick={handleUpdateRole} disabled={isLoading}>
              {isLoading ? MEMBER_LABELS.SAVING : MEMBER_LABELS.UPDATE_ROLE}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
