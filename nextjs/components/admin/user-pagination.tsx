"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ADMIN_PAGINATION } from "@/lib/constants";
import { getPageNumbers } from "./user-list-utils";

interface UserPaginationProps {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  pageStart: number;
  pageEnd: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export function UserPagination({
  currentPage,
  totalPages,
  totalUsers,
  pageStart,
  pageEnd,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: UserPaginationProps) {
  return (
    <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {ADMIN_PAGINATION.SHOWING} {pageStart + 1} {ADMIN_PAGINATION.TO}{" "}
          {Math.min(pageEnd, totalUsers)} {ADMIN_PAGINATION.OF} {totalUsers}{" "}
          {ADMIN_PAGINATION.USERS}
        </span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => {
            onItemsPerPageChange(Number(value));
          }}
        >
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(1);
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              >
                <ChevronsLeft className="w-4 h-4" />
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(Math.max(1, currentPage - 1));
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {getPageNumbers(currentPage, totalPages).map((page, idx, arr) => {
              const key =
                typeof page === "number"
                  ? `page-${page}`
                  : `ellipsis-${arr[idx - 1]}-${arr[idx + 1]}`;
              return (
                <PaginationItem key={key}>
                  {page === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(page);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(Math.min(totalPages, currentPage + 1));
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(totalPages);
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              >
                <ChevronsRight className="w-4 h-4" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
