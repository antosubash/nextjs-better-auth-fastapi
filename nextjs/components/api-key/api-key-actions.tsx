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
import { API_KEY_ERRORS, API_KEY_LABELS, API_KEY_SUCCESS } from "@/lib/constants";

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
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleToggleEnabled = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/api-keys/${apiKey.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: !apiKey.enabled,
        }),
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        // Error handling should be done via toast/error state
        console.error(result.error || API_KEY_ERRORS.UPDATE_FAILED);
      } else {
        onActionSuccess(
          apiKey.enabled ? API_KEY_SUCCESS.API_KEY_DISABLED : API_KEY_SUCCESS.API_KEY_ENABLED
        );
        setIsOpen(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : API_KEY_ERRORS.UPDATE_FAILED;
      console.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/api-keys/${apiKey.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        // Error handling should be done via toast/error state
        console.error(result.error || API_KEY_ERRORS.DELETE_FAILED);
      } else {
        onDelete();
        setShowDeleteDialog(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : API_KEY_ERRORS.DELETE_FAILED;
      console.error(errorMessage);
    } finally {
      setIsLoading(false);
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
