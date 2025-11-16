"use client";

import { Loader2, MoreVertical, RotateCcw, X } from "lucide-react";
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
import { INVITATION_ERRORS, INVITATION_LABELS, INVITATION_SUCCESS } from "@/lib/constants";
import { useCancelInvitation, useCreateInvitation } from "@/lib/hooks/api/use-auth";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: number;
  expiresAt?: number;
}

interface InvitationActionsProps {
  invitation: Invitation;
  organizationId: string;
  onActionSuccess: (message: string) => void;
  onInvitationRemoved: () => void;
}

export function InvitationActions({
  invitation,
  organizationId,
  onActionSuccess,
  onInvitationRemoved,
}: InvitationActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const cancelInvitationMutation = useCancelInvitation();
  const createInvitationMutation = useCreateInvitation();

  const isLoading = cancelInvitationMutation.isPending || createInvitationMutation.isPending;

  const handleCancel = async () => {
    try {
      await cancelInvitationMutation.mutateAsync({
        invitationId: invitation.id,
        organizationId,
      });
      onActionSuccess(INVITATION_SUCCESS.INVITATION_CANCELLED);
      onInvitationRemoved();
      setShowCancelDialog(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : INVITATION_ERRORS.CANCEL_FAILED;
      setError(errorMessage);
    }
  };

  const handleResend = async () => {
    try {
      await createInvitationMutation.mutateAsync({
        organizationId,
        email: invitation.email,
        role: invitation.role,
      });
      onActionSuccess(INVITATION_SUCCESS.INVITATION_RESENT);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : INVITATION_ERRORS.RESEND_FAILED;
      setError(errorMessage);
    }
  };

  const isPending = invitation.status === "pending";

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
          {isPending && (
            <DropdownMenuItem onClick={handleResend} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              {INVITATION_LABELS.RESEND_INVITATION}
            </DropdownMenuItem>
          )}

          {isPending && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowCancelDialog(true)}
                disabled={isLoading}
                className="text-destructive focus:text-destructive"
              >
                <X className="w-4 h-4 mr-2" />
                {INVITATION_LABELS.CANCEL_INVITATION}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{INVITATION_LABELS.CANCEL_INVITATION}</AlertDialogTitle>
            <AlertDialogDescription>{INVITATION_LABELS.CONFIRM_CANCEL}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{INVITATION_LABELS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                INVITATION_LABELS.CANCEL_INVITATION
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
