"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  FORGOT_PASSWORD,
  FORGOT_PASSWORD_ERRORS,
  FORGOT_PASSWORD_PLACEHOLDERS,
  PAGE_CONTAINER,
} from "@/lib/constants";
import { useRequestPasswordReset } from "@/lib/hooks/api/use-auth";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email(FORGOT_PASSWORD_ERRORS.INVALID_EMAIL)
    .min(1, FORGOT_PASSWORD_ERRORS.EMAIL_REQUIRED),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const requestPasswordResetMutation = useRequestPasswordReset();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await requestPasswordResetMutation.mutateAsync({
        email: values.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setIsSuccess(true);
    } catch {
      // Error is handled by the mutation hook
    }
  };

  if (isSuccess) {
    return (
      <main className={PAGE_CONTAINER.CLASS}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold">{FORGOT_PASSWORD.SUCCESS_TITLE}</h1>
              <p className="text-muted-foreground">{FORGOT_PASSWORD.SUCCESS_MESSAGE}</p>
            </div>
            <Button asChild variant="default" className="w-full">
              <Link href="/">{FORGOT_PASSWORD.BACK_TO_LOGIN}</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={PAGE_CONTAINER.CLASS}>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">{FORGOT_PASSWORD.TITLE}</h1>
            <p className="text-muted-foreground">{FORGOT_PASSWORD.DESCRIPTION}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{FORGOT_PASSWORD.EMAIL_LABEL}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={FORGOT_PASSWORD_PLACEHOLDERS.EMAIL}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {requestPasswordResetMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {requestPasswordResetMutation.error?.message ||
                      FORGOT_PASSWORD_ERRORS.REQUEST_FAILED}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={requestPasswordResetMutation.isPending}
                className="w-full"
              >
                {requestPasswordResetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {FORGOT_PASSWORD.SENDING}
                  </>
                ) : (
                  FORGOT_PASSWORD.SUBMIT_BUTTON
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <Button asChild variant="link" className="p-0 h-auto">
              <Link href="/">{FORGOT_PASSWORD.BACK_TO_LOGIN}</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
