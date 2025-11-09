"use client";

import { useState, useEffect } from "react";
import {
  API_KEY_LABELS,
  API_KEY_ERRORS,
  API_KEY_SUCCESS,
} from "@/lib/constants";
import { ApiKeyForm } from "./api-key-form";
import { ApiKeyActions } from "./api-key-actions";
import { ApiKeyDetails } from "./api-key-details";
import { ApiKeyVerify } from "./api-key-verify";
import { Search, Plus, Key, Copy, Check, Trash2 } from "lucide-react";

interface ApiKey {
  id: string;
  name?: string | null;
  prefix?: string | null;
  enabled?: boolean;
  expiresAt?: Date | number | null;
  createdAt: Date | number;
}

export function ApiKeyList() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [viewingApiKeyId, setViewingApiKeyId] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  const loadApiKeys = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/api-keys");
      const result = await response.json();

      if (!response.ok || result.error) {
        setError(
          result.error || API_KEY_ERRORS.LOAD_API_KEYS_FAILED,
        );
      } else if (result.data) {
        const keys = Array.isArray(result.data) ? result.data : [];
        setApiKeys(
          keys.map((key: ApiKey) => ({
            ...key,
            createdAt:
              key.createdAt instanceof Date
                ? key.createdAt.getTime()
                : typeof key.createdAt === "number"
                  ? key.createdAt
                  : Date.now(),
          })),
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : API_KEY_ERRORS.LOAD_API_KEYS_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleApiKeyCreated = (createdKey?: string) => {
    setShowCreateForm(false);
    if (createdKey) {
      setNewlyCreatedKey(createdKey);
    }
    setSuccess(API_KEY_SUCCESS.API_KEY_CREATED);
    setTimeout(() => setSuccess(""), 3000);
    loadApiKeys();
  };

  const handleApiKeyUpdated = () => {
    setEditingApiKey(null);
    setSuccess(API_KEY_SUCCESS.API_KEY_UPDATED);
    setTimeout(() => setSuccess(""), 3000);
    loadApiKeys();
  };

  const handleApiKeyDeleted = () => {
    setSuccess(API_KEY_SUCCESS.API_KEY_DELETED);
    setTimeout(() => setSuccess(""), 3000);
    loadApiKeys();
  };

  const handleActionSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
    loadApiKeys();
  };

  const handleDeleteExpired = async () => {
    if (!confirm(API_KEY_LABELS.CONFIRM_DELETE_EXPIRED)) {
      return;
    }

    try {
      const response = await fetch("/api/api-keys/expired", {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        setError(
          result.error || API_KEY_ERRORS.DELETE_EXPIRED_FAILED,
        );
      } else {
        setSuccess(API_KEY_SUCCESS.EXPIRED_DELETED);
        setTimeout(() => setSuccess(""), 3000);
        loadApiKeys();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : API_KEY_ERRORS.DELETE_EXPIRED_FAILED;
      setError(errorMessage);
    }
  };

  const handleCopyKey = async () => {
    if (newlyCreatedKey) {
      try {
        await navigator.clipboard.writeText(newlyCreatedKey);
        setKeyCopied(true);
        setTimeout(() => setKeyCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy key:", err);
      }
    }
  };

  const filteredApiKeys = apiKeys.filter(
    (key) =>
      key.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      key.prefix?.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const formatDate = (timestamp: number | Date) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (expiresAt: Date | number | null | undefined) => {
    if (!expiresAt) return false;
    const expiryDate =
      expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    return expiryDate < new Date();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="w-8 h-8 text-gray-900 dark:text-white" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {API_KEY_LABELS.TITLE}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowVerifyModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            {API_KEY_LABELS.VERIFY_API_KEY}
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <Plus className="w-5 h-5" />
            {API_KEY_LABELS.CREATE_API_KEY}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
          {success}
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6">
          <ApiKeyForm
            onSuccess={handleApiKeyCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {editingApiKey && (
        <div className="mb-6">
          <ApiKeyForm
            apiKey={editingApiKey}
            onSuccess={handleApiKeyUpdated}
            onCancel={() => setEditingApiKey(null)}
          />
        </div>
      )}

      {viewingApiKeyId && (
        <ApiKeyDetails
          apiKeyId={viewingApiKeyId}
          onClose={() => setViewingApiKeyId(null)}
        />
      )}

      {showVerifyModal && (
        <ApiKeyVerify onClose={() => setShowVerifyModal(false)} />
      )}

      {newlyCreatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {API_KEY_SUCCESS.API_KEY_CREATED}
            </h2>
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200">
              {API_KEY_LABELS.KEY_WARNING}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your API Key:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newlyCreatedKey}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                />
                <button
                  onClick={handleCopyKey}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 flex items-center gap-2"
                >
                  {keyCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      {API_KEY_LABELS.KEY_COPIED}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {API_KEY_LABELS.COPY_KEY}
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                {API_KEY_LABELS.CANCEL}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={API_KEY_LABELS.SEARCH_API_KEYS}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>
        <button
          onClick={handleDeleteExpired}
          className="flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          {API_KEY_LABELS.DELETE_ALL_EXPIRED}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            {API_KEY_LABELS.LOADING}
          </div>
        ) : filteredApiKeys.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            {API_KEY_LABELS.NO_API_KEYS}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {API_KEY_LABELS.NAME}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {API_KEY_LABELS.PREFIX}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {API_KEY_LABELS.STATUS}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {API_KEY_LABELS.EXPIRES_AT}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {API_KEY_LABELS.CREATED_AT}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {API_KEY_LABELS.ACTIONS}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredApiKeys.map((key) => {
                  const expired = isExpired(key.expiresAt);
                  return (
                    <tr
                      key={key.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {key.name || "Unnamed"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {key.prefix || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {expired ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                            {API_KEY_LABELS.EXPIRED}
                          </span>
                        ) : key.enabled ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                            {API_KEY_LABELS.ENABLED}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200">
                            {API_KEY_LABELS.DISABLED}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {key.expiresAt
                          ? formatDate(
                              key.expiresAt instanceof Date
                                ? key.expiresAt.getTime()
                                : typeof key.expiresAt === "number"
                                  ? key.expiresAt
                                  : new Date(key.expiresAt).getTime(),
                            )
                          : "Never"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(key.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm relative">
                        <ApiKeyActions
                          apiKey={key}
                          onEdit={() => setEditingApiKey(key)}
                          onDelete={handleApiKeyDeleted}
                          onViewDetails={() => setViewingApiKeyId(key.id)}
                          onActionSuccess={handleActionSuccess}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

