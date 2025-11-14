"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ADMIN_LABELS, ADMIN_PLACEHOLDERS } from "@/lib/constants";
import { useToast } from "@/lib/hooks/use-toast";
import { Key, Loader2 } from "lucide-react";

interface PasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

interface UserPasswordTabProps {
  isActionLoading: boolean;
  onPasswordReset: (newPassword: string) => Promise<boolean>;
}

export function UserPasswordTab({ isActionLoading, onPasswordReset }: UserPasswordTabProps) {
  const toast = useToast();
  const passwordForm = useForm<PasswordFormValues>({
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

    const success = await onPasswordReset(values.newPassword);
    if (success) {
      passwordForm.reset();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{ADMIN_LABELS.RESET_PASSWORD}</h3>
        <p className="text-sm text-muted-foreground">
          Set a new password for this user. The user will need to use this password to log in.
        </p>
      </div>
      <Form {...passwordForm}>
        <form onSubmit={passwordForm.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={passwordForm.control}
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
            control={passwordForm.control}
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

          <Button type="submit" disabled={isActionLoading} className="w-full">
            {isActionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                {ADMIN_LABELS.SAVE}
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

