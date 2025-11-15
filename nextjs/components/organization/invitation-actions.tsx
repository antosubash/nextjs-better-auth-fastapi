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
import { authClient } from "@/lib/auth-client";
import { INVITATION_ERRORS, INVITATION_LABELS, INVITATION_SUCCESS } from "@/lib/constants";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.organization.cancelInvitation({
        invitationId: invitation.id,
      });

      if (result.error) {
        setError(result.error.message || INVITATION_ERRORS.CANCEL_FAILED);
      } else {
        onActionSuccess(INVITATION_SUCCESS.INVITATION_CANCELLED);
        onInvitationRemoved();
        setShowCancelDialog(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : INVITATION_ERRORS.CANCEL_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      // @ts-expect-error - better-auth organization client API method
      const result = await authClient.organization.createInvitation({
        organizationId,
        email: invitation.email,
        role: invitation.role,
      });

      if (result.error) {
        setError(result.error.message || INVITATION_ERRORS.RESEND_FAILED);
      } else {
        onActionSuccess(INVITATION_SUCCESS.INVITATION_RESENT);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : INVITATION_ERRORS.RESEND_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
