"use client";

import { create } from "zustand";
import { ORGANIZATION_ERRORS } from "@/lib/constants";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("stores/organization");

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationState {
  organizations: Organization[];
  activeOrganization: Organization | null;
  isLoading: boolean;
  isSwitching: boolean;
  error: string | null;
  autoSelectAttempted: string | null;
  prevSessionActiveOrgId: string | null;
  prevOrgIdsString: string;
}

interface OrganizationActions {
  setOrganizations: (organizations: Organization[]) => void;
  setActiveOrganization: (organization: Organization | null) => void;
  setLoading: (isLoading: boolean) => void;
  setSwitching: (isSwitching: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  switchOrganization: (
    organizationId: string,
    mutationFn: (id: string) => Promise<void>,
    routerRefresh: () => void
  ) => Promise<void>;
  setAutoSelectAttempted: (orgId: string | null) => void;
  setPrevSessionActiveOrgId: (orgId: string | null) => void;
  setPrevOrgIdsString: (ids: string) => void;
  refreshOrganizations: () => void;
}

type OrganizationStore = OrganizationState & OrganizationActions;

export const useOrganizationStore = create<OrganizationStore>((set, get) => ({
  // State
  organizations: [],
  activeOrganization: null,
  isLoading: false,
  isSwitching: false,
  error: null,
  autoSelectAttempted: null,
  prevSessionActiveOrgId: null,
  prevOrgIdsString: "",

  // Actions
  setOrganizations: (organizations) => set({ organizations }),
  setActiveOrganization: (organization) => set({ activeOrganization: organization }),
  setLoading: (isLoading) => set({ isLoading }),
  setSwitching: (isSwitching) => set({ isSwitching }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setAutoSelectAttempted: (orgId) => set({ autoSelectAttempted: orgId }),
  setPrevSessionActiveOrgId: (orgId) => set({ prevSessionActiveOrgId: orgId }),
  setPrevOrgIdsString: (ids) => set({ prevOrgIdsString: ids }),

  switchOrganization: async (organizationId, mutationFn, routerRefresh) => {
    const { activeOrganization, organizations } = get();
    if (organizationId === activeOrganization?.id) {
      return;
    }

    set({ isSwitching: true, error: null });

    try {
      await mutationFn(organizationId);

      // Optimistically update the active organization
      const org = organizations.find((o) => o.id === organizationId);
      if (org) {
        set({ activeOrganization: org });
      }

      // Refresh router to update server-side state
      routerRefresh();

      // React Query will automatically refetch session and organizations
      // No need for window.location.reload() which causes instability
    } catch (err) {
      logger.error("Failed to switch organization", err);
      set({
        error: err instanceof Error ? err.message : ORGANIZATION_ERRORS.SET_ACTIVE_FAILED,
      });
    } finally {
      set({ isSwitching: false });
    }
  },

  refreshOrganizations: () => {
    // React Query will automatically refetch when invalidated
    // This is a no-op, kept for API compatibility
  },
}));

// Selectors for better performance
export const useOrganizations = () => useOrganizationStore((state) => state.organizations);

export const useActiveOrganization = () =>
  useOrganizationStore((state) => state.activeOrganization);

export const useOrganizationLoading = () => useOrganizationStore((state) => state.isLoading);

export const useOrganizationSwitching = () => useOrganizationStore((state) => state.isSwitching);

export const useOrganizationError = () => useOrganizationStore((state) => state.error);
