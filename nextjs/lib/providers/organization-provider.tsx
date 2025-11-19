"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import { ORGANIZATION_ERRORS } from "@/lib/constants";
import { useOrganizations, useSession, useSetActiveOrganization } from "@/lib/hooks/api/use-auth";
import type { Organization } from "@/lib/stores/organization-store";
import { useOrganizationStore } from "@/lib/stores/organization-store";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("providers/organization");

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { data: session } = useSession();
  const {
    data: organizationsData,
    isLoading: isLoadingOrgs,
    error: orgsError,
  } = useOrganizations();
  const setActiveOrgMutation = useSetActiveOrganization();

  const {
    setOrganizations,
    setActiveOrganization,
    setLoading,
    setError,
    setAutoSelectAttempted,
    setPrevSessionActiveOrgId,
    setPrevOrgIdsString,
    prevSessionActiveOrgId,
    prevOrgIdsString,
  } = useOrganizationStore();

  // Memoize organizations to prevent unnecessary re-renders
  const organizationsList = useMemo(() => organizationsData || [], [organizationsData]);

  // Create a stable string representation of organization IDs for comparison
  const orgIdsString = useMemo(
    () =>
      organizationsList
        .map((o) => o.id)
        .sort()
        .join(","),
    [organizationsList]
  );

  // Sync organizations data to store
  useEffect(() => {
    if (orgIdsString !== prevOrgIdsString) {
      setOrganizations(organizationsList);
      setPrevOrgIdsString(orgIdsString);
    }
  }, [organizationsList, orgIdsString, prevOrgIdsString, setOrganizations, setPrevOrgIdsString]);

  // Sync loading state
  useEffect(() => {
    setLoading(isLoadingOrgs);
  }, [isLoadingOrgs, setLoading]);

  // Sync error state
  useEffect(() => {
    if (orgsError) {
      setError(orgsError.message || ORGANIZATION_ERRORS.LOAD_ORGANIZATIONS_FAILED);
    }
  }, [orgsError, setError]);

  // Helper function to find active org from session
  const findActiveOrgFromSession = useRef(
    (orgs: Organization[], sessionActiveOrgId: string | null): Organization | null => {
      if (!sessionActiveOrgId) {
        return null;
      }
      return orgs.find((o) => o.id === sessionActiveOrgId) || null;
    }
  );

  // Helper function to handle auto-selection of first organization
  const handleAutoSelectFirstOrgRef = useRef((orgs: Organization[]) => {
    if (orgs.length === 0) {
      return;
    }

    const firstOrg = orgs[0];
    const firstOrgId = firstOrg.id;

    const store = useOrganizationStore.getState();
    const canAttempt = store.autoSelectAttempted !== firstOrgId && !setActiveOrgMutation.isPending;
    if (!canAttempt) {
      return;
    }

    setAutoSelectAttempted(firstOrgId);
    setActiveOrgMutation.mutate(firstOrgId, {
      onError: (err) => {
        logger.error("Auto-select failed", err);
        setError(err.message || ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
        setAutoSelectAttempted(null);
      },
    });
  });

  // Set active organization from session
  useEffect(() => {
    const sessionActiveOrgId = session?.session?.activeOrganizationId || null;
    const hasOrgsChanged = prevOrgIdsString !== orgIdsString;
    const hasSessionActiveOrgChanged = prevSessionActiveOrgId !== sessionActiveOrgId;

    // Only run if organizations or session active org ID actually changed
    if (!hasOrgsChanged && !hasSessionActiveOrgChanged) {
      return;
    }

    // Update refs
    setPrevSessionActiveOrgId(sessionActiveOrgId);

    if (organizationsList.length === 0) {
      setActiveOrganization(null);
      setAutoSelectAttempted(null);
      return;
    }

    const activeOrgFromSession = findActiveOrgFromSession.current(
      organizationsList,
      sessionActiveOrgId
    );

    // Reset the ref when we have a valid active org from session
    if (activeOrgFromSession) {
      setAutoSelectAttempted(null);
      setActiveOrganization(activeOrgFromSession);
      return;
    }

    // Auto-select first organization if none is active
    handleAutoSelectFirstOrgRef.current(organizationsList);
    setActiveOrganization(organizationsList[0] || null);
  }, [
    orgIdsString,
    session?.session?.activeOrganizationId,
    prevOrgIdsString,
    prevSessionActiveOrgId,
    organizationsList,
    setActiveOrganization,
    setAutoSelectAttempted,
    setPrevSessionActiveOrgId,
  ]);

  return <>{children}</>;
}
