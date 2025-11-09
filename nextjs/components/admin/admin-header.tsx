"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { ADMIN_NAVIGATION, AUTH_LABELS } from "@/lib/constants";
import { OrganizationSwitcher } from "@/components/organization/organization-switcher";
import { authClient } from "@/lib/auth-client";

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

export function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Failed to logout:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          aria-label={ADMIN_NAVIGATION.MENU_TOGGLE}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1 lg:ml-0" />
        <div className="flex items-center gap-3">
          <OrganizationSwitcher />
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline">{AUTH_LABELS.LOGOUT}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
