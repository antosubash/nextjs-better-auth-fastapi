"use client";

import { useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { getRoles } from "@/lib/permissions-api";
import { RoleInfo } from "@/lib/permissions-utils";
import {
  ADMIN_LABELS,
  ADMIN_ERRORS,
  ADMIN_SUCCESS,
  USER_ROLES,
  ROLE_DISPLAY_NAMES,
} from "@/lib/constants";
import {
  MoreVertical,
  Ban,
  UserCheck,
  Trash2,
  Edit,
  Shield,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean;
}

interface UserActionsProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  onActionSuccess: (message: string) => void;
}

export function UserActions({
  user,
  onEdit,
  onDelete,
  onActionSuccess,
}: UserActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [newRole, setNewRole] = useState<string>(user.role || USER_ROLES.USER);
  const [availableRoles, setAvailableRoles] = useState<RoleInfo[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const loadRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const roles = await getRoles();
      setAvailableRoles(roles);
      if (user.role) {
        const validRole =
          roles.find((r) => r.name === user.role)?.name || USER_ROLES.USER;
        setNewRole(validRole);
      }
    } catch (err) {
      console.error("Failed to load roles:", err);
    } finally {
      setIsLoadingRoles(false);
    }
  }, [user.role]);

  const handleBan = async () => {
    if (user.role === USER_ROLES.ADMIN) {
      alert(ADMIN_ERRORS.CANNOT_BAN_ADMIN);
      setShowBanDialog(false);
      setBanReason("");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.admin.banUser({
        userId: user.id,
        banReason: banReason || undefined,
      });

      // Debug logging
      console.log("Ban user result:", result);

      // Check for error in result
      if (result.error) {
        const errorMessage = result.error.message || ADMIN_ERRORS.BAN_FAILED;
        console.error("Ban user error:", result.error);
        alert(errorMessage);
        return;
      }

      // Success - Better Auth returns success when there's no error
      onActionSuccess(ADMIN_SUCCESS.USER_BANNED);
      setShowBanDialog(false);
      setBanReason("");
    } catch (err) {
      console.error("Ban user exception:", err);
      const errorMessage =
        err instanceof Error ? err.message : ADMIN_ERRORS.BAN_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnban = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.admin.unbanUser({
        userId: user.id,
      });

      if (result.error) {
        alert(result.error.message || ADMIN_ERRORS.UNBAN_FAILED);
      } else {
        onActionSuccess(ADMIN_SUCCESS.USER_UNBANNED);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ADMIN_ERRORS.UNBAN_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetRole = async () => {
    setIsLoading(true);
    try {
      const validRole =
        newRole === USER_ROLES.ADMIN || newRole === USER_ROLES.USER
          ? (newRole as "user" | "admin")
          : USER_ROLES.USER;

      const result = await authClient.admin.setRole({
        userId: user.id,
        role: validRole,
      });

      if (result.error) {
        alert(result.error.message || ADMIN_ERRORS.SET_ROLE_FAILED);
      } else {
        onActionSuccess(ADMIN_SUCCESS.ROLE_SET);
        setShowRoleDialog(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ADMIN_ERRORS.SET_ROLE_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.admin.removeUser({
        userId: user.id,
      });

      if (result.error) {
        alert(result.error.message || ADMIN_ERRORS.DELETE_FAILED);
      } else {
        onDelete();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ADMIN_ERRORS.DELETE_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            {ADMIN_LABELS.EDIT_USER}
          </DropdownMenuItem>

          {user.banned ? (
            <DropdownMenuItem onClick={handleUnban} disabled={isLoading}>
              <UserCheck className="w-4 h-4 mr-2" />
              {ADMIN_LABELS.UNBAN_USER}
            </DropdownMenuItem>
          ) : user.role !== USER_ROLES.ADMIN ? (
            <DropdownMenuItem onClick={() => setShowBanDialog(true)}>
              <Ban className="w-4 h-4 mr-2" />
              {ADMIN_LABELS.BAN_USER}
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuItem
            onClick={() => {
              setShowRoleDialog(true);
              loadRoles();
            }}
          >
            <Shield className="w-4 h-4 mr-2" />
            {ADMIN_LABELS.SET_ROLE}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {ADMIN_LABELS.DELETE_USER}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ADMIN_LABELS.BAN_USER}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="banReason">
                {ADMIN_LABELS.BAN_REASON} (optional)
              </Label>
              <Input
                id="banReason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder={ADMIN_LABELS.BAN_REASON}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBanDialog(false);
                setBanReason("");
              }}
              disabled={isLoading}
            >
              {ADMIN_LABELS.CANCEL}
            </Button>
            <Button
              onClick={handleBan}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Banning...
                </>
              ) : (
                ADMIN_LABELS.BAN_USER
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRoleDialog}
        onOpenChange={(open) => {
          setShowRoleDialog(open);
          if (!open) {
            setNewRole(user.role || USER_ROLES.USER);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ADMIN_LABELS.SET_ROLE}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">{ADMIN_LABELS.ROLE}</Label>
              {isLoadingRoles ? (
                <Skeleton className="h-10 w-full mt-2" />
              ) : (
                <Select
                  value={newRole}
                  onValueChange={setNewRole}
                  disabled={isLoadingRoles}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((roleInfo) => (
                      <SelectItem key={roleInfo.name} value={roleInfo.name}>
                        {ROLE_DISPLAY_NAMES[
                          roleInfo.name as keyof typeof ROLE_DISPLAY_NAMES
                        ] || roleInfo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRoleDialog(false);
                setNewRole(user.role || USER_ROLES.USER);
              }}
              disabled={isLoading}
            >
              {ADMIN_LABELS.CANCEL}
            </Button>
            <Button onClick={handleSetRole} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                ADMIN_LABELS.SAVE
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {ADMIN_LABELS.CONFIRM_DELETE}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {ADMIN_LABELS.CANCEL}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                ADMIN_LABELS.DELETE_USER
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
