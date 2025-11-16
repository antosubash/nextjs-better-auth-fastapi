"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ADMIN_LABELS, ADMIN_PLACEHOLDERS, AUTH_ERRORS } from "@/lib/constants";
import { useAdminSetUserPassword } from "@/lib/hooks/api/use-auth";

interface UserPasswordDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, AUTH_ERRORS.PASSWORD_REQUIRED)
      .refine((val) => val.length >= AUTH_ERRORS.PASSWORD_MIN_LENGTH, {
        message: AUTH_ERRORS.PASSWORD_MIN_LENGTH_ERROR,
      }),
    confirmPassword: z.string().min(1, AUTH_ERRORS.CONFIRM_PASSWORD_REQUIRED),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: AUTH_ERRORS.PASSWORDS_DO_NOT_MATCH,
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function UserPasswordDialog({
  userId,
  open,
  onOpenChange,
  onSuccess,
}: UserPasswordDialogProps) {
  const setPasswordMutation = useAdminSetUserPassword();

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: PasswordFormValues) => {
    try {
      await setPasswordMutation.mutateAsync({
        userId,
        newPassword: values.newPassword,
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (_err) {
      // Error is handled by the mutation hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ADMIN_LABELS.RESET_PASSWORD}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{ADMIN_LABELS.NEW_PASSWORD}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={ADMIN_PLACEHOLDERS.NEW_PASSWORD}
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
                  <FormLabel>{ADMIN_LABELS.CONFIRM_PASSWORD}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={ADMIN_PLACEHOLDERS.CONFIRM_PASSWORD}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={setPasswordMutation.isPending}
              >
                {ADMIN_LABELS.CANCEL}
              </Button>
              <Button type="submit" disabled={setPasswordMutation.isPending}>
                {setPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  ADMIN_LABELS.SAVE
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
