"use client";

import { CheckSquare2, LayoutDashboard, MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AUTH_LABELS, CHAT_LABELS, USER_LAYOUT, USER_NAVIGATION } from "@/lib/constants";

interface UserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSidebar({ isOpen, onClose }: UserSidebarProps) {
  const pathname = usePathname();

  const navigationItems = [
    {
      href: "/dashboard",
      label: USER_NAVIGATION.DASHBOARD,
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/tasks",
      label: USER_NAVIGATION.TASKS,
      icon: CheckSquare2,
    },
    {
      href: "/chat",
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

  const isActive = (href: string) => {
    if (href === "/dashboard/tasks") {
      return pathname?.startsWith("/dashboard/tasks");
    }
    if (href === "/chat") {
      return pathname === "/chat";
    }
    if (href === "/profile") {
      return pathname === "/profile";
    }
    return pathname === href;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:fixed lg:top-0 lg:left-0 lg:h-full lg:w-64 lg:border-r lg:bg-background lg:z-40">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <Link
              href="/dashboard"
              className="text-lg font-bold hover:opacity-80 transition-opacity"
            >
              {USER_LAYOUT.APP_NAME}
            </Link>
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
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-lg font-bold">{USER_LAYOUT.APP_NAME}</SheetTitle>
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
