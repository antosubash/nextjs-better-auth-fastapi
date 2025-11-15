"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {API_KEY_LABELS.VIEW_DETAILS}
          </h2>
          <button
            type="button"
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

        {isLoading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            {API_KEY_LABELS.LOADING}
          </div>
        ) : apiKey ? (
          <div className="space-y-4">
            <div>
              <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {API_KEY_LABELS.NAME}
              </div>
              <p className="text-gray-900 dark:text-white">{apiKey.name || "N/A"}</p>
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {API_KEY_LABELS.PREFIX}
              </div>
              <p className="text-gray-900 dark:text-white">{apiKey.prefix || "N/A"}</p>
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {API_KEY_LABELS.STATUS}
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  apiKey.enabled
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                    : "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200"
                }`}
              >
                {apiKey.enabled ? API_KEY_LABELS.ENABLED : API_KEY_LABELS.DISABLED}
              </span>
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {API_KEY_LABELS.CREATED_AT}
              </div>
              <p className="text-gray-900 dark:text-white">{formatDate(apiKey.createdAt)}</p>
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {API_KEY_LABELS.EXPIRES_AT}
              </div>
              <p className="text-gray-900 dark:text-white">{formatDate(apiKey.expiresAt)}</p>
            </div>

            {apiKey.remaining !== undefined && (
              <div>
                <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {API_KEY_LABELS.REMAINING}
                </div>
                <p className="text-gray-900 dark:text-white">{apiKey.remaining}</p>
              </div>
            )}

            {apiKey.refillAmount !== undefined && (
              <div>
                <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {API_KEY_LABELS.REFILL_AMOUNT}
                </div>
                <p className="text-gray-900 dark:text-white">{apiKey.refillAmount}</p>
              </div>
            )}

            {apiKey.refillInterval !== undefined && (
              <div>
                <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {API_KEY_LABELS.REFILL_INTERVAL}
                </div>
                <p className="text-gray-900 dark:text-white">{apiKey.refillInterval} ms</p>
              </div>
            )}

            {apiKey.rateLimitEnabled && (
              <>
                <div>
                  <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {API_KEY_LABELS.RATE_LIMIT_TIME_WINDOW}
                  </div>
                  <p className="text-gray-900 dark:text-white">{apiKey.rateLimitTimeWindow} ms</p>
                </div>

                <div>
                  <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {API_KEY_LABELS.RATE_LIMIT_MAX}
                  </div>
                  <p className="text-gray-900 dark:text-white">{apiKey.rateLimitMax}</p>
                </div>
              </>
            )}

            <div>
              <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {API_KEY_LABELS.METADATA}
              </div>
              <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-900 dark:text-white overflow-x-auto">
                {formatJson(apiKey.metadata)}
              </pre>
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {API_KEY_LABELS.PERMISSIONS}
              </div>
              <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-900 dark:text-white overflow-x-auto">
                {formatJson(apiKey.permissions)}
              </pre>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            {API_KEY_LABELS.CANCEL}
          </button>
        </div>
      </div>
    </div>
  );
}
