"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { AUTH_LABELS, DASHBOARD } from "@/lib/constants";
import { LogIn, LogOut, Menu } from "lucide-react";
import { OrganizationSwitcher } from "@/components/organization/organization-switcher";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

export function MainNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        const hasSession = !!session?.data?.session;
        setIsAuthenticated(hasSession);
        if (hasSession && session?.data?.user) {
          setUser(session.data.user);
        }
      } catch (err) {
        console.error("Failed to check auth:", err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      setIsAuthenticated(false);
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  const handleLogin = () => {
    router.push("/");
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
          <Link
            href="/"
            className="text-xl font-bold hover:opacity-80 transition-opacity"
          >
            Better Auth
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && (
              <Button
                asChild
                variant={pathname === "/dashboard" ? "default" : "ghost"}
              >
                <Link href="/dashboard">
                  {DASHBOARD.TITLE}
                </Link>
              </Button>
            )}

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <OrganizationSwitcher />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-sm">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden lg:block">
                    {user.name || user.email}
                  </span>
                </div>
                <Button onClick={handleLogout} variant="default" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden lg:inline">{AUTH_LABELS.LOGOUT}</span>
                </Button>
              </div>
            ) : (
              <Button onClick={handleLogin} variant="default">
                <LogIn className="w-4 h-4 mr-2" />
                {AUTH_LABELS.LOGIN}
              </Button>
            )}
          </div>

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
              <div className="mt-6 space-y-4">
                {isAuthenticated && (
                  <Button
                    asChild
                    variant={pathname === "/dashboard" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/dashboard">
                      {DASHBOARD.TITLE}
                    </Link>
                  </Button>
                )}

                {isAuthenticated && user ? (
                  <div className="space-y-4">
                    <div>
                      <OrganizationSwitcher />
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {getInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {user.name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
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
                ) : (
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
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

