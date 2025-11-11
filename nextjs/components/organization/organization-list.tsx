"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import {
  ORGANIZATION_LABELS,
  ORGANIZATION_ERRORS,
  ORGANIZATION_SUCCESS,
} from "@/lib/constants";
import { OrganizationForm } from "./organization-form";
import { OrganizationActions } from "./organization-actions";
import { Plus, Building2 } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { useSearch } from "@/hooks/organization/use-search";
import { useSuccessMessage } from "@/hooks/organization/use-success-message";
import { useErrorMessage } from "@/hooks/organization/use-error-message";
import { SearchInput } from "./shared/search-input";
import { SuccessMessage } from "./shared/success-message";
import { ErrorMessage } from "./shared/error-message";
import { LoadingState } from "./shared/loading-state";
import { EmptyState } from "./shared/empty-state";
import {
  normalizeOrganizations,
  extractOrganizations,
} from "@/lib/utils/organization-data";
import type { NormalizedOrganization } from "@/lib/utils/organization-types";

export function OrganizationList() {
  const router = useRouter();
  const pathname = usePathname();
  const isAdminContext = pathname?.startsWith("/admin") ?? false;
  const [organizations, setOrganizations] = useState<NormalizedOrganization[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOrganization, setEditingOrganization] =
    useState<NormalizedOrganization | null>(null);

  const { searchValue, handleSearch } = useSearch();
  const { success, showSuccess, clearSuccess } = useSuccessMessage();
  const { error, showError, clearError } = useErrorMessage();

  const loadOrganizations = async () => {
    setIsLoading(true);
    clearError();
    try {
      if (isAdminContext) {
        const response = await fetch("/api/admin/organizations");
        if (!response.ok) {
          const errorData = await response.json();
          showError(
            errorData.error || ORGANIZATION_ERRORS.LOAD_ORGANIZATIONS_FAILED,
          );
          return;
        }
        const data = await response.json();
        const orgs = data.organizations || [];
        setOrganizations(normalizeOrganizations(orgs));
      } else {
        const listResult = await authClient.organization.list();
        if (listResult.error) {
          showError(
            listResult.error.message ||
              ORGANIZATION_ERRORS.LOAD_ORGANIZATIONS_FAILED,
          );
        } else if (listResult.data) {
          const normalizedOrgs = normalizeOrganizations(
            extractOrganizations(listResult.data),
          );
          setOrganizations(normalizedOrgs);
        }
      }

      const sessionResult = await authClient.getSession();
      if (sessionResult.data?.session?.activeOrganizationId) {
        setActiveOrganizationId(
          sessionResult.data.session.activeOrganizationId,
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : ORGANIZATION_ERRORS.LOAD_ORGANIZATIONS_FAILED;
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminContext]);

  const handleOrganizationCreated = () => {
    setShowCreateForm(false);
    showSuccess(ORGANIZATION_SUCCESS.ORGANIZATION_CREATED);
    loadOrganizations();
  };

  const handleOrganizationUpdated = () => {
    setEditingOrganization(null);
    showSuccess(ORGANIZATION_SUCCESS.ORGANIZATION_UPDATED);
    loadOrganizations();
  };

  const handleOrganizationDeleted = () => {
    showSuccess(ORGANIZATION_SUCCESS.ORGANIZATION_DELETED);
    loadOrganizations();
  };

  const handleActionSuccess = (message: string) => {
    showSuccess(message);
    loadOrganizations();
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchValue.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-gray-900 dark:text-white" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {ORGANIZATION_LABELS.TITLE}
          </h1>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          <Plus className="w-5 h-5" />
          {ORGANIZATION_LABELS.CREATE_ORGANIZATION}
        </button>
      </div>

      <ErrorMessage message={error} onDismiss={clearError} className="mb-4" />
      <SuccessMessage message={success} onDismiss={clearSuccess} className="mb-4" />

      {showCreateForm && (
        <div className="mb-6">
          <OrganizationForm
            onSuccess={handleOrganizationCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {editingOrganization && (
        <div className="mb-6">
          <OrganizationForm
            organization={editingOrganization}
            onSuccess={handleOrganizationUpdated}
            onCancel={() => setEditingOrganization(null)}
          />
        </div>
      )}

      <div className="mb-4">
        <SearchInput
          placeholder={ORGANIZATION_LABELS.SEARCH_ORGANIZATIONS}
          value={searchValue}
          onChange={handleSearch}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <LoadingState message={ORGANIZATION_LABELS.LOADING} />
        ) : filteredOrganizations.length === 0 ? (
          <EmptyState message={ORGANIZATION_LABELS.NO_ORGANIZATIONS} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {ORGANIZATION_LABELS.NAME}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {ORGANIZATION_LABELS.SLUG}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {ORGANIZATION_LABELS.CREATED_AT}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {ORGANIZATION_LABELS.STATUS}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {ORGANIZATION_LABELS.ACTIONS}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrganizations.map((org) => {
                  const isActive = org.id === activeOrganizationId;
                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/organizations/${org.id}`)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {org.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {org.slug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(org.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isActive ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                            {ORGANIZATION_LABELS.ACTIVE}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200">
                            {ORGANIZATION_LABELS.INACTIVE}
                          </span>
                        )}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <OrganizationActions
                          organization={org}
                          onEdit={() => setEditingOrganization(org)}
                          onDelete={handleOrganizationDeleted}
                          onActionSuccess={handleActionSuccess}
                          isActive={isActive}
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
