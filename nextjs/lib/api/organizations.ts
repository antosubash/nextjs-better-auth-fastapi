export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  metadata?: {
    description?: string;
  };
  createdAt: number;
}

export interface OrganizationListResponse {
  organizations: Organization[];
}

export async function getAdminOrganizations(): Promise<OrganizationListResponse> {
  const response = await fetch("/api/admin/organizations");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to load organizations");
  }
  return response.json();
}

export async function getOrganization(id: string): Promise<{ organization: Organization }> {
  const response = await fetch(`/api/admin/organizations/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to load organization");
  }
  return response.json();
}

export async function addOrganizationMember(
  organizationId: string,
  userId: string,
  role: string
): Promise<void> {
  const response = await fetch("/api/auth/organization/add-member", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      organizationId,
      userId,
      role,
    }),
  });

  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || "Failed to add member");
  }
}
