"use client";

import { Loader2, Trash, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { ADMIN_ERRORS, ADMIN_LABELS, ADMIN_SUCCESS } from "@/lib/constants";
import { useToast } from "@/lib/hooks/use-toast";

interface Session {
  id: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
  expiresAt: number;
}

interface UserSessionsDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UserSessionsDialog({
  userId,
  open,
  onOpenChange,
  onSuccess,
}: UserSessionsDialogProps) {
  const toast = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await authClient.admin.listUserSessions({ userId });
      if (result.error) {
        toast.error(result.error.message || ADMIN_ERRORS.LOAD_SESSIONS_FAILED);
      } else {
        // Transform the sessions data to match our interface
        const sessionsData = ((result.data as { sessions?: unknown[] })?.sessions || []).map(
          (session: unknown) => {
            const s = session as {
              createdAt?: Date | number;
              expiresAt?: Date | number;
              [key: string]: unknown;
            };
            return {
              ...s,
              createdAt:
                s.createdAt instanceof Date ? s.createdAt.getTime() : (s.createdAt as number) || 0,
              expiresAt:
                s.expiresAt instanceof Date ? s.expiresAt.getTime() : (s.expiresAt as number) || 0,
            } as Session;
          }
        );
        setSessions(sessionsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ADMIN_ERRORS.LOAD_SESSIONS_FAILED;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (open && userId) {
      void loadSessions();
    }
  }, [open, userId, loadSessions]);

  const handleRevokeSession = async (sessionToken: string) => {
    setIsRevoking(sessionToken);
    try {
      const result = await authClient.admin.revokeUserSession({
        sessionToken,
      });

      if (result.error) {
        toast.error(result.error.message || ADMIN_ERRORS.REVOKE_SESSION_FAILED);
      } else {
        toast.success(ADMIN_SUCCESS.SESSION_REVOKED);
        loadSessions();
        onSuccess?.();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ADMIN_ERRORS.REVOKE_SESSION_FAILED;
      toast.error(errorMessage);
    } finally {
      setIsRevoking(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    setIsRevokingAll(true);
    try {
      const result = await authClient.admin.revokeUserSessions({ userId });

      if (result.error) {
        toast.error(result.error.message || ADMIN_ERRORS.REVOKE_SESSIONS_FAILED);
      } else {
        toast.success(ADMIN_SUCCESS.SESSIONS_REVOKED);
        loadSessions();
        setShowRevokeAllDialog(false);
        onSuccess?.();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ADMIN_ERRORS.REVOKE_SESSIONS_FAILED;
      toast.error(errorMessage);
    } finally {
      setIsRevokingAll(false);
    }
  };

  const isExpired = (expiresAt: number) => {
    return expiresAt < Date.now();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{ADMIN_LABELS.MANAGE_SESSIONS}</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">{ADMIN_LABELS.NO_SESSIONS}</div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {sessions.length} {ADMIN_LABELS.ACTIVE_SESSIONS}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRevokeAllDialog(true)}
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
              </div>

              <div className="overflow-x-auto">
                <Table className="w-full min-w-[800px]">
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
                        <TableCell className="max-w-lg truncate" title={session.userAgent || "N/A"}>
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
                            onClick={() => handleRevokeSession(session.token)}
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
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>{ADMIN_LABELS.CANCEL}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
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
              onClick={handleRevokeAllSessions}
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
    </>
  );
}
