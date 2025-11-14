"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { getAssignableUserRoles } from "@/lib/permissions-api";
import { RoleInfo } from "@/lib/permissions-utils";
import { getValidAssignableRole, isAssignableUserRole } from "@/lib/utils/role-validation";
import {
  ADMIN_LABELS,
  ADMIN_PLACEHOLDERS,
  ADMIN_ERRORS,
  USER_ROLES,
  ROLE_DISPLAY_NAMES,
  AUTH_ERRORS,
  MEMBER_ERRORS,
} from "@/lib/constants";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { ProfilePictureUpload } from "./profile-picture-upload";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  image?: string | null;
}

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface UserFormValues {
  name: string;
  email: string;
  password: string;
  role: string;
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableRoles, setAvailableRoles] = useState<RoleInfo[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const isEditing = !!user;

  const form = useForm<UserFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: USER_ROLES.USER,
    },
  });

  const loadRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const roles = await getAssignableUserRoles();
      setAvailableRoles(roles);
      if (!user && roles.length > 0) {
        // Default to first assignable role (user role is not assignable, it's the default)
        const defaultRole = roles[0]?.name || USER_ROLES.USER;
        form.setValue("role", defaultRole);
      }
    } catch (err) {
      console.error("Failed to load roles:", err);
    } finally {
      setIsLoadingRoles(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (user && availableRoles.length > 0) {
      // If user has a non-assignable role (like "user"), use first assignable role
      // Otherwise use the user's role if it's assignable
      const validRole = isAssignableUserRole(user.role)
        ? user.role!
        : availableRoles[0]?.name || USER_ROLES.USER;
      form.reset({
        name: user.name,
        email: user.email,
        password: "",
        role: validRole,
      });
    } else if (!user && availableRoles.length > 0) {
      // Reset form for create mode
      const defaultRole = availableRoles[0]?.name || USER_ROLES.USER;
      form.reset({
        name: "",
        email: "",
        password: "",
        role: defaultRole,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, availableRoles]);

  const handleProfilePictureUpload = async (imageUrl: string) => {
    if (!isEditing || !user) return;

    try {
      const result = await authClient.admin.updateUser({
        userId: user.id,
        data: {
          image: imageUrl,
        },
      });

      if (result.error) {
        setError(result.error.message || ADMIN_ERRORS.UPDATE_FAILED);
      } else {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : ADMIN_ERRORS.UPDATE_FAILED);
    }
  };

  const handleProfilePictureDelete = async () => {
    if (!isEditing || !user) return;

    try {
      const result = await authClient.admin.updateUser({
        userId: user.id,
        data: {
          image: null,
        },
      });

      if (result.error) {
        setError(result.error.message || ADMIN_ERRORS.UPDATE_FAILED);
      } else {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : ADMIN_ERRORS.UPDATE_FAILED);
    }
  };

  const handleSubmit = async (values: UserFormValues) => {
    setError("");
    setIsLoading(true);

    try {
      if (isEditing) {
        // Ensure only assignable roles are used
        const validRole = getValidAssignableRole(
          values.role,
          availableRoles[0]?.name || USER_ROLES.USER
        );

        const result = await authClient.admin.updateUser({
          userId: user!.id,
          data: {
            name: values.name,
            email: values.email,
            role: validRole,
          },
        });

        if (result.error) {
          setError(result.error.message || ADMIN_ERRORS.UPDATE_FAILED);
        } else {
          onSuccess();
        }
      } else {
        if (!values.password) {
          setError(AUTH_ERRORS.PASSWORD_REQUIRED);
          setIsLoading(false);
          return;
        }

        // Ensure only assignable roles are used
        const validRole = getValidAssignableRole(
          values.role,
          availableRoles[0]?.name || USER_ROLES.USER
        );

        // Better Auth client types don't include custom roles, but they are supported at runtime
        const result = await authClient.admin.createUser({
          email: values.email,
          password: values.password,
          name: values.name,
          // @ts-expect-error - Better Auth types only include "user" | "admin" but custom roles are supported
          role: validRole,
        });

        if (result.error) {
          setError(result.error.message || ADMIN_ERRORS.CREATE_FAILED);
        } else {
          onSuccess();
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : isEditing
            ? ADMIN_ERRORS.UPDATE_FAILED
            : ADMIN_ERRORS.CREATE_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEditing && (
        <div className="space-y-2">
          <ProfilePictureUpload
            currentImageUrl={user?.image}
            onUploadSuccess={handleProfilePictureUpload}
            onDeleteSuccess={handleProfilePictureDelete}
            disabled={isLoading}
            userName={user?.name}
            userEmail={user?.email}
          />
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            rules={{ required: AUTH_ERRORS.NAME_REQUIRED }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{ADMIN_LABELS.NAME}</FormLabel>
                <FormControl>
                  <Input placeholder={ADMIN_PLACEHOLDERS.NAME} {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            rules={{
              required: AUTH_ERRORS.EMAIL_REQUIRED,
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: MEMBER_ERRORS.INVALID_EMAIL,
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{ADMIN_LABELS.EMAIL}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={ADMIN_PLACEHOLDERS.EMAIL}
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isEditing && (
            <FormField
              control={form.control}
              name="password"
              rules={{ required: AUTH_ERRORS.PASSWORD_REQUIRED }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{ADMIN_LABELS.PASSWORD}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={ADMIN_PLACEHOLDERS.PASSWORD}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{ADMIN_LABELS.ROLE}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoadingRoles}
                >
                  <FormControl>
                    <SelectTrigger disabled={isLoading || isLoadingRoles}>
                      <SelectValue placeholder={ADMIN_PLACEHOLDERS.ROLE} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingRoles ? (
                      <div className="p-2">
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : (
                      availableRoles.map((roleInfo) => (
                        <SelectItem key={roleInfo.name} value={roleInfo.name}>
                          {ROLE_DISPLAY_NAMES[roleInfo.name as keyof typeof ROLE_DISPLAY_NAMES] ||
                            roleInfo.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading || isLoadingRoles} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {ADMIN_LABELS.SAVING}
                </>
              ) : (
                ADMIN_LABELS.SAVE
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              {ADMIN_LABELS.CANCEL}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
