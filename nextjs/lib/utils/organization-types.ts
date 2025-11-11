/**
 * Shared TypeScript types and interfaces for organization-related components
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: {
    description?: string;
    [key: string]: unknown;
  };
  createdAt: number | Date | string;
}

export interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: number | Date | string;
  user?: {
    email: string;
    name?: string;
    [key: string]: unknown;
  };
}

export interface Team {
  id: string;
  name: string;
  createdAt: number | Date | string;
  organizationId?: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: number | Date | string;
  expiresAt?: number | Date | string;
  organizationId?: string;
  inviterId?: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  createdAt: number | Date | string;
  user?: {
    email: string;
    name?: string;
    [key: string]: unknown;
  };
}

/**
 * API Response types
 */
export interface OrganizationListResponse {
  organizations?: Organization[];
  data?: Organization[] | Organization;
}

export interface MemberListResponse {
  members?: Member[];
  data?: Member[] | { members?: Member[] };
}

export interface TeamListResponse {
  teams?: Team[];
  data?: Team[] | { teams?: Team[] };
}

export interface InvitationListResponse {
  invitations?: Invitation[];
  data?: Invitation[] | { invitations?: Invitation[] };
}

/**
 * Component prop types
 */
export interface OrganizationFormProps {
  organization?: Organization | null;
  onSuccess: () => void;
  onCancel: () => void;
  hideHeader?: boolean;
}

export interface MemberListProps {
  organizationId: string;
}

export interface TeamListProps {
  organizationId: string;
}

export interface InvitationListProps {
  organizationId: string;
}

export interface TeamMemberListProps {
  teamId: string;
}

/**
 * Type guards
 */
export function isOrganization(data: unknown): data is Organization {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "name" in data &&
    "slug" in data
  );
}

export function isMember(data: unknown): data is Member {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "userId" in data &&
    "role" in data
  );
}

export function isTeam(data: unknown): data is Team {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "name" in data
  );
}

export function isInvitation(data: unknown): data is Invitation {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "email" in data &&
    "role" in data &&
    "status" in data
  );
}

/**
 * Helper type for normalized dates (always number)
 */
export interface NormalizedOrganization extends Omit<Organization, "createdAt"> {
  createdAt: number;
}

export interface NormalizedMember extends Omit<Member, "createdAt"> {
  createdAt: number;
}

export interface NormalizedTeam extends Omit<Team, "createdAt"> {
  createdAt: number;
}

export interface NormalizedInvitation extends Omit<Invitation, "createdAt" | "expiresAt"> {
  createdAt: number;
  expiresAt?: number;
}

