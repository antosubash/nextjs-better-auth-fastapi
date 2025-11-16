"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ORGANIZATION_CONTEXT, ORGANIZATION_ERRORS } from "@/lib/constants";
import { useOrganizations, useSession, useSetActiveOrganization } from "@/lib/hooks/api/use-auth";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("contexts/organization");

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationContextType {
  organizations: Organization[];
  activeOrganization: Organization | null;
  isLoading: boolean;
  isSwitching: boolean;
  error: string | null;
  switchOrganization: (organizationId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  clearError: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    data: organizationsData,
    isLoading: isLoadingOrgs,
    error: orgsError,
  } = useOrganizations();
  const setActiveOrgMutation = useSetActiveOrganization();

  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const organizations = organizationsData || [];
  const isLoading = isLoadingOrgs;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Set active organization from session
  useEffect(() => {
    if (organizations.length === 0) {
      setActiveOrganization(null);
      return;
    }

    const sessionActiveOrgId = session?.session?.activeOrganizationId || null;
    let activeOrg: Organization | null = null;

    if (sessionActiveOrgId) {
      activeOrg = organizations.find((o) => o.id === sessionActiveOrgId) || null;
    }

    if (!activeOrg && organizations.length > 0) {
      activeOrg = organizations[0];
      // Auto-select first organization if none is active
      setActiveOrgMutation.mutate(activeOrg.id, {
        onError: (err) => {
          logger.error(ORGANIZATION_CONTEXT.AUTO_SELECT_FAILED, err);
          setError(err.message || ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
        },
      });
    }

    setActiveOrganization(activeOrg);
  }, [organizations, session, setActiveOrgMutation]);

  // Handle organizations error
  useEffect(() => {
    if (orgsError) {
      setError(orgsError.message || ORGANIZATION_ERRORS.LOAD_ORGANIZATIONS_FAILED);
    }
  }, [orgsError]);

  const refreshOrganizations = useCallback(async () => {
    // React Query will automatically refetch when invalidated
  }, []);

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      if (organizationId === activeOrganization?.id) {
        return;
      }

      setIsSwitching(true);
      setError(null);

      try {
        await setActiveOrgMutation.mutateAsync(organizationId);

        const org = organizations.find((o) => o.id === organizationId);
        if (org) {
          setActiveOrganization(org);
        }
        router.refresh();
        window.location.reload();
      } catch (err) {
        logger.error(ORGANIZATION_CONTEXT.SWITCH_FAILED, err);
        setError(err instanceof Error ? err.message : ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
      } finally {
        setIsSwitching(false);
      }
    },
    [activeOrganization, organizations, router, setActiveOrgMutation]
  );

  const value: OrganizationContextType = {
    organizations,
    activeOrganization,
    isLoading,
    isSwitching,
    error,
    switchOrganization,
    refreshOrganizations,
    clearError,
  };

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganizationContext(): OrganizationContextType {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(ORGANIZATION_CONTEXT.HOOK_ERROR);
  }
  return context;
}

export function useOrganization() {
  const context = useOrganizationContext();
  return {
    organization: context.activeOrganization,
    organizations: context.organizations,
    isLoading: context.isLoading,
    isSwitching: context.isSwitching,
    error: context.error,
    switchOrganization: context.switchOrganization,
    refreshOrganizations: context.refreshOrganizations,
    clearError: context.clearError,
  };
}

export function useOrganizationSafe() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    return null;
  }
  return {
    organization: context.activeOrganization,
    organizations: context.organizations,
    isLoading: context.isLoading,
    isSwitching: context.isSwitching,
    error: context.error,
    switchOrganization: context.switchOrganization,
    refreshOrganizations: context.refreshOrganizations,
    clearError: context.clearError,
  };
}
