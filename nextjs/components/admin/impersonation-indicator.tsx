"use client";

import { LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { ADMIN_ERRORS, ADMIN_LABELS, ADMIN_SUCCESS } from "@/lib/constants";
import { useToast } from "@/lib/hooks/use-toast";

export function ImpersonationIndicator() {
  const toast = useToast();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    // Check if we're impersonating by checking session or API
    const checkImpersonationStatus = async () => {
      try {
        const session = await authClient.getSession();
        // Check if session indicates impersonation
        // This is a placeholder - actual implementation depends on Better Auth API
        if (session?.data?.user) {
          // Check for impersonation flag in session
          const user = session.data.user as { [key: string]: unknown };
          if (user.impersonatedBy) {
            setIsImpersonating(true);
            setImpersonatedUser({
              id: user.id as string,
              name: (user.name as string) || "",
              email: (user.email as string) || "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to check impersonation status:", err);
      }
    };
    void checkImpersonationStatus();
  }, []);

  const handleStopImpersonating = async () => {
    try {
      const result = await authClient.admin.stopImpersonating();

      if (result.error) {
        toast.error(result.error.message || ADMIN_ERRORS.STOP_IMPERSONATION_FAILED);
      } else {
        toast.success(ADMIN_SUCCESS.IMPERSONATION_STOPPED);
        setIsImpersonating(false);
        setImpersonatedUser(null);
        // Reload to return to admin session
        window.location.href = "/admin/users";
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ADMIN_ERRORS.STOP_IMPERSONATION_FAILED;
      toast.error(errorMessage);
    }
  };

  if (!isImpersonating || !impersonatedUser) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 shadow-lg">
      <Alert className="container mx-auto bg-yellow-500 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 border-yellow-600 dark:border-yellow-700">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="font-medium">
              {ADMIN_LABELS.IMPERSONATING}: {impersonatedUser.name} ({impersonatedUser.email})
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStopImpersonating}
            className="bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {ADMIN_LABELS.STOP_IMPERSONATING}
          </Button>
        </div>
      </Alert>
    </div>
  );
}
