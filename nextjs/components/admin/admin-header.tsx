"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { ADMIN_NAVIGATION, AUTH_LABELS } from "@/lib/constants";
import { OrganizationSwitcher } from "@/components/organization/organization-switcher";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden"
          aria-label={ADMIN_NAVIGATION.MENU_TOGGLE}
        >
          <Menu className="w-6 h-6" />
        </Button>
        <div className="flex-1 lg:ml-0" />
        <div className="flex items-center gap-3">
          <OrganizationSwitcher />
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="default"
            size="sm"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            <span className="hidden lg:inline">{AUTH_LABELS.LOGOUT}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
