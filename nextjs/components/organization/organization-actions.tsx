"use client";

import { CheckCircle2, Edit, Loader2, MoreVertical, Trash2 } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorToast } from "@/components/ui/error-toast";
import { ORGANIZATION_ERRORS, ORGANIZATION_LABELS, ORGANIZATION_SUCCESS } from "@/lib/constants";
import { useDeleteOrganization, useSetActiveOrganization } from "@/lib/hooks/api/use-auth";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationActionsProps {
  organization: Organization;
  onEdit: () => void;
  onDelete: () => void;
  onActionSuccess: (message: string) => void;
  isActive?: boolean;
}

export function OrganizationActions({
  organization,
  onEdit,
  onDelete,
  onActionSuccess,
  isActive,
}: OrganizationActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const setActiveMutation = useSetActiveOrganization();
  const deleteMutation = useDeleteOrganization();

  const isLoading = setActiveMutation.isPending || deleteMutation.isPending;

  const handleSetActive = async () => {
    try {
      await setActiveMutation.mutateAsync(organization.id);
      onActionSuccess(ORGANIZATION_SUCCESS.ORGANIZATION_ACTIVATED);
      setIsOpen(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ORGANIZATION_ERRORS.SET_ACTIVE_FAILED;
      setError(errorMessage);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(organization.id);
      onDelete();
      setShowDeleteDialog(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ORGANIZATION_ERRORS.DELETE_FAILED;
      setError(errorMessage);
    }
  };

  return (
    <>
      {error && <ErrorToast message={error} onDismiss={() => setError(null)} duration={5000} />}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreVertical className="w-5 h-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isActive && (
            <DropdownMenuItem
              onClick={() => {
                setIsOpen(false);
                handleSetActive();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {ORGANIZATION_LABELS.SET_ACTIVE}
            </DropdownMenuItem>
          )}
          {!isActive && <DropdownMenuSeparator />}
          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false);
              onEdit();
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            {ORGANIZATION_LABELS.EDIT_ORGANIZATION}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false);
              setShowDeleteDialog(true);
            }}
            disabled={isLoading}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {ORGANIZATION_LABELS.DELETE_ORGANIZATION}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ORGANIZATION_LABELS.DELETE_ORGANIZATION}</AlertDialogTitle>
            <AlertDialogDescription>{ORGANIZATION_LABELS.CONFIRM_DELETE}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{ORGANIZATION_LABELS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {ORGANIZATION_LABELS.DELETING}
                </>
              ) : (
                ORGANIZATION_LABELS.DELETE_ORGANIZATION
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
