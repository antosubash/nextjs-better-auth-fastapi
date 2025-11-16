"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { AUTH_ERRORS, AUTH_LABELS, AUTH_PLACEHOLDERS } from "@/lib/constants";
import { useSession, useSignIn } from "@/lib/hooks/api/use-auth";
import { getDashboardPath } from "@/lib/utils";

interface LoginFormProps {
  onSwitchToSignup: () => void;
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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4 w-full max-w-md"
      >
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

        <p className="text-sm text-center text-muted-foreground">
          {AUTH_LABELS.DONT_HAVE_ACCOUNT}{" "}
          <Button type="button" variant="link" onClick={onSwitchToSignup} className="p-0 h-auto">
            {AUTH_LABELS.SIGNUP}
          </Button>
        </p>
      </form>
    </Form>
  );
}
