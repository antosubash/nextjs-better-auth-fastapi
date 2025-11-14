"use client";

import { useState, useEffect } from "react";
import {
  API_KEY_LABELS,
  API_KEY_PLACEHOLDERS,
  API_KEY_ERRORS,
  API_KEY_CONFIG,
} from "@/lib/constants";
import { X } from "lucide-react";
import { PermissionsEditor } from "./permissions-editor";

interface ApiKey {
  id: string;
  name?: string | null;
  prefix?: string | null;
  expiresAt?: Date | number | null;
  metadata?: Record<string, unknown> | null;
  permissions?: Record<string, string[]> | null;
  enabled?: boolean;
  remaining?: number | null;
  refillAmount?: number | null;
  refillInterval?: number | null;
  rateLimitEnabled?: boolean;
  rateLimitTimeWindow?: number | null;
  rateLimitMax?: number | null;
}

interface ApiKeyFormProps {
  apiKey?: ApiKey | null;
  onSuccess: (createdKey?: string) => void;
  onCancel: () => void;
}

export function ApiKeyForm({ apiKey, onSuccess, onCancel }: ApiKeyFormProps) {
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [expiresIn, setExpiresIn] = useState("");
  const [metadata, setMetadata] = useState("");
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [remaining, setRemaining] = useState("");
  const [refillAmount, setRefillAmount] = useState("");
  const [refillInterval, setRefillInterval] = useState("");
  const [rateLimitEnabled, setRateLimitEnabled] = useState(false);
  const [rateLimitTimeWindow, setRateLimitTimeWindow] = useState("");
  const [rateLimitMax, setRateLimitMax] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!apiKey;

  useEffect(() => {
    if (apiKey) {
      setName(apiKey.name || "");
      setPrefix(apiKey.prefix || "");
      if (apiKey.expiresAt) {
        const expiresDate = new Date(apiKey.expiresAt);
        const now = new Date();
        const daysUntilExpiry = Math.ceil(
          (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        setExpiresIn(daysUntilExpiry > 0 ? daysUntilExpiry.toString() : "");
      }
      setMetadata(apiKey.metadata ? JSON.stringify(apiKey.metadata, null, 2) : "");
      setPermissions(apiKey.permissions || {});
      setRemaining(apiKey.remaining?.toString() || "");
      setRefillAmount(apiKey.refillAmount?.toString() || "");
      setRefillInterval(apiKey.refillInterval?.toString() || "");
      setRateLimitEnabled(apiKey.rateLimitEnabled || false);
      setRateLimitTimeWindow(apiKey.rateLimitTimeWindow?.toString() || "");
      setRateLimitMax(apiKey.rateLimitMax?.toString() || "");
    }
  }, [apiKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let parsedMetadata: Record<string, unknown> | undefined = undefined;

    if (metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch {
        setError(API_KEY_ERRORS.INVALID_METADATA);
        return;
      }
    }

    const parsedPermissions: Record<string, string[]> | undefined =
      Object.keys(permissions).length > 0 ? permissions : undefined;

    setIsLoading(true);

    try {
      if (isEditing) {
        const updateData: {
          keyId: string;
          name?: string;
          expiresIn?: number;
          prefix?: string;
          metadata?: Record<string, unknown>;
          permissions?: Record<string, string[]>;
          enabled?: boolean;
        } = {
          keyId: apiKey.id,
          name: name || undefined,
        };

        if (expiresIn) {
          const days = parseInt(expiresIn);
          if (isNaN(days) || days < 0) {
            setError(API_KEY_ERRORS.INVALID_EXPIRATION);
            setIsLoading(false);
            return;
          }
          updateData.expiresIn = days * 24 * 60 * 60;
        }

        if (prefix) updateData.prefix = prefix;
        if (parsedMetadata) updateData.metadata = parsedMetadata;
        if (parsedPermissions) updateData.permissions = parsedPermissions;
        // Note: remaining, refillAmount, refillInterval, rateLimitEnabled,
        // rateLimitTimeWindow, and rateLimitMax are server-only properties
        // and cannot be set from the client

        const response = await fetch(`/api/api-keys/${apiKey.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });
        const result = await response.json();

        if (!response.ok || result.error) {
          setError(result.error || API_KEY_ERRORS.UPDATE_FAILED);
        } else {
          onSuccess();
        }
      } else {
        const createData: {
          name?: string;
          expiresIn?: number;
          prefix?: string;
          metadata?: Record<string, unknown>;
          permissions?: Record<string, string[]>;
        } = {
          name: name || undefined,
        };

        if (expiresIn) {
          const days = parseInt(expiresIn);
          if (isNaN(days) || days < 0) {
            setError(API_KEY_ERRORS.INVALID_EXPIRATION);
            setIsLoading(false);
            return;
          }
          createData.expiresIn = days * 24 * 60 * 60;
        } else {
          createData.expiresIn = API_KEY_CONFIG.DEFAULT_EXPIRATION_DAYS * 24 * 60 * 60;
        }

        if (prefix) createData.prefix = prefix;
        if (parsedMetadata) createData.metadata = parsedMetadata;
        if (parsedPermissions) createData.permissions = parsedPermissions;

        const response = await fetch("/api/api-keys", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createData),
        });
        const result = await response.json();

        if (!response.ok || result.error) {
          setError(result.error || API_KEY_ERRORS.CREATE_FAILED);
        } else {
          onSuccess(result.data?.key);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : isEditing
            ? API_KEY_ERRORS.UPDATE_FAILED
            : API_KEY_ERRORS.CREATE_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEditing ? API_KEY_LABELS.EDIT_API_KEY : API_KEY_LABELS.CREATE_API_KEY}
        </h2>
        <button
          onClick={onCancel}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {API_KEY_LABELS.NAME}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={API_KEY_PLACEHOLDERS.NAME}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {API_KEY_LABELS.PREFIX}
          </label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder={API_KEY_PLACEHOLDERS.PREFIX}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {API_KEY_LABELS.EXPIRES_IN}
          </label>
          <input
            type="number"
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
            placeholder={API_KEY_PLACEHOLDERS.EXPIRES_IN}
            min="0"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {API_KEY_LABELS.METADATA}
          </label>
          <textarea
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            placeholder={API_KEY_PLACEHOLDERS.METADATA}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white font-mono text-sm"
          />
        </div>

        <PermissionsEditor value={permissions} onChange={setPermissions} />

        {isEditing && (
          <>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> The following fields are read-only and can only be modified
                from the server: Remaining, Refill Amount, Refill Interval, and Rate Limiting
                settings.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {API_KEY_LABELS.REMAINING}{" "}
                <span className="text-xs text-gray-500">(read-only)</span>
              </label>
              <input
                type="number"
                value={remaining}
                readOnly
                placeholder={API_KEY_PLACEHOLDERS.REMAINING}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {API_KEY_LABELS.REFILL_AMOUNT}{" "}
                <span className="text-xs text-gray-500">(read-only)</span>
              </label>
              <input
                type="number"
                value={refillAmount}
                readOnly
                placeholder={API_KEY_PLACEHOLDERS.REFILL_AMOUNT}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {API_KEY_LABELS.REFILL_INTERVAL}{" "}
                <span className="text-xs text-gray-500">(read-only)</span>
              </label>
              <input
                type="number"
                value={refillInterval}
                readOnly
                placeholder={API_KEY_PLACEHOLDERS.REFILL_INTERVAL}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            <div className="flex items-center gap-2 opacity-50">
              <input
                type="checkbox"
                id="rateLimitEnabled"
                checked={rateLimitEnabled}
                disabled
                className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900 dark:focus:ring-white cursor-not-allowed"
              />
              <label
                htmlFor="rateLimitEnabled"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {API_KEY_LABELS.RATE_LIMIT_ENABLED}{" "}
                <span className="text-xs text-gray-500">(read-only)</span>
              </label>
            </div>

            {rateLimitEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {API_KEY_LABELS.RATE_LIMIT_TIME_WINDOW}{" "}
                    <span className="text-xs text-gray-500">(read-only)</span>
                  </label>
                  <input
                    type="number"
                    value={rateLimitTimeWindow}
                    readOnly
                    placeholder={API_KEY_PLACEHOLDERS.RATE_LIMIT_TIME_WINDOW}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {API_KEY_LABELS.RATE_LIMIT_MAX}{" "}
                    <span className="text-xs text-gray-500">(read-only)</span>
                  </label>
                  <input
                    type="number"
                    value={rateLimitMax}
                    readOnly
                    placeholder={API_KEY_PLACEHOLDERS.RATE_LIMIT_MAX}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </>
            )}
          </>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : API_KEY_LABELS.SAVE}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {API_KEY_LABELS.CANCEL}
          </button>
        </div>
      </form>
    </div>
  );
}
