"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { AUTH_LABELS, PROFILE } from "@/lib/constants";
import { User, Mail, LogOut, CheckCircle2 } from "lucide-react";
import { ApiData } from "./api-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function UserProfile() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          setUser(session.data.user);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      window.location.reload();
    } catch (err) {
      console.error("Failed to logout:", err);
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
    <div className="w-full max-w-2xl mx-auto">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <Avatar className="w-20 h-20 mx-auto mb-4">
          <AvatarFallback className="text-3xl font-bold">
            {getInitials(user.name, user.email)}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {PROFILE.WELCOME_BACK}
        </h1>
        {user.name && (
          <p className="text-xl text-muted-foreground font-medium">
            {user.name}
          </p>
        )}
      </div>

      {/* Account Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{PROFILE.ACCOUNT_INFO}</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Email Field */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border">
              <div className="p-2 rounded-lg bg-muted">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  {PROFILE.EMAIL_LABEL}
                </label>
                <p className="text-base font-medium">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Name Field */}
            {user.name && (
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border">
                <div className="p-2 rounded-lg bg-muted">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    {PROFILE.NAME_LABEL}
                  </label>
                  <p className="text-base font-medium">
                    {user.name}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Data Component */}
      <div className="mb-6">
        <ApiData />
      </div>

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        variant="default"
        className="w-full"
      >
        <LogOut className="w-5 h-5 mr-2" />
        {AUTH_LABELS.LOGOUT}
      </Button>
    </div>
  );
}

