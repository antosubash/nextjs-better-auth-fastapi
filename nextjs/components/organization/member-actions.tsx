"use client";

import { Loader2, LogOut, MoreVertical, Shield, UserMinus } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorToast } from "@/components/ui/error-toast";
import { Label } from "@/components/ui/label";
import { MEMBER_ERRORS, MEMBER_LABELS, MEMBER_SUCCESS } from "@/lib/constants";
import {
  useLeaveOrganization,
  useRemoveMember,
  useUpdateMemberRole,
} from "@/lib/hooks/api/use-auth";
import { MemberRoleSelector } from "./member-role-selector";

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
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [newRole, setNewRole] = useState(member.role);
  const [error, setError] = useState<string | null>(null);

  const updateRoleMutation = useUpdateMemberRole();
  const removeMemberMutation = useRemoveMember();
  const leaveOrgMutation = useLeaveOrganization();

  const isLoading =
    updateRoleMutation.isPending || removeMemberMutation.isPending || leaveOrgMutation.isPending;

  const isCurrentUser = member.userId === currentUserId;
  const isOwner = currentUserRole === "owner";

  const handleUpdateRole = async () => {
    try {
      await updateRoleMutation.mutateAsync({
        organizationId,
        memberId: member.id,
        role: [newRole],
      });
      onActionSuccess(MEMBER_SUCCESS.ROLE_UPDATED);
      setShowRoleModal(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : MEMBER_ERRORS.UPDATE_ROLE_FAILED;
      setError(errorMessage);
    }
  };

  const handleRemove = async () => {
    try {
      await removeMemberMutation.mutateAsync({
        organizationId,
        memberIdOrEmail: member.id,
      });
      onMemberRemoved();
      setShowRemoveDialog(false);
    } catch (err) {
      // Better Auth returns "You are not allowed to delete this member" when user is not an owner
      const errorMessage = err instanceof Error ? err.message : MEMBER_ERRORS.REMOVE_FAILED;
      if (errorMessage.includes("not allowed")) {
        setError("Only organization owners can remove members");
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleLeave = async () => {
    try {
      await leaveOrgMutation.mutateAsync(organizationId);
      onActionSuccess(MEMBER_SUCCESS.LEFT_ORGANIZATION);
      setShowLeaveDialog(false);
      window.location.href = "/admin/organizations";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : MEMBER_ERRORS.LEAVE_FAILED;
      setError(errorMessage);
    }
  };

  return (
    <>
      {error && <ErrorToast message={error} onDismiss={() => setError(null)} duration={5000} />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowRoleModal(true)} disabled={isLoading}>
            <Shield className="w-4 h-4 mr-2" />
            {MEMBER_LABELS.UPDATE_ROLE}
          </DropdownMenuItem>
          {(isCurrentUser || isOwner) && <DropdownMenuSeparator />}
          {isCurrentUser ? (
            <DropdownMenuItem
              onClick={() => setShowLeaveDialog(true)}
              disabled={isLoading}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {MEMBER_LABELS.LEAVE_ORGANIZATION}
            </DropdownMenuItem>
          ) : isOwner ? (
            <DropdownMenuItem
              onClick={() => setShowRemoveDialog(true)}
              disabled={isLoading}
              className="text-destructive focus:text-destructive"
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
          <div className="py-4 space-y-2">
            <Label>{MEMBER_LABELS.ROLE}</Label>
            <MemberRoleSelector value={newRole} onChange={setNewRole} disabled={isLoading} />
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
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {MEMBER_LABELS.SAVING}
                </>
              ) : (
                MEMBER_LABELS.UPDATE_ROLE
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{MEMBER_LABELS.REMOVE_MEMBER}</AlertDialogTitle>
            <AlertDialogDescription>{MEMBER_LABELS.CONFIRM_REMOVE}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{MEMBER_LABELS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                MEMBER_LABELS.REMOVE_MEMBER
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{MEMBER_LABELS.LEAVE_ORGANIZATION}</AlertDialogTitle>
            <AlertDialogDescription>{MEMBER_LABELS.CONFIRM_LEAVE}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{MEMBER_LABELS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Leaving...
                </>
              ) : (
                MEMBER_LABELS.LEAVE_ORGANIZATION
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
