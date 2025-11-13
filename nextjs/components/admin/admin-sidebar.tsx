"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Key,
  Stethoscope,
  CheckSquare2,
  Clock,
} from "lucide-react";
import { ADMIN_NAVIGATION } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const navigationItems = [
    {
      href: "/admin/dashboard",
      label: ADMIN_NAVIGATION.DASHBOARD,
      icon: LayoutDashboard,
    },
    {
      href: "/admin/users",
      label: ADMIN_NAVIGATION.USER_MANAGEMENT,
      icon: Users,
    },
    {
      href: "/admin/organizations",
      label: ADMIN_NAVIGATION.ORGANIZATIONS,
      icon: Building2,
    },
    {
      href: "/admin/api-keys",
      label: ADMIN_NAVIGATION.API_KEYS,
      icon: Key,
    },
    {
      href: "/admin/tasks",
      label: ADMIN_NAVIGATION.TASKS,
      icon: CheckSquare2,
    },
    {
      href: "/admin/jobs",
      label: ADMIN_NAVIGATION.JOBS,
      icon: Clock,
    },
    {
      href: "/admin/doctor",
      label: ADMIN_NAVIGATION.DOCTOR,
      icon: Stethoscope,
    },
  ];

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const isActive = (href: string) => {
    if (href === "/admin/organizations") {
      return pathname?.startsWith("/admin/organizations");
    }
    if (href === "/admin/api-keys") {
      return pathname?.startsWith("/admin/api-keys");
    }
    if (href === "/admin/doctor") {
      return pathname?.startsWith("/admin/doctor");
    }
    if (href === "/admin/tasks") {
      return pathname?.startsWith("/admin/tasks");
    }
    if (href === "/admin/jobs") {
      return pathname?.startsWith("/admin/jobs");
    }
    if (href === "/admin/users") {
      return pathname === "/admin/users";
    }
    return pathname === href;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:fixed lg:top-0 lg:left-0 lg:h-full lg:w-64 lg:border-r lg:bg-background lg:z-40">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Admin Panel</h2>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Admin Panel</SheetTitle>
          </SheetHeader>
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
