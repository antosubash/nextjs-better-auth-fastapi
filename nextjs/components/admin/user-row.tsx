"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { TableCell, TableRow } from "@/components/ui/table";
import { ADMIN_LABELS, ROLE_DISPLAY_NAMES, USER_ROLES } from "@/lib/constants";
import { UserActions } from "./user-actions";
import type { User } from "./user-list-utils";
import { formatDate } from "./user-list-utils";

interface UserRowProps {
  user: User;
  selectedUserIds: Set<string>;
  onSelectUser: (userId: string, checked: boolean) => void;
  onUserClick: (user: User) => void;
}

function getUserRoleDisplay(role?: string) {
  return (
    (role && ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES]) || role || USER_ROLES.USER
  );
}

export function UserRow({ user, selectedUserIds, onSelectUser, onUserClick }: UserRowProps) {
  return (
    <TableRow key={user.id} className="cursor-pointer" onClick={() => onUserClick(user)}>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selectedUserIds.has(user.id)}
          onCheckedChange={(checked) => onSelectUser(user.id, checked as boolean)}
        />
      </TableCell>
      <TableCell>
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className="font-medium cursor-pointer hover:underline">{user.name}</span>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <div>
                <h4 className="text-sm font-semibold">{user.name}</h4>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>
                  <span className="font-medium">Role:</span> {getUserRoleDisplay(user.role)}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  {user.banned ? ADMIN_LABELS.BANNED : ADMIN_LABELS.ACTIVE}
                </p>
                <p>
                  <span className="font-medium">Email Verified:</span>{" "}
                  {user.emailVerified
                    ? ADMIN_LABELS.EMAIL_VERIFIED
                    : ADMIN_LABELS.EMAIL_NOT_VERIFIED}
                </p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant="secondary">{getUserRoleDisplay(user.role)}</Badge>
      </TableCell>
      <TableCell>
        {user.banned ? (
          <Badge variant="destructive">{ADMIN_LABELS.BANNED}</Badge>
        ) : (
          <Badge variant="default">{ADMIN_LABELS.ACTIVE}</Badge>
        )}
      </TableCell>
      <TableCell>{formatDate(user.createdAt)}</TableCell>
      <TableCell>
        {user.emailVerified ? (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {ADMIN_LABELS.EMAIL_VERIFIED}
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="w-3 h-3" />
            {ADMIN_LABELS.EMAIL_NOT_VERIFIED}
          </Badge>
        )}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <UserActions user={user} />
      </TableCell>
    </TableRow>
  );
}
