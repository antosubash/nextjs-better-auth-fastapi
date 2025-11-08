"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import {
  ORGANIZATION_LABELS,
  ORGANIZATION_PLACEHOLDERS,
  ORGANIZATION_ERRORS,
} from "@/lib/constants";
import { X } from "lucide-react";

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
}

export function OrganizationForm({
  organization,
  onSuccess,
  onCancel,
}: OrganizationFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!organization;

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setSlug(organization.slug);
      setDescription(organization.metadata?.description || "");
    }
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isEditing) {
        const result = await authClient.organization.update({
          organizationId: organization.id,
          data: {
            name,
            slug,
            metadata: description ? { description } : undefined,
          },
        });

        if (result.error) {
          setError(result.error.message || ORGANIZATION_ERRORS.UPDATE_FAILED);
        } else {
          onSuccess();
        }
      } else {
        const result = await authClient.organization.create({
          name,
          slug,
          metadata: description ? { description } : undefined,
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEditing
            ? ORGANIZATION_LABELS.EDIT_ORGANIZATION
            : ORGANIZATION_LABELS.CREATE_ORGANIZATION}
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
            {ORGANIZATION_LABELS.NAME}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={ORGANIZATION_PLACEHOLDERS.NAME}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {ORGANIZATION_LABELS.SLUG}
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={ORGANIZATION_PLACEHOLDERS.SLUG}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {ORGANIZATION_LABELS.DESCRIPTION}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={ORGANIZATION_PLACEHOLDERS.DESCRIPTION}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : ORGANIZATION_LABELS.SAVE}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ORGANIZATION_LABELS.CANCEL}
          </button>
        </div>
      </form>
    </div>
  );
}
