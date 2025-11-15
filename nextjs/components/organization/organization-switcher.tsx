"use client";

import { Building2, Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorToast } from "@/components/ui/error-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { ORGANIZATION_ERRORS, ORGANIZATION_SWITCHER } from "@/lib/constants";
import { useOrganizationSafe } from "@/lib/contexts/organization-context";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export function OrganizationSwitcher() {
  const router = useRouter();
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
            (o: Organization) => o.id === sessionResult.data?.session?.activeOrganizationId
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

  const switchOrganizationFallback = async (organizationId: string) => {
    setIsSwitching(true);
    setError(null);
    try {
      const result = await authClient.organization.setActive({
        organizationId,
      });

      if (result.error) {
        setError(result.error.message || ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
        return;
      }

      const org = organizations.find((o) => o.id === organizationId);
      if (org) {
        setActiveOrganization(org);
      }
      router.refresh();
      window.location.reload();
    } catch (err) {
      console.error("Failed to switch organization:", err);
      setError(ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === activeOrganization?.id) {
      return;
    }

    if (orgContext) {
      await orgContext.switchOrganization(organizationId);
    } else {
      await switchOrganizationFallback(organizationId);
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
    return <Skeleton className="h-9 w-48" />;
  }

  if (organizations.length === 0) {
    return null;
  }

  const displayError = orgContext ? orgContext.error : error;
  const displayIsSwitching = orgContext ? orgContext.isSwitching : isSwitching;

  return (
    <>
      {displayError && (
        <ErrorToast message={displayError} onDismiss={clearErrorHandler} duration={5000} />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={displayIsSwitching}
            className="flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            <span className="max-w-[150px] truncate">
              {displayIsSwitching
                ? ORGANIZATION_SWITCHER.SWITCHING
                : activeOrganization?.name || ORGANIZATION_SWITCHER.SELECT_ORGANIZATION}
            </span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {organizations.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              {ORGANIZATION_SWITCHER.NO_ORGANIZATIONS}
            </div>
          ) : (
            organizations.map((org) => {
              const isActive = org.id === activeOrganization?.id;
              return (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSwitch(org.id)}
                  disabled={displayIsSwitching}
                  className="flex items-center justify-between"
                >
                  <span className="truncate flex-1">{org.name}</span>
                  {isActive && <Check className="w-4 h-4 ml-2 shrink-0" />}
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
