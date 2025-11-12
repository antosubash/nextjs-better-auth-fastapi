"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  ORGANIZATION_ERRORS,
  ORGANIZATION_CONTEXT,
} from "@/lib/constants";

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

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
);

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganization] =
    useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const ensureActiveOrganization = useCallback(
    async (orgs: Organization[], sessionActiveOrgId: string | null) => {
      if (orgs.length === 0) {
        setActiveOrganization(null);
        return;
      }

      let activeOrg: Organization | null = null;

      if (sessionActiveOrgId) {
        activeOrg = orgs.find((o) => o.id === sessionActiveOrgId) || null;
      }

      if (!activeOrg && orgs.length > 0) {
        activeOrg = orgs[0];
        try {
          const result = await authClient.organization.setActive({
            organizationId: activeOrg.id,
          });

          if (result.error) {
            console.error(
              ORGANIZATION_CONTEXT.AUTO_SELECT_FAILED,
              result.error,
            );
            setError(
              result.error.message ||
                ORGANIZATION_ERRORS.SET_ACTIVE_FAILED,
            );
          }
        } catch (err) {
          console.error(ORGANIZATION_CONTEXT.AUTO_SELECT_FAILED, err);
          setError(ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
        }
      }

      setActiveOrganization(activeOrg);
    },
    [],
  );

  const loadOrganizations = useCallback(async () => {
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
        setOrganizations([]);
        setActiveOrganization(null);
        return;
      }

      const orgs = Array.isArray(listResult.data) ? listResult.data : [];
      setOrganizations(orgs);

      const sessionActiveOrgId =
        sessionResult.data?.session?.activeOrganizationId || null;

      await ensureActiveOrganization(orgs, sessionActiveOrgId);
    } catch (err) {
      console.error(ORGANIZATION_CONTEXT.LOAD_FAILED, err);
      setError(ORGANIZATION_ERRORS.LOAD_ORGANIZATIONS_FAILED);
      setOrganizations([]);
      setActiveOrganization(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [ensureActiveOrganization]);

  const refreshOrganizations = useCallback(async () => {
    setIsLoading(true);
    await loadOrganizations();
  }, [loadOrganizations]);

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      if (organizationId === activeOrganization?.id) {
        return;
      }

      setIsSwitching(true);
      setError(null);

      try {
        const result = await authClient.organization.setActive({
          organizationId,
        });

        if (result.error) {
          setError(
            result.error.message || ORGANIZATION_ERRORS.SET_ACTIVE_FAILED,
          );
          return;
        }

        const org = organizations.find((o) => o.id === organizationId);
        if (org) {
          setActiveOrganization(org);
        } else {
          await refreshOrganizations();
        }
        router.refresh();
        window.location.reload();
      } catch (err) {
        console.error(ORGANIZATION_CONTEXT.SWITCH_FAILED, err);
        setError(ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
      } finally {
        setIsSwitching(false);
      }
    },
    [activeOrganization, organizations, router, refreshOrganizations],
  );

  useEffect(() => {
    if (isInitialized) {
      return;
    }

    const initialize = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.session) {
          await loadOrganizations();
        } else {
          setIsLoading(false);
          setIsInitialized(true);
          setOrganizations([]);
          setActiveOrganization(null);
        }
      } catch (err) {
        console.error(ORGANIZATION_CONTEXT.LOAD_FAILED, err);
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initialize();
  }, [isInitialized, loadOrganizations]);

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

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext(): OrganizationContextType {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      ORGANIZATION_CONTEXT.HOOK_ERROR,
    );
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

