"use client";

import { ArrowLeft, Building2, Edit, RefreshCw, Trash2, UserPlus, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InvitationList } from "@/components/organization/invitation-list";
import { MemberList } from "@/components/organization/member-list";
import { OrganizationForm } from "@/components/organization/organization-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ErrorToast } from "@/components/ui/error-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ADMIN_NAVIGATION,
  ORGANIZATION_ERRORS,
  ORGANIZATION_LABELS,
  ORGANIZATION_SUCCESS,
} from "@/lib/constants";
import { useDeleteOrganization, useSession } from "@/lib/hooks/api/use-auth";
import { formatDate } from "@/lib/utils/date";
import { useOrganization } from "@/lib/hooks/api/use-organizations";

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as string;
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"members" | "invitations">("members");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);

  const {
    data: organizationData,
    isLoading,
    error: queryError,
    refetch,
    isRefetching,
  } = useOrganization(organizationId);
  const { data: sessionData } = useSession();
  const deleteOrgMutation = useDeleteOrganization();

  const organization = organizationData?.organization || null;
  const displayError = error || queryError?.message || "";
  const isDeleting = deleteOrgMutation.isPending;

  useEffect(() => {
    if (sessionData?.session?.activeOrganizationId) {
      setActiveOrganizationId(sessionData.session.activeOrganizationId);
    }
  }, [sessionData]);

  const handleRefresh = () => {
    refetch();
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    setSuccess(ORGANIZATION_SUCCESS.ORGANIZATION_UPDATED);
    setTimeout(() => setSuccess(""), 3000);
    refetch();
  };

  const handleDelete = async () => {
    if (!organization) return;
    try {
      await deleteOrgMutation.mutateAsync(organization.id);
      setSuccess(ORGANIZATION_SUCCESS.ORGANIZATION_DELETED);
      setTimeout(() => {
        router.push("/admin/organizations");
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ORGANIZATION_ERRORS.DELETE_FAILED;
      setError(errorMessage);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-400 py-8">
        {ORGANIZATION_LABELS.LOADING}
      </div>
    );
  }

  if (displayError || !organization) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-red-600 dark:text-red-400 mb-4">
          {displayError || ORGANIZATION_ERRORS.LOAD_ORGANIZATION_FAILED}
        </p>
        <Link href="/admin/organizations">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {ORGANIZATION_LABELS.BACK_TO_ORGANIZATIONS}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/dashboard">{ADMIN_NAVIGATION.DASHBOARD}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/organizations">
              {ADMIN_NAVIGATION.ORGANIZATIONS}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{organization.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {displayError && (
        <ErrorToast message={displayError} onDismiss={() => setError("")} duration={5000} />
      )}

      {success && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg shadow-lg p-4">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Link href="/admin/organizations">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {ORGANIZATION_LABELS.BACK_TO_ORGANIZATIONS}
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-4">
                {organization.logo ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden relative">
                    <Image
                      src={organization.logo}
                      alt={organization.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-3xl">{organization.name}</CardTitle>
                    {activeOrganizationId === organization.id ? (
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
                        {ORGANIZATION_LABELS.ACTIVE}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800">
                        {ORGANIZATION_LABELS.INACTIVE}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{organization.slug}</Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {ORGANIZATION_LABELS.CREATED_ON} {formatDate(organization.createdAt, "long")}
                    </span>
                  </div>
                </div>
              </div>
              {organization.metadata?.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-4">
                  {organization.metadata.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefetching}
                title={ORGANIZATION_LABELS.REFRESH}
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                <Edit className="w-4 h-4 mr-2" />
                {ORGANIZATION_LABELS.EDIT_ORGANIZATION}
              </Button>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                {ORGANIZATION_LABELS.DELETE_ORGANIZATION}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          >
            <TabsList>
              <TabsTrigger value="members">
                <Users className="w-4 h-4 mr-2" />
                {ORGANIZATION_LABELS.MEMBERS}
              </TabsTrigger>
              <TabsTrigger value="invitations">
                <UserPlus className="w-4 h-4 mr-2" />
                {ORGANIZATION_LABELS.INVITATIONS}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="members" className="mt-6">
              <MemberList organizationId={organizationId} />
            </TabsContent>
            <TabsContent value="invitations" className="mt-6">
              <InvitationList organizationId={organizationId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{ORGANIZATION_LABELS.EDIT_ORGANIZATION}</DialogTitle>
          </DialogHeader>
          <OrganizationForm
            organization={organization}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditDialog(false)}
            hideHeader={true}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ORGANIZATION_LABELS.DELETE_ORGANIZATION}</AlertDialogTitle>
            <AlertDialogDescription>{ORGANIZATION_LABELS.CONFIRM_DELETE}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {ORGANIZATION_LABELS.CANCEL}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? ORGANIZATION_LABELS.SAVING : ORGANIZATION_LABELS.DELETE_ORGANIZATION}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
