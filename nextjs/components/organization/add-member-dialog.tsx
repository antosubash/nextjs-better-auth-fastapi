"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADD_MEMBER_DIALOG_LABELS,
  INVITATION_ERRORS,
  MEMBER_ERRORS,
  MEMBER_LABELS,
  ORGANIZATION_ROLES,
  USER_SEARCH_LABELS,
  USER_SEARCH_PLACEHOLDERS,
} from "@/lib/constants";
import { useCreateInvitation } from "@/lib/hooks/api/use-auth";
import { useAddOrganizationMember } from "@/lib/hooks/api/use-organizations";
import { cn } from "@/lib/utils";
import type { NormalizedMember } from "@/lib/utils/organization-types";
import { MemberRoleSelector } from "./member-role-selector";
import { UserSearch } from "./user-search";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingMembers: NormalizedMember[];
  onSuccess: () => void;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  organizationId,
  existingMembers,
  onSuccess,
}: AddMemberDialogProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [role, setRole] = useState<string>(ORGANIZATION_ROLES.MEMBER);
  const [error, setError] = useState("");
  const [useEmailInput, setUseEmailInput] = useState(false);

  const addMemberMutation = useAddOrganizationMember();
  const createInvitationMutation = useCreateInvitation();
  const existingMemberIds = new Set(existingMembers.map((m) => m.userId));

  useEffect(() => {
    if (!open) {
      setSelectedUser(null);
      setEmailInput("");
      setRole(ORGANIZATION_ROLES.MEMBER);
      setError("");
      setUseEmailInput(false);
    }
  }, [open]);

  const handleAddMember = async () => {
    if (!selectedUser) {
      setError(MEMBER_ERRORS.USER_NOT_SELECTED);
      return;
    }

    if (existingMemberIds.has(selectedUser.id)) {
      setError(MEMBER_ERRORS.USER_ALREADY_MEMBER);
      return;
    }

    setError("");

    try {
      await addMemberMutation.mutateAsync({
        organizationId,
        userId: selectedUser.id,
        role,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : MEMBER_ERRORS.ADD_FAILED;
      setError(errorMessage);
    }
  };

  const handleSendInvitation = async () => {
    if (!emailInput || !emailInput.includes("@")) {
      setError(MEMBER_ERRORS.INVALID_EMAIL);
      return;
    }

    setError("");

    try {
      await createInvitationMutation.mutateAsync({
        organizationId,
        email: emailInput,
        role,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : INVITATION_ERRORS.SEND_FAILED;
      setError(errorMessage);
    }
  };

  const handleSubmit = () => {
    if (useEmailInput) {
      handleSendInvitation();
    } else {
      handleAddMember();
    }
  };

  const canSubmit = useEmailInput
    ? emailInput?.includes("@")
    : selectedUser !== null && !existingMemberIds.has(selectedUser.id);

  const renderUserSearchSection = () => {
    if (useEmailInput) return null;

    return (
      <div className="space-y-2">
        <Label>{USER_SEARCH_LABELS.SELECT_USER}</Label>
        <UserSearch
          onSelect={setSelectedUser}
          existingMemberIds={existingMemberIds}
          disabled={addMemberMutation.isPending || createInvitationMutation.isPending}
        />
        {selectedUser && (
          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
            <div className="font-medium">{selectedUser.name || selectedUser.email}</div>
            {selectedUser.name && <div className="text-gray-500">{selectedUser.email}</div>}
          </div>
        )}
      </div>
    );
  };

  const renderEmailInputSection = () => {
    if (!useEmailInput) return null;

    return (
      <div className="space-y-2">
        <Label htmlFor="email">{MEMBER_LABELS.EMAIL}</Label>
        <Input
          id="email"
          type="email"
          value={emailInput}
          onChange={(e) => {
            setEmailInput(e.target.value);
            setError("");
          }}
          placeholder={USER_SEARCH_PLACEHOLDERS.EMAIL}
          disabled={addMemberMutation.isPending || createInvitationMutation.isPending}
        />
      </div>
    );
  };

  const getSubmitButtonText = () => {
    if (addMemberMutation.isPending || createInvitationMutation.isPending) {
      return MEMBER_LABELS.ADDING;
    }
    return useEmailInput
      ? ADD_MEMBER_DIALOG_LABELS.INVITE_BUTTON
      : ADD_MEMBER_DIALOG_LABELS.ADD_BUTTON;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{ADD_MEMBER_DIALOG_LABELS.TITLE}</DialogTitle>
          <DialogDescription>{ADD_MEMBER_DIALOG_LABELS.DESCRIPTION}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={!useEmailInput ? "default" : "outline"}
              onClick={() => {
                setUseEmailInput(false);
                setEmailInput("");
                setError("");
              }}
              className={cn(
                "flex-1",
                !useEmailInput
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
              )}
            >
              {ADD_MEMBER_DIALOG_LABELS.ADD_EXISTING_USER}
            </Button>
            <Button
              type="button"
              variant={useEmailInput ? "default" : "outline"}
              onClick={() => {
                setUseEmailInput(true);
                setSelectedUser(null);
                setError("");
              }}
              className={cn(
                "flex-1",
                useEmailInput
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
              )}
            >
              {ADD_MEMBER_DIALOG_LABELS.INVITE_NEW_USER}
            </Button>
          </div>

          {renderUserSearchSection()}
          {renderEmailInputSection()}

          <div className="space-y-2">
            <Label htmlFor="role">{MEMBER_LABELS.ROLE}</Label>
            <MemberRoleSelector
              value={role}
              onChange={setRole}
              disabled={addMemberMutation.isPending || createInvitationMutation.isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addMemberMutation.isPending || createInvitationMutation.isPending}
          >
            {ADD_MEMBER_DIALOG_LABELS.CANCEL}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              !canSubmit || addMemberMutation.isPending || createInvitationMutation.isPending
            }
          >
            {getSubmitButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
