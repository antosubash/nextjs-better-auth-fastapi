"use client";

import { Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ADMIN_LABELS } from "@/lib/constants";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean;
}

interface UserActionsProps {
  user: User;
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/users/${user.id}/edit`)}
        >
          <Edit className="w-4 h-4 mr-2" />
          {ADMIN_LABELS.EDIT_USER}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{ADMIN_LABELS.EDIT_USER}</TooltipContent>
    </Tooltip>
  );
}
