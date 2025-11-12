"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrganizationSafe } from "@/lib/contexts/organization-context";
import { authClient } from "@/lib/auth-client";
import { ORGANIZATION_SWITCHER, ORGANIZATION_ERRORS } from "@/lib/constants";
import { ChevronDown, Building2 } from "lucide-react";
import { ErrorToast } from "@/components/ui/error-toast";
import { useRouter } from "next/navigation";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export function OrganizationSwitcher() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const orgContext = useOrganizationSafe();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrganizationsFallback = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listResult, sessionResult] = await Promise.all([
        authClient.organization.list(),
        authClient.getSession(),
      ]);

      if (listResult.data) {
        const orgs = Array.isArray(listResult.data) ? listResult.data : [];
        setOrganizations(orgs);

        if (sessionResult.data?.session?.activeOrganizationId) {
          const active = orgs.find(
            (o: Organization) =>
              o.id === sessionResult.data?.session?.activeOrganizationId,
          );
          if (active) {
            setActiveOrganization(active);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (orgContext) {
      setOrganizations(orgContext.organizations);
      setActiveOrganization(orgContext.organization);
      setIsLoading(orgContext.isLoading);
      setError(orgContext.error);
      setIsSwitching(orgContext.isSwitching);
    } else {
      loadOrganizationsFallback();
    }
  }, [
    orgContext,
    orgContext?.organizations,
    orgContext?.organization,
    orgContext?.isLoading,
    orgContext?.error,
    orgContext?.isSwitching,
    loadOrganizationsFallback,
  ]);

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === activeOrganization?.id) {
      setIsOpen(false);
      return;
    }

    if (orgContext) {
      await orgContext.switchOrganization(organizationId);
      setIsOpen(false);
    } else {
      setIsSwitching(true);
      setError(null);
      try {
        const result = await authClient.organization.setActive({
          organizationId,
        });

        if (result.error) {
          setError(result.error.message || ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
        } else {
          const org = organizations.find((o) => o.id === organizationId);
          if (org) {
            setActiveOrganization(org);
          }
          setIsOpen(false);
          router.refresh();
          window.location.reload();
        }
      } catch (err) {
        console.error("Failed to switch organization:", err);
        setError(ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
      } finally {
        setIsSwitching(false);
      }
    }
  };

  const clearErrorHandler = () => {
    if (orgContext) {
      orgContext.clearError();
    } else {
      setError(null);
    }
  };

  if (isLoading) {
    return (
      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <div className="h-5 w-32" />
      </div>
    );
  }

  if (organizations.length === 0) {
    return null;
  }

  const displayError = orgContext ? orgContext.error : error;
  const displayIsSwitching = orgContext ? orgContext.isSwitching : isSwitching;

  return (
    <>
      {displayError && (
        <ErrorToast
          message={displayError}
          onDismiss={clearErrorHandler}
          duration={5000}
        />
      )}
      <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={displayIsSwitching}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-white max-w-[150px] truncate">
          {displayIsSwitching
            ? ORGANIZATION_SWITCHER.SWITCHING
            : activeOrganization?.name ||
              ORGANIZATION_SWITCHER.SELECT_ORGANIZATION}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-y-auto">
            {organizations.length === 0 ? (
              <div className="p-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                {ORGANIZATION_SWITCHER.NO_ORGANIZATIONS}
              </div>
            ) : (
              <div className="py-2">
                {organizations.map((org) => {
                  const isActive = org.id === activeOrganization?.id;
                  return (
                    <button
                      key={org.id}
                      onClick={() => handleSwitch(org.id)}
                      disabled={displayIsSwitching}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{org.name}</span>
                        {isActive && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {ORGANIZATION_SWITCHER.CURRENT}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
    </>
  );
}
