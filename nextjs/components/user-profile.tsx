"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AUTH_LABELS, PROFILE } from "@/lib/constants";
import { useSession, useSignOut } from "@/lib/hooks/api/use-auth";
import { ChangePasswordForm } from "./profile/change-password-form";
import { EmailVerificationSection } from "./profile/email-verification-section";
import { ProfileEditForm } from "./profile/profile-edit-form";
import { UserSessions } from "./user-sessions";

export function UserProfile() {
  const router = useRouter();
  const { data: session, isLoading } = useSession();
  const signOutMutation = useSignOut();

  const user = session?.user || null;

  const handleLogout = async () => {
    try {
      await signOutMutation.mutateAsync();
      router.push("/");
      router.refresh();
    } catch {
      // Error is handled by the mutation hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <Avatar className="w-20 h-20 mx-auto mb-4">
          {user.image ? <AvatarImage src={user.image} alt={user.name || "User"} /> : null}
          <AvatarFallback className="text-3xl font-bold">
            {getInitials(user.name, user.email)}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{PROFILE.WELCOME_BACK}</h1>
        {user.name && <p className="text-xl text-muted-foreground font-medium">{user.name}</p>}
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account">{PROFILE.ACCOUNT_INFO}</TabsTrigger>
          <TabsTrigger value="security">{PROFILE.SECURITY}</TabsTrigger>
          <TabsTrigger value="sessions">{PROFILE.SESSIONS}</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <EmailVerificationSection email={user.email} isVerified={user.emailVerified || false} />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>{PROFILE.EDIT_PROFILE}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ProfileEditForm
                initialName={user.name || ""}
                initialEmail={user.email}
                initialImage={user.image}
                onSuccess={() => {
                  // Session will be invalidated by the mutation hook
                }}
              />
            </CardContent>
          </Card>

          <Button onClick={handleLogout} variant="default" className="w-full">
            <LogOut className="w-5 h-5 mr-2" />
            {AUTH_LABELS.LOGOUT}
          </Button>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm
                onSuccess={() => {
                  // Success is handled by the mutation hook
                }}
              />
            </CardContent>
          </Card>

          <UserSessions />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <UserSessions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
