"use client";

import { Button } from "@/components/ui/button";
import { ADMIN_LABELS } from "@/lib/constants";
import { ArrowLeft, User, UserCog, Mail, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserEditHeaderProps {
  isActionLoading: boolean;
  onImpersonate: () => Promise<boolean>;
  onResendVerificationEmail: () => Promise<boolean>;
  onDeleteClick: () => void;
}

export function UserEditHeader({
  isActionLoading,
  onImpersonate,
  onResendVerificationEmail,
  onDeleteClick,
}: UserEditHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/users")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{ADMIN_LABELS.EDIT_USER}</h1>
            <p className="text-sm text-muted-foreground">Manage user account and settings</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={onImpersonate}
          disabled={isActionLoading}
          size="sm"
        >
          <UserCog className="mr-2 h-4 w-4" />
          {ADMIN_LABELS.IMPERSONATE_USER}
        </Button>
        <Button
          variant="outline"
          onClick={onResendVerificationEmail}
          disabled={isActionLoading}
          size="sm"
        >
          <Mail className="mr-2 h-4 w-4" />
          {ADMIN_LABELS.RESEND_VERIFICATION_EMAIL}
        </Button>
        <Button variant="destructive" onClick={onDeleteClick} disabled={isActionLoading} size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          {ADMIN_LABELS.DELETE_USER}
        </Button>
      </div>
    </div>
  );
}

