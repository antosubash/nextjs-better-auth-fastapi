"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
  AUTH_LABELS,
  AUTH_PLACEHOLDERS,
  LOGIN_PAGE,
  SAMPLE_ACCOUNTS,
} from "@/lib/constants";
import { useSession, useSignIn } from "@/lib/hooks/api/use-auth";
import { getDashboardPath } from "@/lib/utils";

interface LoginFormProps {
  onSwitchToSignup?: () => void;
}

const loginSchema = z.object({
  email: z.string().min(1, AUTH_ERRORS.EMAIL_REQUIRED).email(AUTH_ERRORS.EMAIL_REQUIRED),
  password: z.string().min(1, AUTH_ERRORS.PASSWORD_REQUIRED),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const router = useRouter();
  const signInMutation = useSignIn();
  const { data: session } = useSession();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (session?.user?.role) {
      router.push(getDashboardPath(session.user.role));
    }
  }, [session, router]);

  const handleSubmit = async (values: LoginFormValues) => {
    await signInMutation.mutateAsync({
      email: values.email,
      password: values.password,
    });
  };

  const handleSampleAccountClick = (email: string, password: string) => {
    form.setValue("email", email);
    form.setValue("password", password);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4 w-full max-w-md"
      >
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {LOGIN_PAGE.SAMPLE_ACCOUNTS_TITLE}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            {LOGIN_PAGE.SAMPLE_ACCOUNTS_DESCRIPTION}
          </p>
          <div className="flex flex-col gap-2">
            {SAMPLE_ACCOUNTS.map((account) => (
              <Button
                key={account.email}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSampleAccountClick(account.email, account.password)}
                className="w-full justify-start text-left h-auto py-2"
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {account.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{account.email}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{AUTH_LABELS.EMAIL}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={AUTH_PLACEHOLDERS.EMAIL} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{AUTH_LABELS.PASSWORD}</FormLabel>
              <FormControl>
                <Input type="password" placeholder={AUTH_PLACEHOLDERS.PASSWORD} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {signInMutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {signInMutation.error?.message || AUTH_ERRORS.LOGIN_FAILED}
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={signInMutation.isPending}>
          {signInMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            AUTH_LABELS.LOGIN
          )}
        </Button>

        <div className="text-center">
          <Button type="button" variant="link" asChild className="p-0 h-auto text-sm">
            <a href="/forgot-password">{AUTH_LABELS.FORGOT_PASSWORD}</a>
          </Button>
        </div>

        <p className="text-sm text-center text-muted-foreground">
          {AUTH_LABELS.DONT_HAVE_ACCOUNT}{" "}
          {onSwitchToSignup ? (
            <Button type="button" variant="link" onClick={onSwitchToSignup} className="p-0 h-auto">
              {AUTH_LABELS.SIGNUP}
            </Button>
          ) : (
            <Button type="button" variant="link" asChild className="p-0 h-auto">
              <Link href="/signup">{AUTH_LABELS.SIGNUP}</Link>
            </Button>
          )}
        </p>
      </form>
    </Form>
  );
}
