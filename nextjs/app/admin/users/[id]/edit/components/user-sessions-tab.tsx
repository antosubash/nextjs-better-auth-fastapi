"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { ADMIN_LABELS } from "@/lib/constants";
import { Loader2, Trash, Trash2 } from "lucide-react";
import { Session } from "../hooks/use-user-sessions";
import { formatDate, isExpired } from "../utils/session-utils";

interface UserSessionsTabProps {
  sessions: Session[];
  isLoadingSessions: boolean;
  isRevoking: string | null;
  isRevokingAll: boolean;
  onRevokeSession: (sessionToken: string) => Promise<void>;
  onRevokeAllSessions: () => void;
  showRevokeAllDialog: boolean;
  onShowRevokeAllDialog: (show: boolean) => void;
}

export function UserSessionsTab({
  sessions,
  isLoadingSessions,
  isRevoking,
  isRevokingAll,
  onRevokeSession,
  onRevokeAllSessions,
  showRevokeAllDialog,
  onShowRevokeAllDialog,
}: UserSessionsTabProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{ADMIN_LABELS.MANAGE_SESSIONS}</h3>
          <p className="text-sm text-muted-foreground">
            View and manage active sessions for this user.
          </p>
        </div>
        {sessions.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onShowRevokeAllDialog(true)}
            disabled={isRevokingAll}
          >
            {isRevokingAll ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revoking...
              </>
            ) : (
              <>
                <Trash className="mr-2 h-4 w-4" />
                {ADMIN_LABELS.REVOKE_ALL_SESSIONS}
              </>
            )}
          </Button>
        )}
      </div>

      {isLoadingSessions ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">{ADMIN_LABELS.NO_SESSIONS}</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ADMIN_LABELS.SESSION_IP}</TableHead>
                <TableHead>{ADMIN_LABELS.SESSION_USER_AGENT}</TableHead>
                <TableHead>{ADMIN_LABELS.SESSION_CREATED_AT}</TableHead>
                <TableHead>{ADMIN_LABELS.SESSION_EXPIRES_AT}</TableHead>
                <TableHead>{ADMIN_LABELS.ACTIONS}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id || session.token}>
                  <TableCell>{session.ipAddress || "N/A"}</TableCell>
                  <TableCell
                    className="max-w-lg truncate"
                    title={session.userAgent || "N/A"}
                  >
                    {session.userAgent || "N/A"}
                  </TableCell>
                  <TableCell>{formatDate(session.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {formatDate(session.expiresAt)}
                      {isExpired(session.expiresAt) && (
                        <Badge variant="secondary">Expired</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRevokeSession(session.token)}
                      disabled={isRevoking === session.token}
                    >
                      {isRevoking === session.token ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={showRevokeAllDialog} onOpenChange={onShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ADMIN_LABELS.CONFIRM_REVOKE_ALL_SESSIONS}</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke all active sessions for this user. They will need to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevokingAll}>{ADMIN_LABELS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onRevokeAllSessions}
              disabled={isRevokingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRevokingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                ADMIN_LABELS.REVOKE_ALL_SESSIONS
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

