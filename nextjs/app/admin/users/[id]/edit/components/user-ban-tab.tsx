"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_LABELS } from "@/lib/constants";
import { Ban, UserCheck, Loader2 } from "lucide-react";

interface UserBanTabProps {
  isBanned: boolean;
  isActionLoading: boolean;
  onBan: (banReason: string) => Promise<boolean>;
  onUnban: () => Promise<boolean>;
}

export function UserBanTab({ isBanned, isActionLoading, onBan, onUnban }: UserBanTabProps) {
  const [banReason, setBanReason] = useState("");

  const handleBan = async () => {
    const success = await onBan(banReason);
    if (success) {
      setBanReason("");
    }
  };

  if (isBanned) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{ADMIN_LABELS.UNBAN_USER}</h3>
          <p className="text-sm text-muted-foreground">
            This will restore the user&apos;s access to the system.
          </p>
        </div>
        <Button onClick={onUnban} disabled={isActionLoading} className="w-full">
          {isActionLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Unbanning...
            </>
          ) : (
            <>
              <UserCheck className="mr-2 h-4 w-4" />
              {ADMIN_LABELS.UNBAN_USER}
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{ADMIN_LABELS.BAN_USER}</h3>
        <p className="text-sm text-muted-foreground">
          Ban this user from accessing the system. You can provide an optional reason.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="banReason">{ADMIN_LABELS.BAN_REASON} (optional)</Label>
        <Input
          id="banReason"
          value={banReason}
          onChange={(e) => setBanReason(e.target.value)}
          placeholder={ADMIN_LABELS.BAN_REASON}
        />
      </div>
      <Button
        onClick={handleBan}
        disabled={isActionLoading}
        variant="destructive"
        className="w-full"
      >
        {isActionLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Banning...
          </>
        ) : (
          <>
            <Ban className="mr-2 h-4 w-4" />
            {ADMIN_LABELS.BAN_USER}
          </>
        )}
      </Button>
    </div>
  );
}

