"use client";

import { Edit, Eye, Loader2, MoreVertical, Power, PowerOff, Trash2 } from "lucide-react";
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
import { API_KEY_LABELS, API_KEY_SUCCESS } from "@/lib/constants";
import { useDeleteApiKey, useUpdateApiKey } from "@/lib/hooks/api/use-api-keys";

interface ApiKey {
  id: string;
  name?: string | null;
  enabled?: boolean;
}

interface ApiKeyActionsProps {
  apiKey: ApiKey;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  onActionSuccess: (message: string) => void;
}

export function ApiKeyActions({
  apiKey,
  onEdit,
  onDelete,
  onViewDetails,
  onActionSuccess,
}: ApiKeyActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateMutation = useUpdateApiKey();
  const deleteMutation = useDeleteApiKey();
  const isLoading = updateMutation.isPending || deleteMutation.isPending;

  const handleToggleEnabled = async () => {
    try {
      await updateMutation.mutateAsync({
        id: apiKey.id,
        data: { enabled: !apiKey.enabled },
      });
      setIsOpen(false);
      onActionSuccess(
        !apiKey.enabled
          ? API_KEY_SUCCESS.API_KEY_ENABLED
          : API_KEY_SUCCESS.API_KEY_DISABLED
      );
    } catch (err) {
      // Error is handled by the mutation hook
      console.error("Failed to toggle enabled:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(apiKey.id);
      onDelete();
      setShowDeleteDialog(false);
    } catch (err) {
      // Error is handled by the mutation hook
      console.error("Failed to delete:", err);
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreVertical className="w-5 h-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false);
              onViewDetails();
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            {API_KEY_LABELS.VIEW_DETAILS}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false);
              onEdit();
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            {API_KEY_LABELS.EDIT_API_KEY}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false);
              handleToggleEnabled();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : apiKey.enabled ? (
              <PowerOff className="w-4 h-4 mr-2" />
            ) : (
              <Power className="w-4 h-4 mr-2" />
            )}
            {apiKey.enabled ? API_KEY_LABELS.DISABLED : API_KEY_LABELS.ENABLED}
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
            {API_KEY_LABELS.DELETE_API_KEY}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{API_KEY_LABELS.DELETE_API_KEY}</AlertDialogTitle>
            <AlertDialogDescription>{API_KEY_LABELS.CONFIRM_DELETE}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{API_KEY_LABELS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {API_KEY_LABELS.DELETING}
                </>
              ) : (
                API_KEY_LABELS.DELETE_API_KEY
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
