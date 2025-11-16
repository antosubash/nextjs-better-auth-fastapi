"use client";

import { CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EMAIL_VERIFICATION, EMAIL_VERIFICATION_ERRORS } from "@/lib/constants";
import { useSendVerificationEmail } from "@/lib/hooks/api/use-auth";

interface EmailVerificationSectionProps {
  email: string;
  isVerified: boolean;
}

export function EmailVerificationSection({ email, isVerified }: EmailVerificationSectionProps) {
  const sendVerificationEmailMutation = useSendVerificationEmail();

  const handleResend = async () => {
    try {
      await sendVerificationEmailMutation.mutateAsync({ email });
    } catch {
      // Error is handled by the mutation hook
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{EMAIL_VERIFICATION.TITLE}</CardTitle>
          {isVerified ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          )}
        </div>
        <CardDescription>
          {isVerified
            ? EMAIL_VERIFICATION.VERIFIED_DESCRIPTION
            : EMAIL_VERIFICATION.NOT_VERIFIED_DESCRIPTION}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
          <div className="p-2 rounded-lg bg-muted">
            <Mail className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-muted-foreground mb-1 block">{email}</span>
            <p className="text-base font-medium">
              {isVerified ? EMAIL_VERIFICATION.VERIFIED : EMAIL_VERIFICATION.NOT_VERIFIED}
            </p>
          </div>
        </div>

        {!isVerified && (
          <>
            {sendVerificationEmailMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {sendVerificationEmailMutation.error?.message ||
                    EMAIL_VERIFICATION_ERRORS.RESEND_FAILED}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleResend}
              disabled={sendVerificationEmailMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {sendVerificationEmailMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {EMAIL_VERIFICATION.RESENDING}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {EMAIL_VERIFICATION.RESEND_BUTTON}
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
