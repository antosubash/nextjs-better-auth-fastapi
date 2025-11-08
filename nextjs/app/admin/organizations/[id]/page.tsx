"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  ORGANIZATION_LABELS,
  ORGANIZATION_ERRORS,
} from "@/lib/constants";
import { MemberList } from "@/components/organization/member-list";
import { TeamList } from "@/components/organization/team-list";
import { InvitationList } from "@/components/organization/invitation-list";
import { Building2, Users, UserPlus, UsersRound } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  metadata?: {
    description?: string;
  };
  createdAt: number;
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const organizationId = params.id as string;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"members" | "teams" | "invitations">("members");

  useEffect(() => {
    const loadOrganization = async () => {
      setIsLoading(true);
      setError("");
      try {
        const result = await authClient.organization.list();

        if (result.error) {
          setError(
            result.error.message || ORGANIZATION_ERRORS.LOAD_ORGANIZATION_FAILED
          );
        } else if (result.data) {
          const orgs = Array.isArray(result.data) ? result.data : [];
          const org = orgs.find((o) => o.id === organizationId);
          if (org) {
            setOrganization({
              ...org,
              createdAt:
                org.createdAt instanceof Date
                  ? org.createdAt.getTime()
                  : typeof org.createdAt === "number"
                    ? org.createdAt
                    : Date.now(),
            });
          } else {
            setError(ORGANIZATION_ERRORS.LOAD_ORGANIZATION_FAILED);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : ORGANIZATION_ERRORS.LOAD_ORGANIZATION_FAILED;
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (organizationId) {
      loadOrganization();
    }
  }, [organizationId]);

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center text-gray-600 dark:text-gray-400">
          {ORGANIZATION_LABELS.LOADING}
        </div>
      </main>
    );
  }

  if (error || !organization) {
    return (
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center">
          <p className="text-lg text-red-600 dark:text-red-400">
            {error || ORGANIZATION_ERRORS.LOAD_ORGANIZATION_FAILED}
          </p>
          <Link
            href="/admin/organizations"
            className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Organizations
          </Link>
        </div>
      </main>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-6">
        <Link
          href="/admin/organizations"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← Back to Organizations
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-gray-900 dark:text-white" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {organization.name}
          </h1>
        </div>
        {organization.metadata?.description && (
          <p className="text-gray-600 dark:text-gray-400">
            {organization.metadata.description}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Created on {formatDate(organization.createdAt)}
        </p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "members"
                ? "border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {ORGANIZATION_LABELS.MEMBERS}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "teams"
                ? "border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <UsersRound className="w-4 h-4" />
              {ORGANIZATION_LABELS.TEAMS}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("invitations")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "invitations"
                ? "border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              {ORGANIZATION_LABELS.INVITATIONS}
            </div>
          </button>
        </nav>
      </div>

      {activeTab === "members" && (
        <MemberList organizationId={organizationId} />
      )}
      {activeTab === "teams" && (
        <TeamList organizationId={organizationId} />
      )}
      {activeTab === "invitations" && (
        <InvitationList organizationId={organizationId} />
      )}
    </main>
  );
}

