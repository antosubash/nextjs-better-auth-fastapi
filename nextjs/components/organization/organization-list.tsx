"use client";

import { Building2, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useErrorMessage } from "@/hooks/organization/use-error-message";
import { useSearch } from "@/hooks/organization/use-search";
import { useSuccessMessage } from "@/hooks/organization/use-success-message";
import { ORGANIZATION_ERRORS, ORGANIZATION_LABELS, ORGANIZATION_SUCCESS } from "@/lib/constants";
import { useOrganizations, useSession } from "@/lib/hooks/api/use-auth";
import { useAdminOrganizations } from "@/lib/hooks/api/use-organizations";
import { useOrganizationSafe } from "@/lib/hooks/use-organization";
import { useUIStore } from "@/lib/stores/ui-store";
import { formatDate } from "@/lib/utils/date";
import { extractOrganizations, normalizeOrganizations } from "@/lib/utils/organization-data";
import type { NormalizedOrganization } from "@/lib/utils/organization-types";
import { OrganizationActions } from "./organization-actions";
import { OrganizationForm } from "./organization-form";
import { EmptyState } from "./shared/empty-state";
import { ErrorMessage } from "./shared/error-message";
import { SearchInput } from "./shared/search-input";
import { SuccessMessage } from "./shared/success-message";

