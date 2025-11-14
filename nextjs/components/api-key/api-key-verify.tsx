"use client";

import { useState } from "react";
import { API_KEY_LABELS, API_KEY_PLACEHOLDERS, API_KEY_ERRORS } from "@/lib/constants";
import { X, CheckCircle, XCircle } from "lucide-react";

interface ApiKeyVerifyProps {
  onClose: () => void;
}

export function ApiKeyVerify({ onClose }: ApiKeyVerifyProps) {
  const [key, setKey] = useState("");
  const [permissions, setPermissions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  interface VerifyResult {
    valid: boolean;
    error: { message: string; code: string } | null;
    key: {
      name?: string;
      prefix?: string;
      enabled?: boolean;
      permissions?: Record<string, string[]>;
    } | null;
  }

  const [result, setResult] = useState<VerifyResult | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setIsLoading(true);

    try {
      let parsedPermissions: Record<string, string[]> | undefined = undefined;

      if (permissions.trim()) {
        try {
          parsedPermissions = JSON.parse(permissions);
        } catch {
          setError(API_KEY_ERRORS.INVALID_PERMISSIONS);
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch("/api/api-keys/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key,
          permissions: parsedPermissions,
        }),
      });
      const verifyResult = await response.json();

      if (!response.ok || verifyResult.error) {
        setError(verifyResult.error || API_KEY_ERRORS.VERIFY_FAILED);
      } else if (verifyResult.data) {
        setResult(verifyResult.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : API_KEY_ERRORS.VERIFY_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {API_KEY_LABELS.VERIFY_API_KEY}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {API_KEY_LABELS.KEY_TO_VERIFY}
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={API_KEY_PLACEHOLDERS.KEY_TO_VERIFY}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {API_KEY_LABELS.VERIFY_PERMISSIONS}
            </label>
            <textarea
              value={permissions}
              onChange={(e) => setPermissions(e.target.value)}
              placeholder={API_KEY_PLACEHOLDERS.VERIFY_PERMISSIONS}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || !key.trim()}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : API_KEY_LABELS.VERIFY_KEY}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {API_KEY_LABELS.CANCEL}
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
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
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Error:</p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {result.error.message} ({result.error.code})
                </p>
              </div>
            )}

            {result.key && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Key Details:</p>
                <div className="text-sm text-gray-900 dark:text-white">
                  <p>
                    <span className="font-medium">Name:</span> {result.key.name || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Prefix:</span> {result.key.prefix || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Enabled:</span>{" "}
                    {result.key.enabled ? "Yes" : "No"}
                  </p>
                  {result.key.permissions && (
                    <div>
                      <span className="font-medium">Permissions:</span>
                      <pre className="mt-1 p-2 bg-white dark:bg-gray-800 rounded text-xs overflow-x-auto">
                        {formatJson(result.key.permissions)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
