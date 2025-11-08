"use client";

import { OrganizationList } from "@/components/organization/organization-list";

export default function OrganizationsPage() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <OrganizationList />
    </main>
  );
}

