"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { API_KEY_ERRORS, API_KEY_LABELS, API_KEY_PLACEHOLDERS } from "@/lib/constants";
import { useVerifyApiKey } from "@/lib/hooks/api/use-api-keys";
import type { VerifyApiKeyResponse } from "@/lib/api/api-keys";

interface ApiKeyVerifyProps {
  onClose: () => void;
}

export function ApiKeyVerify({ onClose }: ApiKeyVerifyProps) {
  const [key, setKey] = useState("");
  const [permissions, setPermissions] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<VerifyApiKeyResponse | null>(null);

  const verifyMutation = useVerifyApiKey();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    let parsedPermissions: Record<string, string[]> | undefined;

    if (permissions.trim()) {
      try {
        parsedPermissions = JSON.parse(permissions);
      } catch {
        setError(API_KEY_ERRORS.INVALID_PERMISSIONS);
        return;
      }
    }

    try {
      const response = await verifyMutation.mutateAsync({
        key,
        permissions: parsedPermissions,
      });
      if (response.data) {
        setResult(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : API_KEY_ERRORS.VERIFY_FAILED;
      setError(errorMessage);
    }
  };

  const formatJson = (obj: Record<string, string[]> | null | undefined) => {
    if (!obj) return "None";
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{API_KEY_LABELS.VERIFY_API_KEY}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verify-api-key">{API_KEY_LABELS.KEY_TO_VERIFY}</Label>
            <Input
              id="verify-api-key"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={API_KEY_PLACEHOLDERS.KEY_TO_VERIFY}
              required
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="verify-permissions">{API_KEY_LABELS.VERIFY_PERMISSIONS}</Label>
            <Textarea
              id="verify-permissions"
              value={permissions}
              onChange={(e) => setPermissions(e.target.value)}
              placeholder={API_KEY_PLACEHOLDERS.VERIFY_PERMISSIONS}
              rows={3}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={verifyMutation.isPending || !key.trim()}
              className="flex-1"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {API_KEY_LABELS.VERIFYING}
                </>
              ) : (
                API_KEY_LABELS.VERIFY_KEY
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={verifyMutation.isPending}
            >
              {API_KEY_LABELS.CANCEL}
            </Button>
          </div>
        </form>

        {result && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              {result.valid ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {API_KEY_LABELS.VALID}
                  </h3>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                    {API_KEY_LABELS.INVALID}
                  </h3>
                </>
              )}
            </div>

            {result.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  <span className="font-medium">{API_KEY_LABELS.ERROR}</span> {result.error.message}{" "}
                  ({result.error.code})
                </AlertDescription>
              </Alert>
            )}

            {result.key && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{API_KEY_LABELS.KEY_DETAILS}</p>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">{API_KEY_LABELS.NAME}:</span>{" "}
                    {result.key.name || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">{API_KEY_LABELS.PREFIX}:</span>{" "}
                    {result.key.prefix || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">{API_KEY_LABELS.ENABLED}:</span>{" "}
                    {result.key.enabled ? API_KEY_LABELS.YES : API_KEY_LABELS.NO}
                  </p>
                  {result.key.permissions && (
                    <div>
                      <span className="font-medium">{API_KEY_LABELS.PERMISSIONS}:</span>
                      <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto border">
                        {formatJson(result.key.permissions)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
