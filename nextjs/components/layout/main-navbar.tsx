"use client";

import { LogIn, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/branding/logo";
import { OrganizationSwitcher } from "@/components/organization/organization-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { AUTH_LABELS, DASHBOARD } from "@/lib/constants";
import { useSession, useSignOut } from "@/lib/hooks/api/use-auth";

export function MainNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isLoading } = useSession();
  const signOutMutation = useSignOut();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!session?.session;
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

  const handleLogin = () => {
    router.push("/login");
  };

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

  const renderUserProfile = (showName = true) => {
    if (!user) return null;

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted cursor-pointer">
        <Avatar className="w-8 h-8">
          {user.image ? <AvatarImage src={user.image} alt={user.name || "User"} /> : null}
          <AvatarFallback className="text-sm">{getInitials(user.name, user.email)}</AvatarFallback>
        </Avatar>
        {showName && (
          <span className="text-sm font-medium hidden lg:block">{user.name || user.email}</span>
        )}
      </div>
    );
  };

  const renderDesktopNav = () => {
    if (!isAuthenticated) {
      return (
        <Button onClick={handleLogin} variant="default">
          <LogIn className="w-4 h-4 mr-2" />
          {AUTH_LABELS.LOGIN}
        </Button>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <Button asChild variant={pathname === "/dashboard" ? "default" : "ghost"}>
          <Link href="/dashboard">{DASHBOARD.TITLE}</Link>
        </Button>
        {user && (
          <div className="flex items-center gap-3">
            <OrganizationSwitcher />
            <Separator orientation="vertical" className="h-6" />
            <HoverCard>
              <HoverCardTrigger asChild>{renderUserProfile()}</HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      {user.image ? (
                        <AvatarImage src={user.image} alt={user.name || "User"} />
                      ) : null}
                      <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">{user.name || "User"}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
            <Button onClick={handleLogout} variant="default" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">{AUTH_LABELS.LOGOUT}</span>
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderMobileMenu = () => {
    if (!isAuthenticated) {
      return (
        <Button
          onClick={() => {
            handleLogin();
            setMobileMenuOpen(false);
          }}
          variant="default"
          className="w-full"
        >
          <LogIn className="w-4 h-4 mr-2" />
          {AUTH_LABELS.LOGIN}
        </Button>
      );
    }

    if (!user) return null;

    return (
      <div className="space-y-4">
        <Button
          asChild
          variant={pathname === "/dashboard" ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => setMobileMenuOpen(false)}
        >
          <Link href="/dashboard">{DASHBOARD.TITLE}</Link>
        </Button>
        <div>
          <OrganizationSwitcher />
        </div>
        <Separator />
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
          <Avatar className="w-10 h-10">
            {user.image ? <AvatarImage src={user.image} alt={user.name || "User"} /> : null}
            <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{user.name || "User"}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button
          onClick={() => {
            handleLogout();
            setMobileMenuOpen(false);
          }}
          variant="default"
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {AUTH_LABELS.LOGOUT}
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <nav className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <Logo size="md" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">{renderDesktopNav()}</div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-6 h-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">{renderMobileMenu()}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
