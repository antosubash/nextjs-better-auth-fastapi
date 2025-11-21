"use client";

import {
  Building2,
  CheckSquare2,
  Clock,
  Key,
  LayoutDashboard,
  MessageSquare,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/branding/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ADMIN_NAVIGATION, AUTH_LABELS, BRANDING, CHAT_LABELS } from "@/lib/constants";

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
    {
      href: "/admin/chat",
      label: CHAT_LABELS.TITLE,
      icon: MessageSquare,
    },
    {
      href: "/profile",
      label: AUTH_LABELS.PROFILE,
      icon: User,
    },
  ];

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  // Routes that use startsWith matching (have sub-routes)
  const prefixRoutes = new Set([
    "/admin/organizations",
    "/admin/api-keys",
    "/admin/doctor",
    "/admin/tasks",
    "/admin/jobs",
  ]);

  const isActive = (href: string) => {
    if (prefixRoutes.has(href)) {
      return pathname?.startsWith(href);
    }
    return pathname === href;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:fixed lg:top-0 lg:left-0 lg:h-full lg:w-64 lg:border-r lg:bg-background lg:z-40">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 p-4">
            <Logo size="sm" />
            <span className="text-sm font-medium text-muted-foreground">Admin</span>
          </div>
          <Separator />
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Button
                  key={item.href}
                  asChild
                  variant={active ? "default" : "ghost"}
                  className="w-full justify-start"
                >
                  <Link href={item.href}>
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <SheetTitle className="text-base">{BRANDING.appName} Admin</SheetTitle>
            </div>
          </SheetHeader>
          <Separator />
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Button
                  key={item.href}
                  asChild
                  variant={active ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={handleLinkClick}
                >
                  <Link href={item.href}>
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
