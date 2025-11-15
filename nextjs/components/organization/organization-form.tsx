"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import {
  ORGANIZATION_ERRORS,
  ORGANIZATION_LABELS,
  ORGANIZATION_PLACEHOLDERS,
} from "@/lib/constants";

interface Organization {
  id: string;
  name: string;
  slug: string;
  metadata?: {
    description?: string;
  };
}

interface OrganizationFormProps {
  organization?: Organization | null;
  onSuccess: () => void;
  onCancel: () => void;
  hideHeader?: boolean;
}

interface OrganizationFormValues {
  name: string;
  slug: string;
  description: string;
}

export function OrganizationForm({
  organization,
  onSuccess,
  onCancel,
  hideHeader = false,
}: OrganizationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!organization;

  const form = useForm<OrganizationFormValues>({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        slug: organization.slug,
        description: organization.metadata?.description || "",
      });
    }
  }, [organization, form]);

  const handleSubmit = async (values: OrganizationFormValues) => {
    setError("");
    setIsLoading(true);

    try {
      if (isEditing) {
        const result = await authClient.organization.update({
          organizationId: organization.id,
          data: {
            name: values.name,
            slug: values.slug,
            metadata: values.description ? { description: values.description } : undefined,
          },
        });

        if (result.error) {
          setError(result.error.message || ORGANIZATION_ERRORS.UPDATE_FAILED);
        } else {
          onSuccess();
        }
      } else {
        const result = await authClient.organization.create({
          name: values.name,
          slug: values.slug,
          metadata: values.description ? { description: values.description } : undefined,
        });

        if (result.error) {
          setError(result.error.message || ORGANIZATION_ERRORS.CREATE_FAILED);
        } else {
          onSuccess();
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : isEditing
            ? ORGANIZATION_ERRORS.UPDATE_FAILED
            : ORGANIZATION_ERRORS.CREATE_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            rules={{
              required: ORGANIZATION_ERRORS.INVALID_NAME,
              maxLength: {
                value: 100,
                message: ORGANIZATION_ERRORS.NAME_TOO_LONG,
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{ORGANIZATION_LABELS.NAME}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={ORGANIZATION_PLACEHOLDERS.NAME}
                    maxLength={100}
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
            name="slug"
            rules={{
              required: ORGANIZATION_ERRORS.SLUG_REQUIRED,
              pattern: {
                value: /^[a-z0-9-]+$/,
                message: ORGANIZATION_ERRORS.INVALID_SLUG_FORMAT,
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{ORGANIZATION_LABELS.SLUG}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={ORGANIZATION_PLACEHOLDERS.SLUG}
                    {...field}
                    onChange={(e) => {
                      const lowerValue = e.target.value.toLowerCase();
                      field.onChange(lowerValue);
                    }}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
                {!form.formState.errors.slug && field.value && (
                  <p className="text-xs text-muted-foreground">
                    {ORGANIZATION_PLACEHOLDERS.SLUG_HINT}
                  </p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{ORGANIZATION_LABELS.DESCRIPTION}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={ORGANIZATION_PLACEHOLDERS.DESCRIPTION}
                    rows={3}
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? ORGANIZATION_LABELS.SAVING : ORGANIZATION_LABELS.SAVE}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              {ORGANIZATION_LABELS.CANCEL}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );

  if (hideHeader) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {isEditing
              ? ORGANIZATION_LABELS.EDIT_ORGANIZATION
              : ORGANIZATION_LABELS.CREATE_ORGANIZATION}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
