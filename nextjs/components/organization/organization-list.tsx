"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  ORGANIZATION_LABELS,
  ORGANIZATION_ERRORS,
  ORGANIZATION_SUCCESS,
} from "@/lib/constants";
import { OrganizationForm } from "./organization-form";
import { OrganizationActions } from "./organization-actions";
import { Search, Plus, Building2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  metadata?: {
    description?: string;
  };
  createdAt: number;
}

export function OrganizationList() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOrganization, setEditingOrganization] =
    useState<Organization | null>(null);

  const loadOrganizations = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [listResult, sessionResult] = await Promise.all([
        authClient.organization.list(),
        authClient.getSession(),
      ]);

      if (listResult.error) {
        setError(
          listResult.error.message ||
            ORGANIZATION_ERRORS.LOAD_ORGANIZATIONS_FAILED,
        );
      } else if (listResult.data) {
        const orgs = Array.isArray(listResult.data) ? listResult.data : [];
        setOrganizations(
          orgs.map((org) => ({
            ...org,
            createdAt:
              org.createdAt instanceof Date
                ? org.createdAt.getTime()
                : typeof org.createdAt === "number"
                  ? org.createdAt
                  : Date.now(),
          })),
        );
      }

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
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleOrganizationCreated = () => {
    setShowCreateForm(false);
    setSuccess(ORGANIZATION_SUCCESS.ORGANIZATION_CREATED);
    setTimeout(() => setSuccess(""), 3000);
    loadOrganizations();
  };

  const handleOrganizationUpdated = () => {
    setEditingOrganization(null);
    setSuccess(ORGANIZATION_SUCCESS.ORGANIZATION_UPDATED);
    setTimeout(() => setSuccess(""), 3000);
    loadOrganizations();
  };

  const handleOrganizationDeleted = () => {
    setSuccess(ORGANIZATION_SUCCESS.ORGANIZATION_DELETED);
    setTimeout(() => setSuccess(""), 3000);
    loadOrganizations();
  };

  const handleActionSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
    loadOrganizations();
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={ORGANIZATION_LABELS.SEARCH_ORGANIZATIONS}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            {ORGANIZATION_LABELS.LOADING}
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            {ORGANIZATION_LABELS.NO_ORGANIZATIONS}
          </div>
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
                    Status
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
