"use client";

import type React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { API_KEY_ERRORS, API_KEY_LABELS } from "@/lib/constants";
import { useApiKeyDetails } from "@/lib/hooks/api/use-api-keys";

interface ApiKeyDetailsProps {
  apiKeyId: string;
  onClose: () => void;
}

export function ApiKeyDetails({ apiKeyId, onClose }: ApiKeyDetailsProps) {
  const { data: apiKey, isLoading, error: queryError } = useApiKeyDetails(apiKeyId);
  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? API_KEY_ERRORS.LOAD_API_KEY_FAILED
        : "";

  const formatDate = (date: Date | number | string | null | undefined) => {
    if (!date) return "Never";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : new Date(date);
      return dateObj.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatJson = (
    obj: Record<string, unknown> | Record<string, string[]> | null | undefined
  ) => {
    if (!obj) return "None";
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const renderDetailField = (label: string, value: React.ReactNode) => {
    return (
      <div>
        <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
    );
  };

  const renderApiKeyDetails = () => {
    if (!apiKey) return null;

    return (
      <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
        <div className="space-y-4">
          {renderDetailField(API_KEY_LABELS.NAME, apiKey.name || "N/A")}
          {renderDetailField(
            API_KEY_LABELS.PREFIX,
            <span className="font-mono">{apiKey.prefix || "N/A"}</span>
          )}
          {renderDetailField(
            API_KEY_LABELS.STATUS,
            <Badge variant={apiKey.enabled ? "default" : "secondary"}>
              {apiKey.enabled ? API_KEY_LABELS.ENABLED : API_KEY_LABELS.DISABLED}
            </Badge>
          )}
          {renderDetailField(API_KEY_LABELS.CREATED_AT, formatDate(apiKey.createdAt))}
          {renderDetailField(API_KEY_LABELS.EXPIRES_AT, formatDate(apiKey.expiresAt))}
          {apiKey.remaining !== undefined &&
            renderDetailField(API_KEY_LABELS.REMAINING, apiKey.remaining)}
          {apiKey.refillAmount !== undefined &&
            renderDetailField(API_KEY_LABELS.REFILL_AMOUNT, apiKey.refillAmount)}
          {apiKey.refillInterval !== undefined &&
            renderDetailField(API_KEY_LABELS.REFILL_INTERVAL, `${apiKey.refillInterval} ms`)}
          {apiKey.rateLimitEnabled && (
            <>
              {renderDetailField(
                API_KEY_LABELS.RATE_LIMIT_TIME_WINDOW,
                `${apiKey.rateLimitTimeWindow} ms`
              )}
              {renderDetailField(API_KEY_LABELS.RATE_LIMIT_MAX, apiKey.rateLimitMax)}
            </>
          )}
          {renderDetailField(
            API_KEY_LABELS.METADATA,
            <pre className="p-3 bg-muted rounded-lg text-sm overflow-x-auto border">
              {formatJson(apiKey.metadata)}
            </pre>
          )}
          {renderDetailField(
            API_KEY_LABELS.PERMISSIONS,
            <pre className="p-3 bg-muted rounded-lg text-sm overflow-x-auto border">
              {formatJson(apiKey.permissions)}
            </pre>
          )}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{API_KEY_LABELS.VIEW_DETAILS}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          renderApiKeyDetails()
        )}

        <div className="flex justify-end mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            {API_KEY_LABELS.CANCEL}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
