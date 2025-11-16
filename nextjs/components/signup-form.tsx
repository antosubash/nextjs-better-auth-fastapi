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
import { useSignUp, useSession } from "@/lib/hooks/api/use-auth";
import { getDashboardPath } from "@/lib/utils";

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

const signupSchema = z.object({
  name: z.string().min(1, AUTH_ERRORS.NAME_REQUIRED),
  email: z.string().min(1, AUTH_ERRORS.EMAIL_REQUIRED).email(AUTH_ERRORS.EMAIL_REQUIRED),
  password: z
    .string()
    .min(1, AUTH_ERRORS.PASSWORD_REQUIRED)
    .refine((val) => val.length >= AUTH_ERRORS.PASSWORD_MIN_LENGTH, {
      message: AUTH_ERRORS.PASSWORD_MIN_LENGTH_ERROR,
    }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const router = useRouter();
  const signUpMutation = useSignUp();
  const { data: session } = useSession();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (session?.user?.role) {
      router.push(getDashboardPath(session.user.role));
    }
  }, [session, router]);

  const handleSubmit = async (values: SignupFormValues) => {
    await signUpMutation.mutateAsync({
      email: values.email,
      password: values.password,
      name: values.name,
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{AUTH_LABELS.NAME}</FormLabel>
              <FormControl>
                <Input type="text" placeholder={AUTH_PLACEHOLDERS.NAME} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        {signUpMutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {signUpMutation.error?.message || AUTH_ERRORS.SIGNUP_FAILED}
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={signUpMutation.isPending}>
          {signUpMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            AUTH_LABELS.SIGNUP
          )}
        </Button>

        <p className="text-sm text-center text-muted-foreground">
          {AUTH_LABELS.ALREADY_HAVE_ACCOUNT}{" "}
          <Button type="button" variant="link" onClick={onSwitchToLogin} className="p-0 h-auto">
            {AUTH_LABELS.LOGIN}
          </Button>
        </p>
      </form>
    </Form>
  );
}
