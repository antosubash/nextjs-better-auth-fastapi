"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ADMIN_LABELS, ROLE_DISPLAY_NAMES } from "@/lib/constants";
import { Mail, Shield, Calendar, CheckCircle2, XCircle, Ban } from "lucide-react";
import { formatDate } from "@/lib/utils/date";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean;
  createdAt?: number;
  emailVerified?: boolean;
}

interface UserInfoCardProps {
  user: User;
}

export function UserInfoCard({ user }: UserInfoCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-4 flex-1">
            <div>
              <h2 className="text-2xl font-semibold mb-1">{user.name}</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
                {user.emailVerified ? (
                  <Badge variant="default" className="ml-2 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {ADMIN_LABELS.EMAIL_VERIFIED}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2 gap-1">
                    <XCircle className="w-3 h-3" />
                    {ADMIN_LABELS.EMAIL_NOT_VERIFIED}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {user.role && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{ADMIN_LABELS.ROLE}:</span>
                  <Badge variant="outline">
                    {ROLE_DISPLAY_NAMES[user.role as keyof typeof ROLE_DISPLAY_NAMES] ||
                      user.role}
                  </Badge>
                </div>
              )}

              {user.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {ADMIN_LABELS.CREATED_AT}: {formatDate(user.createdAt, "long")}
                  </span>
                </div>
              )}

              {user.banned && (
                <Badge variant="destructive" className="gap-1">
                  <Ban className="w-3 h-3" />
                  {ADMIN_LABELS.BANNED}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

