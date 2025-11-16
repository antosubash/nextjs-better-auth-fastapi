"use client";

import { LogOut, User } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ADMIN_LABELS } from "@/lib/constants";
import { useAdminStopImpersonating, useSession } from "@/lib/hooks/api/use-auth";

export function ImpersonationIndicator() {
  const { data: session } = useSession();
  const stopImpersonatingMutation = useAdminStopImpersonating();

  // Check if we're impersonating by checking session
  const user = session?.user as { [key: string]: unknown } | undefined;
  const isImpersonating = !!user?.impersonatedBy;
  const impersonatedUser =
    isImpersonating && user
      ? {
          id: user.id as string,
          name: (user.name as string) || "",
          email: (user.email as string) || "",
        }
      : null;

  const handleStopImpersonating = async () => {
    try {
      await stopImpersonatingMutation.mutateAsync();
      // Reload to return to admin session
      window.location.href = "/admin/users";
    } catch {
      // Error is handled by the mutation hook
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
