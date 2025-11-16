"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  AUTH_ERRORS,
  PAGE_CONTAINER,
  RESET_PASSWORD,
  RESET_PASSWORD_ERRORS,
  RESET_PASSWORD_PLACEHOLDERS,
} from "@/lib/constants";
import { useResetPassword } from "@/lib/hooks/api/use-auth";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(AUTH_ERRORS.PASSWORD_MIN_LENGTH, AUTH_ERRORS.PASSWORD_MIN_LENGTH_ERROR),
    confirmPassword: z.string().min(1, RESET_PASSWORD_ERRORS.CONFIRM_PASSWORD_REQUIRED),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: RESET_PASSWORD_ERRORS.PASSWORDS_DO_NOT_MATCH,
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [isSuccess, setIsSuccess] = useState(false);
  const resetPasswordMutation = useResetPassword();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      form.setError("root", {
        message: RESET_PASSWORD_ERRORS.TOKEN_REQUIRED,
      });
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        newPassword: values.newPassword,
        token,
      });
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 3000);
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
              <h1 className="text-2xl font-bold">{RESET_PASSWORD.SUCCESS_TITLE}</h1>
              <p className="text-muted-foreground">{RESET_PASSWORD.SUCCESS_MESSAGE}</p>
            </div>
            <Button asChild variant="default" className="w-full">
              <Link href="/">{RESET_PASSWORD.BACK_TO_LOGIN}</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className={PAGE_CONTAINER.CLASS}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
            <Alert variant="destructive">
              <AlertDescription>{RESET_PASSWORD_ERRORS.TOKEN_REQUIRED}</AlertDescription>
            </Alert>
            <Button asChild variant="default" className="w-full">
              <Link href="/">{RESET_PASSWORD.BACK_TO_LOGIN}</Link>
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
            <h1 className="text-2xl font-bold">{RESET_PASSWORD.TITLE}</h1>
            <p className="text-muted-foreground">{RESET_PASSWORD.DESCRIPTION}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{RESET_PASSWORD.NEW_PASSWORD_LABEL}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={RESET_PASSWORD_PLACEHOLDERS.NEW_PASSWORD}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{RESET_PASSWORD.CONFIRM_PASSWORD_LABEL}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={RESET_PASSWORD_PLACEHOLDERS.CONFIRM_PASSWORD}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {resetPasswordMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {resetPasswordMutation.error?.message || RESET_PASSWORD_ERRORS.RESET_FAILED}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={resetPasswordMutation.isPending} className="w-full">
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {RESET_PASSWORD.RESETTING}
                  </>
                ) : (
                  RESET_PASSWORD.SUBMIT_BUTTON
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <Button asChild variant="link" className="p-0 h-auto">
              <Link href="/">{RESET_PASSWORD.BACK_TO_LOGIN}</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
