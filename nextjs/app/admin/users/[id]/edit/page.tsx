"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User } from "lucide-react";
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
import { ADMIN_LABELS, ADMIN_ERRORS } from "@/lib/constants";
import { useUserEdit } from "./hooks/use-user-edit";
import { UserEditHeader } from "./components/user-edit-header";
import { UserEditTabs } from "./components/user-edit-tabs";
import { UserInfoCard } from "./components/user-info-card";
import { Loader2 } from "lucide-react";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [activeTab, setActiveTab] = useState("edit");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    user,
    isLoading,
    error,
    isActionLoading,
    reloadUser,
    handleBan,
    handleUnban,
    handleDelete,
    handleImpersonate,
    handleResendVerificationEmail,
    handlePasswordReset,
  } = useUserEdit(userId);

  const handleSuccess = () => {
    reloadUser();
  };

  const handleCancel = () => {
    router.push("/admin/users");
  };

  const handleDeleteConfirm = async () => {
    const success = await handleDelete();
    if (success) {
      router.push("/admin/users");
    }
    setShowDeleteDialog(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="border rounded-lg">
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/users")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <User className="w-8 h-8" />
            <h1 className="text-3xl font-bold">{ADMIN_LABELS.EDIT_USER}</h1>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error || ADMIN_ERRORS.LOAD_USERS_FAILED}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/admin/users")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {ADMIN_LABELS.BACK_TO_USERS}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserEditHeader
        isActionLoading={isActionLoading}
        onImpersonate={handleImpersonate}
        onResendVerificationEmail={handleResendVerificationEmail}
        onDeleteClick={() => setShowDeleteDialog(true)}
      />

      <UserInfoCard user={user} />

      <UserEditTabs
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        isActionLoading={isActionLoading}
        onBan={handleBan}
        onUnban={handleUnban}
        onPasswordReset={handlePasswordReset}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>{ADMIN_LABELS.CONFIRM_DELETE}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>{ADMIN_LABELS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                ADMIN_LABELS.DELETE_USER
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
