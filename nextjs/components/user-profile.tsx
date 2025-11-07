"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { AUTH_LABELS, PROFILE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { User, Mail, LogOut, CheckCircle2 } from "lucide-react";

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
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
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
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 mb-4 text-3xl font-bold text-white dark:text-gray-900">
          {getInitials(user.name, user.email)}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {PROFILE.WELCOME_BACK}
        </h1>
        {user.name && (
          <p className="text-xl text-gray-700 dark:text-gray-300 font-medium">
            {user.name}
          </p>
        )}
      </div>

      {/* Account Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {PROFILE.ACCOUNT_INFO}
          </h2>
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>

        <div className="space-y-4">
          {/* Email Field */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
            <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
              <Mail className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                {PROFILE.EMAIL_LABEL}
              </label>
              <p className="text-base text-gray-900 dark:text-white font-medium">
                {user.email}
              </p>
            </div>
          </div>

          {/* Name Field */}
          {user.name && (
            <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  {PROFILE.NAME_LABEL}
                </label>
                <p className="text-base text-gray-900 dark:text-white font-medium">
                  {user.name}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 font-medium"
        )}
      >
        <LogOut className="w-5 h-5" />
        {AUTH_LABELS.LOGOUT}
      </button>
    </div>
  );
}

