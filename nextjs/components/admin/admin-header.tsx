"use client";

import { Menu } from "lucide-react";
import { ADMIN_NAVIGATION } from "@/lib/constants";
import { OrganizationSwitcher } from "@/components/organization/organization-switcher";

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

export function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
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
        </div>
      </div>
    </header>
  );
}
