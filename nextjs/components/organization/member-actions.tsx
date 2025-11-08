"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { MEMBER_LABELS, MEMBER_ERRORS, MEMBER_SUCCESS } from "@/lib/constants";
import { MoreVertical, UserMinus, Shield, LogOut } from "lucide-react";
import { MemberRoleSelector } from "./member-role-selector";

interface Member {
  id: string;
  userId: string;
  role: string;
  user?: {
    email: string;
    name?: string;
  };
}

interface MemberActionsProps {
  member: Member;
  organizationId: string;
  currentUserId?: string;
  onActionSuccess: (message: string) => void;
  onMemberRemoved: () => void;
}

export function MemberActions({
  member,
  organizationId,
  currentUserId,
  onActionSuccess,
  onMemberRemoved,
}: MemberActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState(member.role);

  const isCurrentUser = member.userId === currentUserId;

  const handleUpdateRole = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.organization.updateMemberRole({
        organizationId,
        memberId: member.id,
        role: [newRole],
      });

      if (result.error) {
        alert(result.error.message || MEMBER_ERRORS.UPDATE_ROLE_FAILED);
      } else {
        onActionSuccess(MEMBER_SUCCESS.ROLE_UPDATED);
        setShowRoleModal(false);
        setIsOpen(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : MEMBER_ERRORS.UPDATE_ROLE_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(MEMBER_LABELS.CONFIRM_REMOVE)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.organization.removeMember({
        organizationId,
        memberIdOrEmail: member.userId,
      });

      if (result.error) {
        alert(result.error.message || MEMBER_ERRORS.REMOVE_FAILED);
      } else {
        onMemberRemoved();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : MEMBER_ERRORS.REMOVE_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm(MEMBER_LABELS.CONFIRM_LEAVE)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.organization.leave({
        organizationId,
      });

      if (result.error) {
        alert(result.error.message || MEMBER_ERRORS.LEAVE_FAILED);
      } else {
        onActionSuccess(MEMBER_SUCCESS.LEFT_ORGANIZATION);
        window.location.href = "/admin/organizations";
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : MEMBER_ERRORS.LEAVE_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowRoleModal(true);
                }}
                disabled={isLoading}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                {MEMBER_LABELS.UPDATE_ROLE}
              </button>

              {isCurrentUser ? (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLeave();
                  }}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {MEMBER_LABELS.LEAVE_ORGANIZATION}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleRemove();
                  }}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <UserMinus className="w-4 h-4" />
                  {MEMBER_LABELS.REMOVE_MEMBER}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {MEMBER_LABELS.UPDATE_ROLE}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {MEMBER_LABELS.ROLE}
              </label>
              <MemberRoleSelector
                value={newRole}
                onChange={setNewRole}
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpdateRole}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 disabled:opacity-50"
              >
                {isLoading ? "Saving..." : MEMBER_LABELS.UPDATE_ROLE}
              </button>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setNewRole(member.role);
                }}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
              >
                {MEMBER_LABELS.CANCEL}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
