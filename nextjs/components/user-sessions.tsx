"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/lib/hooks/use-toast";
import { PROFILE, SESSION_ERRORS, SESSION_SUCCESS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Trash2, Trash, Monitor } from "lucide-react";
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

interface Session {
  id: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
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

export function UserSessions() {
  const toast = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [currentSessionToken, setCurrentSessionToken] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      // Get current session token
      const sessionResult = await authClient.getSession();
      const currentToken = sessionResult?.data?.session?.token || null;
      setCurrentSessionToken(currentToken);

      // Fetch all sessions
      const response = await fetch("/api/sessions");
      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || SESSION_ERRORS.LOAD_SESSIONS_FAILED);
        return;
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : SESSION_ERRORS.LOAD_SESSIONS_FAILED;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionToken: string) => {
    setIsRevoking(sessionToken);
    try {
      const response = await fetch("/api/sessions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || SESSION_ERRORS.REVOKE_SESSION_FAILED);
      } else {
        toast.success(SESSION_SUCCESS.SESSION_REVOKED);
        loadSessions();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : SESSION_ERRORS.REVOKE_SESSION_FAILED;
      toast.error(errorMessage);
    } finally {
      setIsRevoking(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    setIsRevokingAll(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ revokeAll: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || SESSION_ERRORS.REVOKE_SESSION_FAILED);
      } else {
        toast.success(SESSION_SUCCESS.SESSIONS_REVOKED);
        loadSessions();
        setShowRevokeAllDialog(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : SESSION_ERRORS.REVOKE_SESSION_FAILED;
      toast.error(errorMessage);
    } finally {
      setIsRevokingAll(false);
    }
  };

  const isExpired = (expiresAt: number) => {
    return expiresAt < Date.now();
  };

  const isCurrentSession = (token: string) => {
    return token === currentSessionToken;
  };

  const activeSessions = sessions.filter((s) => s.isActive && !isExpired(s.expiresAt));

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              <CardTitle>{PROFILE.MANAGE_SESSIONS}</CardTitle>
            </div>
            {activeSessions.length > 1 && (
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
                    {PROFILE.REVOKE_ALL_SESSIONS}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">{PROFILE.NO_SESSIONS}</div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {activeSessions.length} {PROFILE.ACTIVE_SESSIONS}
              </p>

              <div className="overflow-x-auto">
                <Table className="w-full min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{PROFILE.SESSION_IP}</TableHead>
                      <TableHead>{PROFILE.SESSION_USER_AGENT}</TableHead>
                      <TableHead>{PROFILE.SESSION_CREATED_AT}</TableHead>
                      <TableHead>{PROFILE.SESSION_EXPIRES_AT}</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => {
                      const expired = isExpired(session.expiresAt);
                      const isCurrent = isCurrentSession(session.token);
                      const canRevoke = !isCurrent;

                      return (
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
                              {expired && <Badge variant="secondary">{PROFILE.EXPIRED}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isCurrent ? (
                              <Badge variant="default">{PROFILE.CURRENT_SESSION}</Badge>
                            ) : expired ? (
                              <Badge variant="secondary">{PROFILE.EXPIRED}</Badge>
                            ) : (
                              <Badge variant="outline">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {canRevoke ? (
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
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{PROFILE.CONFIRM_REVOKE_ALL_SESSIONS}</AlertDialogTitle>
            <AlertDialogDescription>{PROFILE.CONFIRM_REVOKE_ALL_SESSIONS}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevokingAll}>Cancel</AlertDialogCancel>
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
                PROFILE.REVOKE_ALL_SESSIONS
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
