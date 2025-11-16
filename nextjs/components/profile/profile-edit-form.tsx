"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
  PROFILE_UPDATE,
  PROFILE_UPDATE_ERRORS,
  PROFILE_UPDATE_PLACEHOLDERS,
} from "@/lib/constants";
import { useUpdateProfile } from "@/lib/hooks/api/use-auth";
import { ProfilePictureUpload } from "./profile-picture-upload";

const profileSchema = z.object({
  name: z.string().min(1, PROFILE_UPDATE_ERRORS.NAME_REQUIRED),
  email: z
    .string()
    .email(PROFILE_UPDATE_ERRORS.INVALID_EMAIL)
    .min(1, PROFILE_UPDATE_ERRORS.EMAIL_REQUIRED),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  initialName?: string;
  initialEmail?: string;
  initialImage?: string | null;
  onSuccess?: () => void;
}

export function ProfileEditForm({
  initialName = "",
  initialEmail = "",
  initialImage = null,
  onSuccess,
}: ProfileEditFormProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage);
  const updateProfileMutation = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialName,
      email: initialEmail,
    },
  });

  const handleSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfileMutation.mutateAsync({
        name: values.name,
        email: values.email,
        image: imageUrl,
      });
      onSuccess?.();
    } catch {
      // Error is handled by the mutation hook
    }
  };

  const handleImageChange = (url: string | null) => {
    setImageUrl(url);
  };

  return (
    <div className="space-y-6">
      <ProfilePictureUpload currentImageUrl={imageUrl} onImageChange={handleImageChange} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{PROFILE_UPDATE.NAME_LABEL}</FormLabel>
                <FormControl>
                  <Input type="text" placeholder={PROFILE_UPDATE_PLACEHOLDERS.NAME} {...field} />
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
                <FormLabel>{PROFILE_UPDATE.EMAIL_LABEL}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={PROFILE_UPDATE_PLACEHOLDERS.EMAIL} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {updateProfileMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {updateProfileMutation.error?.message || PROFILE_UPDATE_ERRORS.UPDATE_FAILED}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={updateProfileMutation.isPending} className="w-full">
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {PROFILE_UPDATE.UPDATING}
              </>
            ) : (
              PROFILE_UPDATE.UPDATE_BUTTON
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
