"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { authClient } from "@/lib/auth-client";
import {
  AUTH_ERRORS,
  COMMON_LABELS,
  INVITATION_ERRORS,
  INVITATION_LABELS,
  INVITATION_PLACEHOLDERS,
  MEMBER_ERRORS,
  ORGANIZATION_ROLES,
} from "@/lib/constants";
import { MemberRoleSelector } from "./member-role-selector";

interface InvitationFormProps {
  organizationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const invitationSchema = z.object({
  email: z.string().min(1, AUTH_ERRORS.EMAIL_REQUIRED).email(MEMBER_ERRORS.INVALID_EMAIL),
  role: z.enum([
    ORGANIZATION_ROLES.MEMBER,
    ORGANIZATION_ROLES.ADMIN,
    ORGANIZATION_ROLES.OWNER,
    ORGANIZATION_ROLES.MY_CUSTOM_ROLE,
  ]),
});

type InvitationFormValues = z.infer<typeof invitationSchema>;

export function InvitationForm({ organizationId, onSuccess, onCancel }: InvitationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: "",
      role: ORGANIZATION_ROLES.MEMBER,
    },
  });

  const handleSubmit = async (values: InvitationFormValues) => {
    setError("");
    setIsLoading(true);

    try {
      // @ts-expect-error - better-auth organization client API method
      const result = await authClient.organization.createInvitation({
        organizationId,
        email: values.email,
        role: values.role,
      });

      if (result.error) {
        setError(result.error.message || INVITATION_ERRORS.SEND_FAILED);
      } else {
        form.reset();
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : INVITATION_ERRORS.SEND_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {INVITATION_LABELS.SEND_INVITATION}
      </h3>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{INVITATION_LABELS.EMAIL}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={INVITATION_PLACEHOLDERS.EMAIL}
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{INVITATION_LABELS.ROLE}</FormLabel>
                <FormControl>
                  <MemberRoleSelector
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? INVITATION_LABELS.SENDING : INVITATION_LABELS.SEND_INVITATION}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              {COMMON_LABELS.CANCEL}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
