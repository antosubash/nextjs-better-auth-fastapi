"use client";

import { Edit2, Key, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PASSKEY_ERRORS, PASSKEY_LABELS, PASSKEY_PLACEHOLDERS } from "@/lib/constants";
import {
  useAddPasskey,
  useDeletePasskey,
  usePasskeys,
  useUpdatePasskey,
} from "@/lib/hooks/api/use-passkeys";

function formatDate(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface PasskeyRowProps {
  passkey: {
    id: string;
    name?: string | null;
    deviceType: string;
    backedUp: boolean;
    createdAt: Date | string | number;
  };
  deletingId: string | null;
  editingId: string | null;
  deleteMutation: { isPending: boolean };
  onDelete: (id: string) => void;
  onEdit: (id: string, currentName?: string | null) => void;
}

function PasskeyRow({
  passkey,
  deletingId,
  editingId,
  deleteMutation,
  onDelete,
  onEdit,
}: PasskeyRowProps) {
  return (
    <TableRow>
      <TableCell>{passkey.name || "Unnamed Passkey"}</TableCell>
      <TableCell>
        <Badge variant="outline">
          {passkey.deviceType === "platform"
            ? PASSKEY_LABELS.PLATFORM
            : PASSKEY_LABELS.CROSS_PLATFORM}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={passkey.backedUp ? "default" : "secondary"}>
          {passkey.backedUp ? PASSKEY_LABELS.BACKED_UP : PASSKEY_LABELS.NOT_BACKED_UP}
        </Badge>
      </TableCell>
      <TableCell>{formatDate(passkey.createdAt)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(passkey.id, passkey.name)}
                disabled={editingId === passkey.id || deleteMutation.isPending}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{PASSKEY_LABELS.UPDATE_PASSKEY}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(passkey.id)}
                disabled={deletingId === passkey.id || deleteMutation.isPending}
              >
                {deletingId === passkey.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{PASSKEY_LABELS.DELETE_PASSKEY}</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function PasskeyManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [addName, setAddName] = useState("");
  const [addAuthenticatorAttachment, setAddAuthenticatorAttachment] = useState<
    "platform" | "cross-platform" | undefined
  >(undefined);

  const { data: passkeys, isLoading } = usePasskeys();
  const addPasskeyMutation = useAddPasskey();
  const deletePasskeyMutation = useDeletePasskey();
  const updatePasskeyMutation = useUpdatePasskey();

  // Close dialog and reset state when passkey is successfully added
  useEffect(() => {
    if (addPasskeyMutation.isSuccess && showAddDialog) {
      setShowAddDialog(false);
      addPasskeyMutation.reset();
    }
  }, [addPasskeyMutation.isSuccess, showAddDialog, addPasskeyMutation]);

  // Reset form state when dialog closes
  useEffect(() => {
    if (!showAddDialog) {
      setAddName("");
      setAddAuthenticatorAttachment(undefined);
      if (addPasskeyMutation.isError) {
        addPasskeyMutation.reset();
      }
    }
  }, [showAddDialog, addPasskeyMutation]);

  const handleAddPasskey = async () => {
    try {
      await addPasskeyMutation.mutateAsync({
        name: addName || undefined,
        authenticatorAttachment: addAuthenticatorAttachment,
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeletePasskey = async () => {
    if (!deletingId) return;
    setDeletingId(deletingId);
    try {
      await deletePasskeyMutation.mutateAsync(deletingId);
      setShowDeleteDialog(false);
      setDeletingId(null);
    } catch {
      // Error handled by mutation
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditPasskey = async () => {
    if (!editingId || !editingName.trim()) return;
    try {
      await updatePasskeyMutation.mutateAsync({
        id: editingId,
        name: editingName.trim(),
      });
      setShowEditDialog(false);
      setEditingId(null);
      setEditingName("");
    } catch {
      // Error handled by mutation
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setShowDeleteDialog(true);
  };

  const openEditDialog = (id: string, currentName?: string | null) => {
    setEditingId(id);
    setEditingName(currentName || "");
    setShowEditDialog(true);
  };

  // Check if passkeys are supported
  const isPasskeySupported =
    typeof window !== "undefined" &&
    typeof PublicKeyCredential !== "undefined" &&
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== undefined;

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                <CardTitle>{PASSKEY_LABELS.TITLE}</CardTitle>
              </div>
              <CardDescription>{PASSKEY_LABELS.DESCRIPTION}</CardDescription>
            </div>
            {isPasskeySupported && (
              <Button
                onClick={() => setShowAddDialog(true)}
                disabled={addPasskeyMutation.isPending}
              >
                {addPasskeyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {PASSKEY_LABELS.ADDING}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {PASSKEY_LABELS.ADD_PASSKEY}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isPasskeySupported ? (
            <div className="py-8 text-center text-muted-foreground">
              {PASSKEY_ERRORS.NOT_SUPPORTED}
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !passkeys || passkeys.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {PASSKEY_LABELS.NO_PASSKEYS}
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{PASSKEY_LABELS.PASSKEY_NAME}</TableHead>
                    <TableHead>{PASSKEY_LABELS.DEVICE_TYPE}</TableHead>
                    <TableHead>Backup Status</TableHead>
                    <TableHead>{PASSKEY_LABELS.CREATED_AT}</TableHead>
                    <TableHead>{PASSKEY_LABELS.ACTIONS}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passkeys.map((passkey) => (
                    <PasskeyRow
                      key={passkey.id}
                      passkey={passkey}
                      deletingId={deletingId}
                      editingId={editingId}
                      deleteMutation={deletePasskeyMutation}
                      onDelete={openDeleteDialog}
                      onEdit={openEditDialog}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Passkey Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{PASSKEY_LABELS.ADD_PASSKEY}</DialogTitle>
            <DialogDescription>{PASSKEY_LABELS.DESCRIPTION}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">{PASSKEY_LABELS.PASSKEY_NAME}</Label>
              <Input
                id="add-name"
                placeholder={PASSKEY_PLACEHOLDERS.NAME}
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-authenticator">
                {PASSKEY_PLACEHOLDERS.AUTHENTICATOR_ATTACHMENT}
              </Label>
              <Select
                value={addAuthenticatorAttachment || "any"}
                onValueChange={(value) =>
                  setAddAuthenticatorAttachment(
                    value === "any" ? undefined : (value as "platform" | "cross-platform")
                  )
                }
              >
                <SelectTrigger id="add-authenticator">
                  <SelectValue placeholder={PASSKEY_PLACEHOLDERS.ANY_DEFAULT} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{PASSKEY_PLACEHOLDERS.ANY_DEFAULT}</SelectItem>
                  <SelectItem value="platform">{PASSKEY_LABELS.PLATFORM}</SelectItem>
                  <SelectItem value="cross-platform">{PASSKEY_LABELS.CROSS_PLATFORM}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {PASSKEY_LABELS.CANCEL}
            </Button>
            <Button onClick={handleAddPasskey} disabled={addPasskeyMutation.isPending}>
              {addPasskeyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {PASSKEY_LABELS.ADDING}
                </>
              ) : (
                PASSKEY_LABELS.ADD_PASSKEY
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Passkey Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{PASSKEY_LABELS.DELETE_PASSKEY}</AlertDialogTitle>
            <AlertDialogDescription>{PASSKEY_LABELS.CONFIRM_DELETE}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePasskeyMutation.isPending}>
              {PASSKEY_LABELS.CANCEL}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePasskey}
              disabled={deletePasskeyMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePasskeyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {PASSKEY_LABELS.DELETING}
                </>
              ) : (
                PASSKEY_LABELS.DELETE_PASSKEY
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Passkey Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{PASSKEY_LABELS.UPDATE_PASSKEY}</DialogTitle>
            <DialogDescription>{PASSKEY_LABELS.DESCRIPTION}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{PASSKEY_LABELS.PASSKEY_NAME}</Label>
              <Input
                id="edit-name"
                placeholder={PASSKEY_PLACEHOLDERS.NAME}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {PASSKEY_LABELS.CANCEL}
            </Button>
            <Button
              onClick={handleEditPasskey}
              disabled={updatePasskeyMutation.isPending || !editingName.trim()}
            >
              {updatePasskeyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {PASSKEY_LABELS.UPDATING}
                </>
              ) : (
                PASSKEY_LABELS.UPDATE_PASSKEY
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
