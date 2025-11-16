export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: number;
  createdAt: number;
  emailVerified?: boolean;
}

export type FilterStatus = "all" | "active" | "banned";

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildPagesForStart(totalPages: number): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [];
  for (let i = 1; i <= 5; i++) {
    pages.push(i);
  }
  pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

function buildPagesForEnd(totalPages: number): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [1, "ellipsis"];
  for (let i = totalPages - 4; i <= totalPages; i++) {
    pages.push(i);
  }
  return pages;
}

function buildPagesForMiddle(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [1, "ellipsis"];
  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
    pages.push(i);
  }
  pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

export function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  const maxVisible = 7;

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return buildPagesForStart(totalPages);
  }

  if (currentPage >= totalPages - 2) {
    return buildPagesForEnd(totalPages);
  }

  return buildPagesForMiddle(currentPage, totalPages);
}
