"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { API_KEY_ERRORS, API_KEY_LABELS, API_KEY_PLACEHOLDERS } from "@/lib/constants";
import { useCreateApiKey, useUpdateApiKey } from "@/lib/hooks/api/use-api-keys";
import { useApiKeyStore } from "@/lib/stores/api-key-store";
import { buildCreateData, buildUpdateData } from "./api-key-form-data";
import {
  buildFormStateFromApiKey,
  buildFormValuesFromApiKey,
  parseFormMetadata,
} from "./api-key-form-helpers";
import { type ApiKeyFormValues, apiKeySchema } from "./api-key-form-schema";
import type { ApiKeyFormProps } from "./api-key-form-types";
import { PermissionsEditor } from "./permissions-editor";

export function ApiKeyForm({ apiKey, onSuccess, onCancel }: ApiKeyFormProps) {
  const { form: formState, setFormPermissions, initializeForm, resetForm } = useApiKeyStore();

  const {
    permissions,
    remaining,
    refillAmount,
    refillInterval,
    rateLimitEnabled,
    rateLimitTimeWindow,
    rateLimitMax,
  } = formState;

  const [error, setError] = useState("");

  const isEditing = !!apiKey;
  const createMutation = useCreateApiKey();
  const updateMutation = useUpdateApiKey();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: "",
      prefix: "",
      expiresIn: "",
      metadata: "",
    },
  });

  useEffect(() => {
    if (apiKey) {
      const formValues = buildFormValuesFromApiKey(apiKey);
      form.reset(formValues);
      const formState = buildFormStateFromApiKey(apiKey);
      initializeForm(formState);
    } else {
      resetForm();
    }
  }, [apiKey, form, initializeForm, resetForm]);

  const parseFormPermissions = (): Record<string, string[]> | undefined => {
    return Object.keys(permissions).length > 0 ? permissions : undefined;
  };

  const handleFormError = (err: unknown): void => {
    const errorMessage =
      err instanceof Error
        ? err.message
        : isEditing
          ? API_KEY_ERRORS.UPDATE_FAILED
          : API_KEY_ERRORS.CREATE_FAILED;
    setError(errorMessage);
  };

  const handleSubmit = async (values: ApiKeyFormValues) => {
    setError("");

    const parsedMetadata = parseFormMetadata(values.metadata || "");
    const parsedPermissions = parseFormPermissions();

    try {
      if (isEditing && apiKey) {
        const updateData = buildUpdateData(values, parsedMetadata, parsedPermissions);
        await updateMutation.mutateAsync({ id: apiKey.id, data: updateData });
        onSuccess();
      } else {
        const createData = buildCreateData(values, parsedMetadata, parsedPermissions);
        const result = await createMutation.mutateAsync(createData);
        onSuccess(result.data?.key);
      }
    } catch (err) {
      handleFormError(err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {isEditing ? API_KEY_LABELS.EDIT_API_KEY : API_KEY_LABELS.CREATE_API_KEY}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{API_KEY_LABELS.NAME}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={API_KEY_PLACEHOLDERS.NAME}
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
              name="prefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{API_KEY_LABELS.PREFIX}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={API_KEY_PLACEHOLDERS.PREFIX}
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
              name="expiresIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{API_KEY_LABELS.EXPIRES_IN}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={API_KEY_PLACEHOLDERS.EXPIRES_IN}
                      min="0"
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
              name="metadata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{API_KEY_LABELS.METADATA}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={API_KEY_PLACEHOLDERS.METADATA}
                      rows={3}
                      className="font-mono text-sm"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <PermissionsEditor value={permissions} onChange={setFormPermissions} />

            {isEditing && (
              <>
                <Alert className="mb-4">
                  <AlertDescription>
                    <strong>{API_KEY_LABELS.NOTE}</strong> {API_KEY_LABELS.SERVER_ONLY_FIELDS_NOTE}
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="api-key-remaining">
                    {API_KEY_LABELS.REMAINING}{" "}
                    <span className="text-xs text-muted-foreground">
                      {API_KEY_LABELS.READ_ONLY}
                    </span>
                  </Label>
                  <Input
                    id="api-key-remaining"
                    type="number"
                    value={remaining}
                    readOnly
                    placeholder={API_KEY_PLACEHOLDERS.REMAINING}
                    className="mt-2 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="api-key-refill-amount">
                    {API_KEY_LABELS.REFILL_AMOUNT}{" "}
                    <span className="text-xs text-muted-foreground">
                      {API_KEY_LABELS.READ_ONLY}
                    </span>
                  </Label>
                  <Input
                    id="api-key-refill-amount"
                    type="number"
                    value={refillAmount}
                    readOnly
                    placeholder={API_KEY_PLACEHOLDERS.REFILL_AMOUNT}
                    className="mt-2 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="api-key-refill-interval">
                    {API_KEY_LABELS.REFILL_INTERVAL}{" "}
                    <span className="text-xs text-muted-foreground">
                      {API_KEY_LABELS.READ_ONLY}
                    </span>
                  </Label>
                  <Input
                    id="api-key-refill-interval"
                    type="number"
                    value={refillInterval}
                    readOnly
                    placeholder={API_KEY_PLACEHOLDERS.REFILL_INTERVAL}
                    className="mt-2 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div className="flex items-center gap-2 opacity-50">
                  <Switch id="rateLimitEnabled" checked={rateLimitEnabled} disabled />
                  <Label htmlFor="rateLimitEnabled" className="cursor-not-allowed">
                    {API_KEY_LABELS.RATE_LIMIT_ENABLED}{" "}
                    <span className="text-xs text-muted-foreground">
                      {API_KEY_LABELS.READ_ONLY}
                    </span>
                  </Label>
                </div>

                {rateLimitEnabled && (
                  <>
                    <div>
                      <Label htmlFor="api-key-rate-limit-time-window">
                        {API_KEY_LABELS.RATE_LIMIT_TIME_WINDOW}{" "}
                        <span className="text-xs text-muted-foreground">
                          {API_KEY_LABELS.READ_ONLY}
                        </span>
                      </Label>
                      <Input
                        id="api-key-rate-limit-time-window"
                        type="number"
                        value={rateLimitTimeWindow}
                        readOnly
                        placeholder={API_KEY_PLACEHOLDERS.RATE_LIMIT_TIME_WINDOW}
                        className="mt-2 cursor-not-allowed"
                        disabled
                      />
                    </div>

                    <div>
                      <Label htmlFor="api-key-rate-limit-max">
                        {API_KEY_LABELS.RATE_LIMIT_MAX}{" "}
                        <span className="text-xs text-muted-foreground">
                          {API_KEY_LABELS.READ_ONLY}
                        </span>
                      </Label>
                      <Input
                        id="api-key-rate-limit-max"
                        type="number"
                        value={rateLimitMax}
                        readOnly
                        placeholder={API_KEY_PLACEHOLDERS.RATE_LIMIT_MAX}
                        className="mt-2 cursor-not-allowed"
                        disabled
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? API_KEY_LABELS.SAVING : API_KEY_LABELS.SAVE}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                {API_KEY_LABELS.CANCEL}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
