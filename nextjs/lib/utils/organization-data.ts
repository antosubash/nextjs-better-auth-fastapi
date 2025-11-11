/**
 * Data normalization utilities for organization-related data
 */

import type {
  Organization,
  Member,
  Team,
  Invitation,
  NormalizedOrganization,
  NormalizedMember,
  NormalizedTeam,
  NormalizedInvitation,
  OrganizationListResponse,
  MemberListResponse,
  TeamListResponse,
  InvitationListResponse,
} from "./organization-types";

/**
 * Normalize a date value to a timestamp (number)
 */
export function normalizeDate(
  date: number | Date | string | undefined | null,
): number {
  if (!date) {
    return Date.now();
  }
  if (typeof date === "number") {
    return date;
  }
  if (date instanceof Date) {
    return date.getTime();
  }
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    return Date.now();
  }
  return parsed.getTime();
}

/**
 * Normalize an organization object
 */
export function normalizeOrganization(
  org: Organization,
): NormalizedOrganization {
  return {
    ...org,
    logo: org.logo ?? undefined, // Convert null to undefined
    createdAt: normalizeDate(org.createdAt),
  };
}

/**
 * Normalize a member object
 */
export function normalizeMember(member: Member): NormalizedMember {
  return {
    ...member,
    createdAt: normalizeDate(member.createdAt),
  };
}

/**
 * Normalize a team object
 */
export function normalizeTeam(team: Team): NormalizedTeam {
  return {
    ...team,
    createdAt: normalizeDate(team.createdAt),
  };
}

/**
 * Normalize an invitation object
 */
export function normalizeInvitation(
  invitation: Invitation,
): NormalizedInvitation {
  return {
    ...invitation,
    createdAt: normalizeDate(invitation.createdAt),
    expiresAt: invitation.expiresAt
      ? normalizeDate(invitation.expiresAt)
      : undefined,
  };
}

/**
 * Extract organizations from API response
 */
export function extractOrganizations(
  response: OrganizationListResponse | Organization[] | Organization | null | undefined,
): Organization[] {
  if (!response) {
    return [];
  }
  if (Array.isArray(response)) {
    return response;
  }
  if ("organizations" in response && Array.isArray(response.organizations)) {
    return response.organizations;
  }
  if ("data" in response) {
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === "object" && "id" in data) {
      return [data as Organization];
    }
  }
  if (typeof response === "object" && "id" in response) {
    return [response as Organization];
  }
  return [];
}

/**
 * Extract members from API response
 */
export function extractMembers(
  response: MemberListResponse | Member[] | null | undefined,
): Member[] {
  if (!response) {
    return [];
  }
  if (Array.isArray(response)) {
    return response;
  }
  if ("members" in response && Array.isArray(response.members)) {
    return response.members;
  }
  if ("data" in response) {
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (
      data &&
      typeof data === "object" &&
      "members" in data &&
      Array.isArray((data as { members?: Member[] }).members)
    ) {
      return (data as { members: Member[] }).members;
    }
  }
  return [];
}

/**
 * Extract teams from API response
 */
export function extractTeams(
  response: TeamListResponse | Team[] | null | undefined,
): Team[] {
  if (!response) {
    return [];
  }
  if (Array.isArray(response)) {
    return response;
  }
  if ("teams" in response && Array.isArray(response.teams)) {
    return response.teams;
  }
  if ("data" in response) {
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (
      data &&
      typeof data === "object" &&
      "teams" in data &&
      Array.isArray((data as { teams?: Team[] }).teams)
    ) {
      return (data as { teams: Team[] }).teams;
    }
  }
  return [];
}

/**
 * Extract invitations from API response
 */
/**
 * Extract invitations from API response
 * Handles cases where createdAt might be missing
 */
export function extractInvitations(
  response: InvitationListResponse | Invitation[] | null | undefined,
): Invitation[] {
  if (!response) {
    return [];
  }
  if (Array.isArray(response)) {
    // Ensure all invitations have createdAt
    return response.map((inv) => ({
      ...inv,
      createdAt: (inv as Invitation).createdAt ?? new Date(),
    })) as Invitation[];
  }
  if ("invitations" in response && Array.isArray(response.invitations)) {
    return response.invitations.map((inv) => ({
      ...inv,
      createdAt: (inv as Invitation).createdAt ?? new Date(),
    })) as Invitation[];
  }
  if ("data" in response) {
    const data = response.data;
    if (Array.isArray(data)) {
      return data.map((inv) => ({
        ...inv,
        createdAt: (inv as Partial<Invitation>).createdAt ?? new Date(),
      })) as Invitation[];
    }
    if (
      data &&
      typeof data === "object" &&
      "invitations" in data &&
      Array.isArray((data as { invitations?: Invitation[] }).invitations)
    ) {
      return (data as { invitations: Invitation[] }).invitations.map((inv) => ({
        ...inv,
        createdAt: (inv as Partial<Invitation>).createdAt ?? new Date(),
      })) as Invitation[];
    }
  }
  return [];
}

/**
 * Transform and normalize organizations from API response
 */
export function normalizeOrganizations(
  response: OrganizationListResponse | Organization[] | Organization | null | undefined,
): NormalizedOrganization[] {
  return extractOrganizations(response).map(normalizeOrganization);
}

/**
 * Transform and normalize members from API response
 */
export function normalizeMembers(
  response: MemberListResponse | Member[] | null | undefined,
): NormalizedMember[] {
  return extractMembers(response).map(normalizeMember);
}

/**
 * Transform and normalize teams from API response
 */
export function normalizeTeams(
  response: TeamListResponse | Team[] | null | undefined,
): NormalizedTeam[] {
  return extractTeams(response).map(normalizeTeam);
}

/**
 * Transform and normalize invitations from API response
 */
export function normalizeInvitations(
  response: InvitationListResponse | Invitation[] | null | undefined,
): NormalizedInvitation[] {
  return extractInvitations(response).map(normalizeInvitation);
}

