"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  const autoSelectAttemptedRef = useRef<string | null>(null);
  const prevSessionActiveOrgIdRef = useRef<string | null>(null);
  const prevOrgIdsRef = useRef<string>("");

  // Memoize organizations to prevent unnecessary re-renders
  const organizations = useMemo(() => organizationsData || [], [organizationsData]);
  const isLoading = isLoadingOrgs;

  // Create a stable string representation of organization IDs for comparison
  const orgIdsString = useMemo(
    () => organizations.map((o) => o.id).sort().join(","),
    [organizations]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Helper function to find active org from session
  const findActiveOrgFromSession = useCallback(
    (orgs: Organization[], sessionActiveOrgId: string | null): Organization | null => {
      if (!sessionActiveOrgId) {
        return null;
      }
      return orgs.find((o) => o.id === sessionActiveOrgId) || null;
    },
    []
  );

  // Helper function to handle auto-selection of first organization
  const handleAutoSelectFirstOrg = useCallback(
    (orgs: Organization[]) => {
      if (orgs.length === 0) {
        return;
      }

      const firstOrg = orgs[0];
      const firstOrgId = firstOrg.id;

      // Prevent infinite loop: only attempt if we haven't tried this org yet
      const canAttempt = autoSelectAttemptedRef.current !== firstOrgId && !setActiveOrgMutation.isPending;
      if (!canAttempt) {
        return;
      }

      autoSelectAttemptedRef.current = firstOrgId;
      setActiveOrgMutation.mutate(firstOrgId, {
        onError: (err) => {
          logger.error(ORGANIZATION_CONTEXT.AUTO_SELECT_FAILED, err);
          setError(err.message || ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
          // Reset ref on error so we can retry if needed
          autoSelectAttemptedRef.current = null;
        },
      });
    },
    [setActiveOrgMutation]
  );

  // Set active organization from session
  useEffect(() => {
    const sessionActiveOrgId = session?.session?.activeOrganizationId || null;
    const hasOrgsChanged = prevOrgIdsRef.current !== orgIdsString;
    const hasSessionActiveOrgChanged = prevSessionActiveOrgIdRef.current !== sessionActiveOrgId;

    // Only run if organizations or session active org ID actually changed
    if (!hasOrgsChanged && !hasSessionActiveOrgChanged) {
      return;
    }

    // Update refs
    prevOrgIdsRef.current = orgIdsString;
    prevSessionActiveOrgIdRef.current = sessionActiveOrgId;

    if (organizations.length === 0) {
      setActiveOrganization(null);
      autoSelectAttemptedRef.current = null;
      return;
    }

    const activeOrgFromSession = findActiveOrgFromSession(organizations, sessionActiveOrgId);

    // Reset the ref when we have a valid active org from session
    if (activeOrgFromSession) {
      autoSelectAttemptedRef.current = null;
      setActiveOrganization(activeOrgFromSession);
      return;
    }

    // Auto-select first organization if none is active
    handleAutoSelectFirstOrg(organizations);
    setActiveOrganization(organizations[0] || null);
  }, [orgIdsString, session?.session?.activeOrganizationId, findActiveOrgFromSession, handleAutoSelectFirstOrg, organizations]);

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
