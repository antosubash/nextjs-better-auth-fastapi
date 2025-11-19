"use client";

import { Building2, Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorToast } from "@/components/ui/error-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ORGANIZATION_ERRORS, ORGANIZATION_SWITCHER } from "@/lib/constants";
import { useOrganizations, useSession, useSetActiveOrganization } from "@/lib/hooks/api/use-auth";
import { useOrganizationSafe } from "@/lib/hooks/use-organization";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export function OrganizationSwitcher() {
  const router = useRouter();
  const orgContext = useOrganizationSafe();

  // Fallback hooks when context is not available
  const { data: organizationsData, isLoading: isLoadingOrgs } = useOrganizations();
  const { data: session } = useSession();
  const setActiveOrgMutation = useSetActiveOrganization();

  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use context if available, otherwise use React Query hooks directly
  const organizations = orgContext?.organizations || organizationsData || [];
  const activeOrganization =
    orgContext?.organization ||
    organizations.find((o: Organization) => o.id === session?.session?.activeOrganizationId) ||
    null;
  const isLoading = orgContext?.isLoading ?? isLoadingOrgs;
  const isSwitchingContext = orgContext?.isSwitching ?? isSwitching;

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === activeOrganization?.id) {
      return;
    }

    if (orgContext) {
      await orgContext.switchOrganization(organizationId);
    } else {
      setIsSwitching(true);
      setError(null);
      try {
        await setActiveOrgMutation.mutateAsync(organizationId);
        router.refresh();
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
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
    return <Skeleton className="h-9 w-48" />;
  }

  if (organizations.length === 0) {
    return null;
  }

  const displayError = orgContext?.error || error;
  const displayIsSwitching = isSwitchingContext;

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
