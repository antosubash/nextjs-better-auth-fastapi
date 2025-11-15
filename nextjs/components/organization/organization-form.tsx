"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

export function OrganizationForm({
  organization,
  onSuccess,
  onCancel,
  hideHeader = false,
}: OrganizationFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [slugError, setSlugError] = useState("");

  const isEditing = !!organization;

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setSlug(organization.slug);
      setDescription(organization.metadata?.description || "");
    }
  }, [organization]);

  const validateName = (value: string): string => {
    if (!value.trim()) {
      return ORGANIZATION_ERRORS.INVALID_NAME;
    }
    if (value.length > 100) {
      return ORGANIZATION_ERRORS.NAME_TOO_LONG;
    }
    return "";
  };

  const validateSlug = (value: string): string => {
    if (!value.trim()) {
      return ORGANIZATION_ERRORS.SLUG_REQUIRED;
    }
    // Slug must be lowercase alphanumeric with hyphens
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(value)) {
      return ORGANIZATION_ERRORS.INVALID_SLUG_FORMAT;
    }
    return "";
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setNameError(validateName(value));
  };

  const handleSlugChange = (value: string) => {
    // Auto-convert to lowercase
    const lowerValue = value.toLowerCase();
    setSlug(lowerValue);
    setSlugError(validateSlug(lowerValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate form
    const nameErr = validateName(name);
    const slugErr = validateSlug(slug);
    setNameError(nameErr);
    setSlugError(slugErr);

    if (nameErr || slugErr) {
      return;
    }

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
    <div
      className={
        hideHeader
          ? "space-y-4"
          : "bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      }
    >
      {!hideHeader && (
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
      )}

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
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={ORGANIZATION_PLACEHOLDERS.NAME}
            required
            maxLength={100}
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
              nameError
                ? "border-red-300 dark:border-red-700 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-700 focus:ring-gray-900 dark:focus:ring-white"
            }`}
          />
          {nameError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{nameError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {ORGANIZATION_LABELS.SLUG}
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder={ORGANIZATION_PLACEHOLDERS.SLUG}
            required
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
              slugError
                ? "border-red-300 dark:border-red-700 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-700 focus:ring-gray-900 dark:focus:ring-white"
            }`}
          />
          {slugError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{slugError}</p>}
          {!slugError && slug && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {ORGANIZATION_PLACEHOLDERS.SLUG_HINT}
            </p>
          )}
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
          <Button
            type="submit"
            disabled={isLoading || !!nameError || !!slugError}
            className="flex-1"
          >
            {isLoading ? ORGANIZATION_LABELS.SAVING : ORGANIZATION_LABELS.SAVE}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {ORGANIZATION_LABELS.CANCEL}
          </Button>
        </div>
      </form>
    </div>
  );
}