export function OrganizationList() {
  const router = useRouter();
  const pathname = usePathname();
  const isAdminContext = pathname?.startsWith("/admin") ?? false;
  const [organizations, setOrganizations] = useState<NormalizedOrganization[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingOrganization, setEditingOrganization] = useState<NormalizedOrganization | null>(
    null
  );

  const { isDialogOpen, openDialog, closeDialog } = useUIStore();
  const showCreateForm = isDialogOpen("organization-create");

  const { searchValue, handleSearch } = useSearch();
  const { success, showSuccess, clearSuccess } = useSuccessMessage();
  const { error, showError, clearError } = useErrorMessage();

  const orgContext = useOrganizationSafe();
  const {
    data: adminOrgsData,
    isLoading: isLoadingAdminOrgs,
    error: adminOrgsError,
  } = useAdminOrganizations();
  const { data: userOrgsData, isLoading: isLoadingUserOrgs } = useOrganizations();
  const { data: sessionData } = useSession();

  const loadContextOrganizations = useCallback(() => {
    if (!orgContext) return;

    const normalizedOrgs = normalizeOrganizations(
      orgContext.organizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: Date.now(),
      }))
    );
    setOrganizations(normalizedOrgs);
    setActiveOrganizationId(orgContext.organization?.id || null);
  }, [orgContext]);

  useEffect(() => {
    setIsLoading(true);
    clearError();

    if (isAdminContext) {
      if (adminOrgsError) {
        showError(adminOrgsError.message || ORGANIZATION_ERRORS.LOAD_ORGANIZATIONS_FAILED);
      } else if (adminOrgsData) {
        const orgs = adminOrgsData.organizations || [];
        setOrganizations(normalizeOrganizations(orgs));
      }
      setIsLoading(isLoadingAdminOrgs);
    } else if (orgContext) {
      loadContextOrganizations();
      setIsLoading(false);
    } else if (userOrgsData) {
      const normalizedOrgs = normalizeOrganizations(extractOrganizations(userOrgsData));
      setOrganizations(normalizedOrgs);
      setIsLoading(false);
    } else {
      setIsLoading(isLoadingUserOrgs);
    }
  }, [
    isAdminContext,
    orgContext,
    adminOrgsData,
    adminOrgsError,
    isLoadingAdminOrgs,
    userOrgsData,
    isLoadingUserOrgs,
    clearError,
    showError,
    loadContextOrganizations,
  ]);

  useEffect(() => {
    if (sessionData?.session?.activeOrganizationId) {
      setActiveOrganizationId(sessionData.session.activeOrganizationId);
    }
  }, [sessionData]);

  const handleOrganizationCreated = () => {
    closeDialog("organization-create");
    showSuccess(ORGANIZATION_SUCCESS.ORGANIZATION_CREATED);
    if (orgContext) {
      orgContext.refreshOrganizations();
    }
    // React Query will refetch automatically on invalidation
  };

  const handleOrganizationUpdated = () => {
    setEditingOrganization(null);
    showSuccess(ORGANIZATION_SUCCESS.ORGANIZATION_UPDATED);
    if (orgContext) {
      orgContext.refreshOrganizations();
    }
    // React Query will refetch automatically on invalidation
  };

  const handleOrganizationDeleted = () => {
    showSuccess(ORGANIZATION_SUCCESS.ORGANIZATION_DELETED);
    if (orgContext) {
      orgContext.refreshOrganizations();
    }
    // React Query will refetch automatically on invalidation
  };

  const handleActionSuccess = (message: string) => {
    showSuccess(message);
    if (orgContext) {
      orgContext.refreshOrganizations();
    }
    // React Query will refetch automatically on invalidation
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-gray-900 dark:text-white" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {ORGANIZATION_LABELS.TITLE}
          </h1>
        </div>
        <Button onClick={() => openDialog("organization-create")}>
          <Plus className="w-5 h-5" />
          {ORGANIZATION_LABELS.CREATE_ORGANIZATION}
        </Button>
      </div>

      <ErrorMessage message={error} onDismiss={clearError} className="mb-4" />
      <SuccessMessage message={success} onDismiss={clearSuccess} className="mb-4" />

      {showCreateForm && (
        <div className="mb-6">
          <OrganizationForm
            onSuccess={handleOrganizationCreated}
            onCancel={() => closeDialog("organization-create")}
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

      <Separator className="my-6" />

      <div className="mb-4">
        <SearchInput
          placeholder={ORGANIZATION_LABELS.SEARCH_ORGANIZATIONS}
          value={searchValue}
          onChange={handleSearch}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton loaders are static and won't reorder
                  <div key={`skeleton-${i}`} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <EmptyState message={ORGANIZATION_LABELS.NO_ORGANIZATIONS} />
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{ORGANIZATION_LABELS.NAME}</TableHead>
                    <TableHead>{ORGANIZATION_LABELS.SLUG}</TableHead>
                    <TableHead>{ORGANIZATION_LABELS.CREATED_AT}</TableHead>
                    <TableHead>{ORGANIZATION_LABELS.STATUS}</TableHead>
                    <TableHead>{ORGANIZATION_LABELS.ACTIONS}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((org) => {
                    const isActive = org.id === activeOrganizationId;
                    return (
                      <TableRow
                        key={org.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/organizations/${org.id}`)}
                      >
                        <TableCell>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <span className="font-medium cursor-pointer hover:underline">
                                {org.name}
                              </span>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              <div className="space-y-2">
                                <div>
                                  <h4 className="text-sm font-semibold">{org.name}</h4>
                                  <p className="text-sm text-muted-foreground">{org.slug}</p>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  <p>
                                    <span className="font-medium">Created:</span>{" "}
                                    {formatDate(org.createdAt)}
                                  </p>
                                  <p>
                                    <span className="font-medium">Status:</span>{" "}
                                    {isActive
                                      ? ORGANIZATION_LABELS.ACTIVE
                                      : ORGANIZATION_LABELS.INACTIVE}
                                  </p>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </TableCell>
                        <TableCell>{org.slug}</TableCell>
                        <TableCell>{formatDate(org.createdAt)}</TableCell>
                        <TableCell>
                          {isActive ? (
                            <Badge variant="default">{ORGANIZATION_LABELS.ACTIVE}</Badge>
                          ) : (
                            <Badge variant="secondary">{ORGANIZATION_LABELS.INACTIVE}</Badge>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <OrganizationActions
                            organization={org}
                            onEdit={() => setEditingOrganization(org)}
                            onDelete={handleOrganizationDeleted}
                            onActionSuccess={handleActionSuccess}
                            isActive={isActive}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
