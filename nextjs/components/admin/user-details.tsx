"use client";

import {
  Ban,
  Calendar,
  CheckCircle2,
  Key,
  Mail,
  Shield,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ADMIN_LABELS, ADMIN_USER_DETAILS, ROLE_DISPLAY_NAMES } from "@/lib/constants";
import { UserPasswordDialog } from "./user-password-dialog";
import { UserSessionsDialog } from "./user-sessions-dialog";

type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: number;
  createdAt: number;
  emailVerified?: boolean;
};

interface UserDetailsProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UserDetails({ user, open, onOpenChange }: UserDetailsProps) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSessionCount = useCallback(async () => {
    if (!user) return;
    try {
      // TODO: Create API route for fetching user sessions if needed
      // For now, this is just for logging and not critical
      console.log("Session count loading not implemented in client component");
    } catch (err) {
      console.error("Failed to load session count:", err);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      void loadSessionCount();
    }
  }, [open, user, loadSessionCount]);

  if (!user) return null;

  const isBanExpired = user.banExpires && user.banExpires < currentTime;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ADMIN_USER_DETAILS.USER_DETAILS}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <UserIcon className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{ADMIN_USER_DETAILS.FULL_NAME}</p>
                <p className="text-lg font-semibold">{user.name}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{ADMIN_USER_DETAILS.EMAIL_ADDRESS}</p>
                <p className="text-lg font-semibold">{user.email}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{ADMIN_USER_DETAILS.ROLE}</p>
                <Badge variant="secondary" className="mt-1">
                  {ROLE_DISPLAY_NAMES[user.role as keyof typeof ROLE_DISPLAY_NAMES] ||
                    user.role ||
                    ADMIN_LABELS.ROLE}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                {user.banned ? (
                  <Ban className="w-5 h-5 text-destructive" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{ADMIN_USER_DETAILS.STATUS}</p>
                <Badge variant={user.banned ? "destructive" : "default"} className="mt-1">
                  {user.banned ? ADMIN_LABELS.BANNED : ADMIN_LABELS.ACTIVE}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{ADMIN_USER_DETAILS.CREATED_DATE}</p>
                <p className="text-lg font-semibold">{formatDate(user.createdAt)}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                {user.emailVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {ADMIN_USER_DETAILS.EMAIL_VERIFICATION}
                </p>
                <Badge variant={user.emailVerified ? "default" : "secondary"} className="mt-1">
                  {user.emailVerified
                    ? ADMIN_USER_DETAILS.VERIFIED
                    : ADMIN_USER_DETAILS.NOT_VERIFIED}
                </Badge>
              </div>
            </div>

            {user.banned && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Ban className="w-5 h-5 text-destructive" />
                    <p className="text-sm font-medium">{ADMIN_USER_DETAILS.BAN_INFORMATION}</p>
                  </div>

                  <div className="pl-8 space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {ADMIN_USER_DETAILS.BAN_REASON}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {user.banReason || ADMIN_USER_DETAILS.NO_BAN_REASON}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        {ADMIN_USER_DETAILS.BAN_EXPIRATION}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {user.banExpires
                          ? isBanExpired
                            ? `${ADMIN_USER_DETAILS.EXPIRED} - ${formatDate(user.banExpires)}`
                            : formatDate(user.banExpires)
                          : ADMIN_USER_DETAILS.NO_EXPIRATION}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{ADMIN_USER_DETAILS.USER_ID}</p>
              <p className="text-sm font-mono bg-muted p-2 rounded">{user.id}</p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
              <Key className="w-4 h-4 mr-2" />
              {ADMIN_LABELS.RESET_PASSWORD}
            </Button>
            <Button onClick={() => onOpenChange(false)}>{ADMIN_USER_DETAILS.CLOSE}</Button>
          </div>
        </div>
      </DialogContent>

      <UserPasswordDialog
        userId={user.id}
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onSuccess={() => {
          setShowPasswordDialog(false);
        }}
      />

      <UserSessionsDialog
        userId={user.id}
        open={showSessionsDialog}
        onOpenChange={setShowSessionsDialog}
        onSuccess={() => {
          loadSessionCount();
        }}
      />
    </Dialog>
  );
}
