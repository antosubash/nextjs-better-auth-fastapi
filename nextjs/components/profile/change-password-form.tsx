"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  AUTH_ERRORS,
  CHANGE_PASSWORD,
  CHANGE_PASSWORD_ERRORS,
  CHANGE_PASSWORD_PLACEHOLDERS,
} from "@/lib/constants";
import { useChangePassword } from "@/lib/hooks/api/use-auth";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, CHANGE_PASSWORD_ERRORS.CURRENT_PASSWORD_REQUIRED),
    newPassword: z
      .string()
      .min(AUTH_ERRORS.PASSWORD_MIN_LENGTH, AUTH_ERRORS.PASSWORD_MIN_LENGTH_ERROR),
    confirmPassword: z.string().min(1, CHANGE_PASSWORD_ERRORS.CONFIRM_PASSWORD_REQUIRED),
    revokeOtherSessions: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: CHANGE_PASSWORD_ERRORS.PASSWORDS_DO_NOT_MATCH,
    path: ["confirmPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const changePasswordMutation = useChangePassword();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: false,
    },
  });

  const handleSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: values.revokeOtherSessions,
      });
      form.reset();
      onSuccess?.();
    } catch {
      // Error is handled by the mutation hook
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{CHANGE_PASSWORD.CURRENT_PASSWORD_LABEL}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={CHANGE_PASSWORD_PLACEHOLDERS.CURRENT_PASSWORD}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{CHANGE_PASSWORD.NEW_PASSWORD_LABEL}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={CHANGE_PASSWORD_PLACEHOLDERS.NEW_PASSWORD}
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
              <FormLabel>{CHANGE_PASSWORD.CONFIRM_PASSWORD_LABEL}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={CHANGE_PASSWORD_PLACEHOLDERS.CONFIRM_PASSWORD}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="revokeOtherSessions"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{CHANGE_PASSWORD.REVOKE_OTHER_SESSIONS}</FormLabel>
                <FormDescription>
                  {CHANGE_PASSWORD.REVOKE_OTHER_SESSIONS_DESCRIPTION}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {changePasswordMutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {changePasswordMutation.error?.message || CHANGE_PASSWORD_ERRORS.CHANGE_FAILED}
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={changePasswordMutation.isPending} className="w-full">
          {changePasswordMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {CHANGE_PASSWORD.CHANGING}
            </>
          ) : (
            CHANGE_PASSWORD.SUBMIT_BUTTON
          )}
        </Button>
      </form>
    </Form>
  );
}
