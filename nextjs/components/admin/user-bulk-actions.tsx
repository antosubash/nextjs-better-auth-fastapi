"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { RoleInfo } from "@/lib/permissions-utils";
import { getValidAssignableRole, canBanRole } from "@/lib/utils/role-validation";
import {
  ADMIN_BULK_ACTIONS,
  ADMIN_LABELS,
  ADMIN_PLACEHOLDERS,
  ADMIN_SUCCESS,
  ADMIN_ERRORS,
  USER_ROLES,
  ROLE_DISPLAY_NAMES,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Shield, Ban, UserCheck, Loader2 } from "lucide-react";

interface User {
  id: string;
  role?: string;
}

interface UserBulkActionsProps {
  selectedUserIds: Set<string>;
  users: User[];
  availableRoles: RoleInfo[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onComplete: () => void;
}

export function UserBulkActions({
  selectedUserIds,
  users,
  availableRoles,
  onSuccess,
  onError,
  onComplete,
}: UserBulkActionsProps) {
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkRoleDialog, setShowBulkRoleDialog] = useState(false);
  const [showBulkBanDialog, setShowBulkBanDialog] = useState(false);
  const [showBulkUnbanDialog, setShowBulkUnbanDialog] = useState(false);
  const [bulkRole, setBulkRole] = useState<string>("");
  const [bulkBanReason, setBulkBanReason] = useState("");
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  const handleBulkDelete = async () => {
    setIsProcessingBulk(true);
    try {
      const userIds = Array.from(selectedUserIds);
      const results = await Promise.allSettled(
        userIds.map((userId) => authClient.admin.removeUser({ userId }))
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        onError(`${failed} users failed to delete`);
      } else {
        onSuccess(ADMIN_SUCCESS.BULK_DELETE_SUCCESS);
      }
      setShowBulkDeleteDialog(false);
      onComplete();
    } catch {
      onError(ADMIN_ERRORS.BULK_DELETE_FAILED);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkRoleChange = async () => {
    if (!bulkRole) return;
    setIsProcessingBulk(true);
    try {
      const userIds = Array.from(selectedUserIds);
      // Ensure only assignable roles are used
      const validRole = getValidAssignableRole(bulkRole, availableRoles[0]?.name || USER_ROLES.USER);

      // Better Auth client types don't include custom roles, but they are supported at runtime
      const results = await Promise.allSettled(
        userIds.map((userId) =>
          authClient.admin.setRole({ 
            userId, 
            // @ts-expect-error - Better Auth types only include "user" | "admin" but custom roles are supported
            role: validRole 
          })
        )
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        onError(`${failed} users failed to update`);
      } else {
        onSuccess(ADMIN_SUCCESS.BULK_ROLE_SET_SUCCESS);
      }
      setBulkRole("");
      setShowBulkRoleDialog(false);
      onComplete();
    } catch {
      onError(ADMIN_ERRORS.BULK_ROLE_SET_FAILED);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkBan = async () => {
    setIsProcessingBulk(true);
    try {
      const userIds = Array.from(selectedUserIds);
      
      // Filter out admin users
      const adminUserIds = userIds.filter((userId) => {
        const user = users.find((u) => u.id === userId);
        return !canBanRole(user?.role);
      });
      
      const nonAdminUserIds = userIds.filter((userId) => {
        const user = users.find((u) => u.id === userId);
        return canBanRole(user?.role);
      });

      if (nonAdminUserIds.length === 0) {
        onError(ADMIN_ERRORS.CANNOT_BAN_ADMIN);
        setBulkBanReason("");
        setShowBulkBanDialog(false);
        setIsProcessingBulk(false);
        return;
      }

      const results = await Promise.allSettled(
        nonAdminUserIds.map((userId) =>
          authClient.admin.banUser({
            userId,
            banReason: bulkBanReason || undefined,
          })
        )
      );

      // Check for failed results
      // Note: We already filtered out admin users, so any errors are not admin-related
      const failedResults = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && r.value.error)
      );

      const successfulBans = results.filter(
        (r) => r.status === "fulfilled" && !r.value.error
      );

      if (failedResults.length > 0) {
        if (successfulBans.length > 0) {
          const message =
            adminUserIds.length > 0
              ? `${successfulBans.length} user(s) banned. ${adminUserIds.length} admin user(s) skipped. ${failedResults.length} user(s) failed.`
              : `${successfulBans.length} user(s) banned. ${failedResults.length} user(s) failed.`;
          onSuccess(message);
        } else {
          onError(`${failedResults.length} users failed to ban`);
        }
      } else {
        const successMessage =
          adminUserIds.length > 0
            ? `${nonAdminUserIds.length} user(s) banned. ${adminUserIds.length} admin user(s) skipped.`
            : ADMIN_SUCCESS.BULK_BAN_SUCCESS;
        onSuccess(successMessage);
      }
      setBulkBanReason("");
      setShowBulkBanDialog(false);
      onComplete();
    } catch {
      onError(ADMIN_ERRORS.BULK_BAN_FAILED);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkUnban = async () => {
    setIsProcessingBulk(true);
    try {
      const userIds = Array.from(selectedUserIds);
      const results = await Promise.allSettled(
        userIds.map((userId) => authClient.admin.unbanUser({ userId }))
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        onError(`${failed} users failed to unban`);
      } else {
        onSuccess(ADMIN_SUCCESS.BULK_UNBAN_SUCCESS);
      }
      setShowBulkUnbanDialog(false);
      onComplete();
    } catch {
      onError(ADMIN_ERRORS.BULK_UNBAN_FAILED);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  if (selectedUserIds.size === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {selectedUserIds.size} {ADMIN_BULK_ACTIONS.SELECTED_COUNT}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkRoleDialog(true)}
              >
                <Shield className="w-4 h-4 mr-2" />
                {ADMIN_BULK_ACTIONS.CHANGE_ROLE}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkBanDialog(true)}
              >
                <Ban className="w-4 h-4 mr-2" />
                {ADMIN_BULK_ACTIONS.BAN_SELECTED}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkUnbanDialog(true)}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                {ADMIN_BULK_ACTIONS.UNBAN_SELECTED}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {ADMIN_BULK_ACTIONS.DELETE_SELECTED}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ADMIN_BULK_ACTIONS.CONFIRM_BULK_DELETE}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUserIds.size} {ADMIN_BULK_ACTIONS.SELECTED_COUNT}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingBulk}>
              {ADMIN_LABELS.CANCEL}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isProcessingBulk}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessingBulk ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {ADMIN_BULK_ACTIONS.PROCESSING}
                </>
              ) : (
                ADMIN_BULK_ACTIONS.DELETE_SELECTED
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showBulkRoleDialog} onOpenChange={setShowBulkRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ADMIN_BULK_ACTIONS.CHANGE_ROLE}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{ADMIN_LABELS.ROLE}</Label>
              <Select value={bulkRole} onValueChange={setBulkRole}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={ADMIN_PLACEHOLDERS.ROLE} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.name} value={role.name}>
                      {ROLE_DISPLAY_NAMES[
                        role.name as keyof typeof ROLE_DISPLAY_NAMES
                      ] || role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkRoleDialog(false);
                setBulkRole("");
              }}
              disabled={isProcessingBulk}
            >
              {ADMIN_LABELS.CANCEL}
            </Button>
            <Button
              onClick={handleBulkRoleChange}
              disabled={isProcessingBulk || !bulkRole}
            >
              {isProcessingBulk ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {ADMIN_BULK_ACTIONS.PROCESSING}
                </>
              ) : (
                ADMIN_LABELS.SAVE
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkBanDialog} onOpenChange={setShowBulkBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ADMIN_BULK_ACTIONS.BAN_SELECTED}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkBanReason">
                {ADMIN_LABELS.BAN_REASON} (optional)
              </Label>
              <Input
                id="bulkBanReason"
                value={bulkBanReason}
                onChange={(e) => setBulkBanReason(e.target.value)}
                placeholder={ADMIN_PLACEHOLDERS.BAN_REASON}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkBanDialog(false);
                setBulkBanReason("");
              }}
              disabled={isProcessingBulk}
            >
              {ADMIN_LABELS.CANCEL}
            </Button>
            <Button
              onClick={handleBulkBan}
              disabled={isProcessingBulk}
              variant="destructive"
            >
              {isProcessingBulk ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {ADMIN_BULK_ACTIONS.PROCESSING}
                </>
              ) : (
                ADMIN_BULK_ACTIONS.BAN_SELECTED
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showBulkUnbanDialog}
        onOpenChange={setShowBulkUnbanDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ADMIN_BULK_ACTIONS.CONFIRM_BULK_UNBAN}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUserIds.size} {ADMIN_BULK_ACTIONS.SELECTED_COUNT}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingBulk}>
              {ADMIN_LABELS.CANCEL}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkUnban}
              disabled={isProcessingBulk}
            >
              {isProcessingBulk ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {ADMIN_BULK_ACTIONS.PROCESSING}
                </>
              ) : (
                ADMIN_BULK_ACTIONS.UNBAN_SELECTED
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

