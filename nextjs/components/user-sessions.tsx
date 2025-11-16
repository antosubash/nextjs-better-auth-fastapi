"use client";

import { Loader2, Monitor, Trash, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import type { Session } from "@/lib/api/sessions";
import { PROFILE } from "@/lib/constants";
import { useSession } from "@/lib/hooks/api/use-auth";
import { useRevokeAllSessions, useRevokeSession, useSessions } from "@/lib/hooks/api/use-sessions";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface SessionRowProps {
  session: Session;
  isExpired: boolean;
  isCurrent: boolean;
  revokingSessionToken: string | null;
  revokeSessionMutation: {
    isPending: boolean;
  };
  onRevokeSession: (token: string) => void;
}

function SessionRow({
  session,
  isExpired,
  isCurrent,
  revokingSessionToken,
  revokeSessionMutation,
  onRevokeSession,
}: SessionRowProps) {
  const canRevoke = !isCurrent;

  return (
    <TableRow key={session.id || session.token}>
      <TableCell>{session.ipAddress ?? "N/A"}</TableCell>
      <TableCell className="max-w-lg truncate" title={session.userAgent ?? "N/A"}>
        {session.userAgent ?? "N/A"}
      </TableCell>
      <TableCell>{formatDate(session.createdAt)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {formatDate(session.expiresAt)}
          {isExpired && <Badge variant="secondary">{PROFILE.EXPIRED}</Badge>}
        </div>
      </TableCell>
      <TableCell>
        {isCurrent ? (
          <Badge variant="default">{PROFILE.CURRENT_SESSION}</Badge>
        ) : isExpired ? (
          <Badge variant="secondary">{PROFILE.EXPIRED}</Badge>
        ) : (
          <Badge variant="outline">Active</Badge>
        )}
      </TableCell>
      <TableCell>
        {canRevoke ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRevokeSession(session.token)}
                disabled={revokingSessionToken === session.token || revokeSessionMutation.isPending}
              >
                {revokingSessionToken === session.token ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{PROFILE.REVOKE_SESSION}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
    </TableRow>
  );
}

export function UserSessions() {
  const { data: session } = useSession();
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [revokingSessionToken, setRevokingSessionToken] = useState<string | null>(null);

  const { data: sessionsData, isLoading } = useSessions();
  const revokeSessionMutation = useRevokeSession();
  const revokeAllSessionsMutation = useRevokeAllSessions();

  const sessions = sessionsData?.sessions || [];
  const currentSessionToken = session?.session?.token || null;

  const handleRevokeSession = async (sessionToken: string) => {
    setRevokingSessionToken(sessionToken);
    try {
      await revokeSessionMutation.mutateAsync(sessionToken);
    } finally {
      setRevokingSessionToken(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await revokeAllSessionsMutation.mutateAsync();
      setShowRevokeAllDialog(false);
    } catch {
      // Error handled by mutation
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
                disabled={revokeAllSessionsMutation.isPending}
              >
                {revokeAllSessionsMutation.isPending ? (
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

              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  <Table className="w-full">
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
                      {sessions.map((session) => (
                        <SessionRow
                          key={session.id || session.token}
                          session={session}
                          isExpired={isExpired(session.expiresAt)}
                          isCurrent={isCurrentSession(session.token)}
                          revokingSessionToken={revokingSessionToken}
                          revokeSessionMutation={revokeSessionMutation}
                          onRevokeSession={handleRevokeSession}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
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
            <AlertDialogCancel disabled={revokeAllSessionsMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAllSessions}
              disabled={revokeAllSessionsMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeAllSessionsMutation.isPending ? (
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
