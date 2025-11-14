"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ADMIN_LABELS } from "@/lib/constants";
import { User, Ban, UserCheck, Key, Monitor } from "lucide-react";
import { UserForm } from "@/components/admin/user-form";
import { UserBanTab } from "./user-ban-tab";
import { UserPasswordTab } from "./user-password-tab";
import { UserSessionsTab } from "./user-sessions-tab";
import { canBanRole } from "@/lib/utils/role-validation";
import { useUserSessions } from "../hooks/use-user-sessions";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean;
  createdAt?: number;
  emailVerified?: boolean;
}

interface UserEditTabsProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSuccess: () => void;
  onCancel: () => void;
  isActionLoading: boolean;
  onBan: (banReason: string) => Promise<boolean>;
  onUnban: () => Promise<boolean>;
  onPasswordReset: (newPassword: string) => Promise<boolean>;
}

export function UserEditTabs({
  user,
  activeTab,
  onTabChange,
  onSuccess,
  onCancel,
  isActionLoading,
  onBan,
  onUnban,
  onPasswordReset,
}: UserEditTabsProps) {
  const {
    sessions,
    isLoadingSessions,
    isRevoking,
    isRevokingAll,
    sessionsLoadedRef,
    loadSessions,
    handleRevokeSession,
    handleRevokeAllSessions,
  } = useUserSessions(user.id);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);

  useEffect(() => {
    if (
      activeTab === "sessions" &&
      user.id &&
      !isLoadingSessions &&
      sessionsLoadedRef.current !== user.id
    ) {
      loadSessions();
    }
  }, [activeTab, user.id, isLoadingSessions, sessionsLoadedRef, loadSessions]);

  const handleRevokeAll = async () => {
    await handleRevokeAllSessions();
    setShowRevokeAllDialog(false);
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <div className="border-b px-6 pb-3">
            <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-muted p-1.5 text-muted-foreground">
              <TabsTrigger value="edit" className="gap-2 px-4 py-2 text-sm">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{ADMIN_LABELS.EDIT_USER}</span>
                <span className="sm:hidden">Edit</span>
              </TabsTrigger>
              {user.banned ? (
                <TabsTrigger value="unban" className="gap-2 px-4 py-2 text-sm">
                  <UserCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">{ADMIN_LABELS.UNBAN_USER}</span>
                  <span className="sm:hidden">Unban</span>
                </TabsTrigger>
              ) : canBanRole(user.role) ? (
                <TabsTrigger value="ban" className="gap-2 px-4 py-2 text-sm">
                  <Ban className="h-4 w-4" />
                  <span className="hidden sm:inline">{ADMIN_LABELS.BAN_USER}</span>
                  <span className="sm:hidden">Ban</span>
                </TabsTrigger>
              ) : null}
              <TabsTrigger value="password" className="gap-2 px-4 py-2 text-sm">
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline">{ADMIN_LABELS.RESET_PASSWORD}</span>
                <span className="sm:hidden">Password</span>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="gap-2 px-4 py-2 text-sm">
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">{ADMIN_LABELS.MANAGE_SESSIONS}</span>
                <span className="sm:hidden">Sessions</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="edit" className="p-6 space-y-6">
            <UserForm user={user} onSuccess={onSuccess} onCancel={onCancel} />
          </TabsContent>

          {user.banned ? (
            <TabsContent value="unban">
              <UserBanTab
                isBanned={true}
                isActionLoading={isActionLoading}
                onBan={onBan}
                onUnban={onUnban}
              />
            </TabsContent>
          ) : canBanRole(user.role) ? (
            <TabsContent value="ban">
              <UserBanTab
                isBanned={false}
                isActionLoading={isActionLoading}
                onBan={onBan}
                onUnban={onUnban}
              />
            </TabsContent>
          ) : null}

          <TabsContent value="password">
            <UserPasswordTab
              isActionLoading={isActionLoading}
              onPasswordReset={onPasswordReset}
            />
          </TabsContent>

          <TabsContent value="sessions">
            <UserSessionsTab
              sessions={sessions}
              isLoadingSessions={isLoadingSessions}
              isRevoking={isRevoking}
              isRevokingAll={isRevokingAll}
              onRevokeSession={handleRevokeSession}
              onRevokeAllSessions={handleRevokeAll}
              showRevokeAllDialog={showRevokeAllDialog}
              onShowRevokeAllDialog={setShowRevokeAllDialog}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

