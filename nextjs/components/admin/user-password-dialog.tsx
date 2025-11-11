"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/lib/hooks/use-toast";
import {
  ADMIN_LABELS,
  ADMIN_PLACEHOLDERS,
  ADMIN_ERRORS,
  ADMIN_SUCCESS,
} from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface UserPasswordDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface PasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

export function UserPasswordDialog({
  userId,
  open,
  onOpenChange,
  onSuccess,
}: UserPasswordDialogProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PasswordFormValues>({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: PasswordFormValues) => {
    if (values.newPassword !== values.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (values.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.admin.setUserPassword({
        userId,
        newPassword: values.newPassword,
      });

      if (result.error) {
        toast.error(result.error.message || ADMIN_ERRORS.PASSWORD_RESET_FAILED);
      } else {
        toast.success(ADMIN_SUCCESS.PASSWORD_RESET);
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : ADMIN_ERRORS.PASSWORD_RESET_FAILED;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
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
              rules={{ required: "Password is required" }}
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
              rules={{ required: "Please confirm password" }}
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
                disabled={isLoading}
              >
                {ADMIN_LABELS.CANCEL}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
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

