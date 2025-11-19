"use client";

import { useRouter } from "next/navigation";
import { useSetActiveOrganization } from "@/lib/hooks/api/use-auth";
import { useOrganizationStore } from "@/lib/stores/organization-store";

/**
 * Hook to access organization context (replaces useOrganizationContext)
 * @throws Error if used outside OrganizationProvider
 */
export function useOrganizationContext() {
  const store = useOrganizationStore();
  const router = useRouter();
  const setActiveOrgMutation = useSetActiveOrganization();

  return {
    organizations: store.organizations,
    activeOrganization: store.activeOrganization,
    isLoading: store.isLoading,
    isSwitching: store.isSwitching,
    error: store.error,
    switchOrganization: async (organizationId: string) => {
      await store.switchOrganization(
        organizationId,
        async (id) => {
          await setActiveOrgMutation.mutateAsync(id);
        },
        () => {
          router.refresh();
        }
      );
    },
    refreshOrganizations: store.refreshOrganizations,
    clearError: store.clearError,
  };
}

/**
 * Hook to access organization (replaces useOrganization)
 */
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

/**
 * Hook to safely access organization (replaces useOrganizationSafe)
 * Always returns a context object (never null) since Zustand store is always initialized
 */
export function useOrganizationSafe() {
  const store = useOrganizationStore();
  const router = useRouter();
  const setActiveOrgMutation = useSetActiveOrganization();

  // Zustand stores are always initialized, so we always return the context
  // The store starts with empty arrays/objects, which is valid
  return {
    organization: store.activeOrganization,
    organizations: store.organizations,
    isLoading: store.isLoading,
    isSwitching: store.isSwitching,
    error: store.error,
    switchOrganization: async (organizationId: string) => {
      await store.switchOrganization(
        organizationId,
        async (id) => {
          await setActiveOrgMutation.mutateAsync(id);
        },
        () => {
          router.refresh();
        }
      );
    },
    refreshOrganizations: store.refreshOrganizations,
    clearError: store.clearError,
  };
}
