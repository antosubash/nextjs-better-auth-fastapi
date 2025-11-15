"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { API_KEY_ERRORS, API_KEY_LABELS } from "@/lib/constants";

interface ApiKeyDetailsProps {
  apiKeyId: string;
  onClose: () => void;
}

interface ApiKeyData {
  id: string;
  name?: string | null;
  prefix?: string | null;
  enabled?: boolean;
  createdAt?: Date | number | string;
  expiresAt?: Date | number | string | null;
  remaining?: number | null;
  refillAmount?: number | null;
  refillInterval?: number | null;
  rateLimitEnabled?: boolean;
  rateLimitTimeWindow?: number | null;
  rateLimitMax?: number | null;
  metadata?: Record<string, unknown> | null;
  permissions?: Record<string, string[]> | null;
}

export function ApiKeyDetails({ apiKeyId, onClose }: ApiKeyDetailsProps) {
  const [apiKey, setApiKey] = useState<ApiKeyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadApiKey = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/api-keys/${apiKeyId}`);
        const result = await response.json();

        if (!response.ok || result.error) {
          setError(result.error || API_KEY_ERRORS.LOAD_API_KEY_FAILED);
        } else if (result.data) {
          setApiKey(result.data);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : API_KEY_ERRORS.LOAD_API_KEY_FAILED;
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadApiKey();
  }, [apiKeyId]);

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
        ) : apiKey ? (
          <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {API_KEY_LABELS.NAME}
                </div>
                <p className="text-sm">{apiKey.name || "N/A"}</p>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {API_KEY_LABELS.PREFIX}
                </div>
                <p className="text-sm font-mono">{apiKey.prefix || "N/A"}</p>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {API_KEY_LABELS.STATUS}
                </div>
                <Badge variant={apiKey.enabled ? "default" : "secondary"}>
                  {apiKey.enabled ? API_KEY_LABELS.ENABLED : API_KEY_LABELS.DISABLED}
                </Badge>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {API_KEY_LABELS.CREATED_AT}
                </div>
                <p className="text-sm">{formatDate(apiKey.createdAt)}</p>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {API_KEY_LABELS.EXPIRES_AT}
                </div>
                <p className="text-sm">{formatDate(apiKey.expiresAt)}</p>
              </div>

              {apiKey.remaining !== undefined && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {API_KEY_LABELS.REMAINING}
                  </div>
                  <p className="text-sm">{apiKey.remaining}</p>
                </div>
              )}

              {apiKey.refillAmount !== undefined && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {API_KEY_LABELS.REFILL_AMOUNT}
                  </div>
                  <p className="text-sm">{apiKey.refillAmount}</p>
                </div>
              )}

              {apiKey.refillInterval !== undefined && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {API_KEY_LABELS.REFILL_INTERVAL}
                  </div>
                  <p className="text-sm">{apiKey.refillInterval} ms</p>
                </div>
              )}

              {apiKey.rateLimitEnabled && (
                <>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {API_KEY_LABELS.RATE_LIMIT_TIME_WINDOW}
                    </div>
                    <p className="text-sm">{apiKey.rateLimitTimeWindow} ms</p>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {API_KEY_LABELS.RATE_LIMIT_MAX}
                    </div>
                    <p className="text-sm">{apiKey.rateLimitMax}</p>
                  </div>
                </>
              )}

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {API_KEY_LABELS.METADATA}
                </div>
                <pre className="p-3 bg-muted rounded-lg text-sm overflow-x-auto border">
                  {formatJson(apiKey.metadata)}
                </pre>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {API_KEY_LABELS.PERMISSIONS}
                </div>
                <pre className="p-3 bg-muted rounded-lg text-sm overflow-x-auto border">
                  {formatJson(apiKey.permissions)}
                </pre>
              </div>
            </div>
          </ScrollArea>
        ) : null}

        <div className="flex justify-end mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            {API_KEY_LABELS.CANCEL}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
