"use client";

import {
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Plus,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import {
  ADMIN_ERRORS,
  ADMIN_LABELS,
  ADMIN_NAVIGATION,
  ADMIN_PAGINATION,
  ADMIN_SUCCESS,
  ROLE_DISPLAY_NAMES,
  USER_ROLES,
} from "@/lib/constants";
import { useToast } from "@/lib/hooks/use-toast";
import { useAssignableUserRoles } from "@/lib/hooks/api/use-permissions";
import { exportUsers } from "@/lib/utils/user-export";
import { UserActions } from "./user-actions";
import { UserBulkActions } from "./user-bulk-actions";
import { UserDetails } from "./user-details";
import { UserFilters } from "./user-filters";
import { UserForm } from "./user-form";

interface User {
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

type FilterStatus = "all" | "active" | "banned";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const toast = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  const { data: availableRoles = [] } = useAssignableUserRoles();

  const filterByRole = useCallback(
    (users: User[]): User[] => {
      if (filterRole === "all") return users;
      return users.filter((u) => u.role === filterRole);
    },
    [filterRole]
  );

  const getUserRoleDisplay = (role: string) => {
    return (
      ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES] || role || USER_ROLES.USER
    );
  };

  const renderUserRow = (user: User) => {
    return (
      <TableRow
        key={user.id}
        className="cursor-pointer"
        onClick={() => setSelectedUser(user)}
      >
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedUserIds.has(user.id)}
            onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
          />
        </TableCell>
        <TableCell>
          <HoverCard>
            <HoverCardTrigger asChild>
              <span className="font-medium cursor-pointer hover:underline">{user.name}</span>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-semibold">{user.name}</h4>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium">Role:</span> {getUserRoleDisplay(user.role)}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {user.banned ? ADMIN_LABELS.BANNED : ADMIN_LABELS.ACTIVE}
                  </p>
                  <p>
                    <span className="font-medium">Email Verified:</span>{" "}
                    {user.emailVerified
                      ? ADMIN_LABELS.EMAIL_VERIFIED
                      : ADMIN_LABELS.EMAIL_NOT_VERIFIED}
                  </p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>
          <Badge variant="secondary">{getUserRoleDisplay(user.role)}</Badge>
        </TableCell>
        <TableCell>
          {user.banned ? (
            <Badge variant="destructive">{ADMIN_LABELS.BANNED}</Badge>
          ) : (
            <Badge variant="default">{ADMIN_LABELS.ACTIVE}</Badge>
          )}
        </TableCell>
        <TableCell>{formatDate(user.createdAt)}</TableCell>
        <TableCell>
          {user.emailVerified ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {ADMIN_LABELS.EMAIL_VERIFIED}
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XCircle className="w-3 h-3" />
              {ADMIN_LABELS.EMAIL_NOT_VERIFIED}
            </Badge>
          )}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <UserActions user={user} />
        </TableCell>
      </TableRow>
    );
  };

  const filterByStatus = useCallback(
    (users: User[]): User[] => {
      if (filterStatus === "active") {
        return users.filter((u) => !u.banned);
      }
      if (filterStatus === "banned") {
        return users.filter((u) => u.banned);
      }
      return users;
    },
    [filterStatus]
  );

  const filterByDateRange = useCallback(
    (users: User[]): User[] => {
      let filtered = users;

      if (dateFrom) {
        const fromTimestamp = dateFrom.getTime();
        filtered = filtered.filter((u) => u.createdAt >= fromTimestamp);
      }

      if (dateTo) {
        const toTimestamp = dateTo.getTime() + 24 * 60 * 60 * 1000 - 1;
        filtered = filtered.filter((u) => u.createdAt <= toTimestamp);
      }

      return filtered;
    },
    [dateFrom, dateTo]
  );

  const applyFilters = useCallback(
    (usersToFilter: User[]) => {
      let filtered = filterByRole(usersToFilter);
      filtered = filterByStatus(filtered);
      filtered = filterByDateRange(filtered);

      setUsers(filtered);
      setTotalUsers(filtered.length);
      setCurrentPage(1);
    },
    [filterByRole, filterByStatus, filterByDateRange]
  );

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await authClient.admin.listUsers({
        query: {
          searchValue: searchValue || undefined,
          limit: "1000",
          offset: "0",
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });

      if (result.error) {
        toast.error(result.error.message || ADMIN_ERRORS.LOAD_USERS_FAILED);
      } else if (result.data) {
        const usersData = (result.data as { users?: User[] })?.users || [];
        const processedUsers = usersData.map((u) => ({
          ...u,
          banned: u.banned ?? false,
          emailVerified: u.emailVerified ?? false,
        }));
        setAllUsers(processedUsers);
        applyFilters(processedUsers);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ADMIN_ERRORS.LOAD_USERS_FAILED;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [searchValue, applyFilters, toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (allUsers.length > 0) {
      applyFilters(allUsers);
    }
  }, [applyFilters, allUsers]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const clearFilters = () => {
    setFilterRole("all");
    setFilterStatus("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleUserCreated = () => {
    setShowCreateForm(false);
    toast.success(ADMIN_SUCCESS.USER_CREATED);
    loadUsers();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageStart = (currentPage - 1) * itemsPerPage;
      const pageEnd = pageStart + itemsPerPage;
      const pageUsers = users.slice(pageStart, pageEnd);
      setSelectedUserIds(new Set(pageUsers.map((u) => u.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleBulkSuccess = (message: string) => {
    toast.success(message);
    setSelectedUserIds(new Set());
    loadUsers();
  };

  const handleBulkError = (message: string) => {
    toast.error(message);
  };

  const handleBulkComplete = () => {
    loadUsers();
  };

  const handleExport = () => {
    exportUsers(users, exportFormat);
    setShowExportDialog(false);
  };

  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const pageStart = (currentPage - 1) * itemsPerPage;
  const pageEnd = pageStart + itemsPerPage;
  const paginatedUsers = users.slice(pageStart, pageEnd);
  const allPageSelected =
    paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.has(u.id));

  const buildPagesForStart = (totalPages: number): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    for (let i = 1; i <= 5; i++) {
      pages.push(i);
    }
    pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  };

  const buildPagesForEnd = (totalPages: number): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [1, "ellipsis"];
    for (let i = totalPages - 4; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  const buildPagesForMiddle = (
    currentPage: number,
    totalPages: number
  ): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [1, "ellipsis"];
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      pages.push(i);
    }
    pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  };

  const getPageNumbers = (): (number | "ellipsis")[] => {
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
  };

  return (
    <div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/dashboard">{ADMIN_NAVIGATION.DASHBOARD}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{ADMIN_NAVIGATION.USER_MANAGEMENT}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8" />
          <h1 className="text-3xl font-bold">{ADMIN_LABELS.TITLE}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <Download className="w-5 h-5 mr-2" />
            {ADMIN_LABELS.EXPORT_USERS}
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-5 h-5 mr-2" />
            {ADMIN_LABELS.CREATE_USER}
          </Button>
        </div>
      </div>

      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{ADMIN_LABELS.CREATE_USER}</DialogTitle>
          </DialogHeader>
          <UserForm onSuccess={handleUserCreated} onCancel={() => setShowCreateForm(false)} />
        </DialogContent>
      </Dialog>

      <UserDetails
        user={selectedUser}
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      />

      <div className="mb-4 space-y-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={ADMIN_LABELS.SEARCH_USERS}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <UserFilters
          filterRole={filterRole}
          filterStatus={filterStatus}
          dateFrom={dateFrom}
          dateTo={dateTo}
          showFilters={showFilters}
          availableRoles={availableRoles}
          onFilterRoleChange={setFilterRole}
          onFilterStatusChange={setFilterStatus}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onShowFiltersChange={setShowFilters}
          onClearFilters={clearFilters}
        />

        <UserBulkActions
          selectedUserIds={selectedUserIds}
          users={allUsers}
          availableRoles={availableRoles}
          onSuccess={handleBulkSuccess}
          onError={handleBulkError}
          onComplete={handleBulkComplete}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                {Array.from({ length: itemsPerPage }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton loaders are static and won't reorder
                  <div key={`skeleton-${i}`} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">{ADMIN_LABELS.NO_USERS}</div>
          ) : (
            <>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox checked={allPageSelected} onCheckedChange={handleSelectAll} />
                      </TableHead>
                      <TableHead>{ADMIN_LABELS.NAME}</TableHead>
                      <TableHead>{ADMIN_LABELS.EMAIL}</TableHead>
                      <TableHead>{ADMIN_LABELS.ROLE}</TableHead>
                      <TableHead>{ADMIN_LABELS.STATUS}</TableHead>
                      <TableHead>{ADMIN_LABELS.CREATED_AT}</TableHead>
                      <TableHead>{ADMIN_LABELS.EMAIL_VERIFIED}</TableHead>
                      <TableHead>{ADMIN_LABELS.ACTIONS}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => renderUserRow(user))}
                  </TableBody>
                </Table>
              </ScrollArea>

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
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
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
                            setCurrentPage(1);
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
                            setCurrentPage((p) => Math.max(1, p - 1));
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {getPageNumbers().map((page, idx, arr) => {
                        // For numbers, use the number itself as key
                        // For ellipsis, use position relative to surrounding pages for uniqueness
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
                                  setCurrentPage(page);
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
                            setCurrentPage((p) => Math.min(totalPages, p + 1));
                          }}
                          className={
                            currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                          }
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(totalPages);
                          }}
                          className={
                            currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                          }
                        >
                          <ChevronsRight className="w-4 h-4" />
                        </PaginationLink>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ADMIN_LABELS.EXPORT_USERS}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{ADMIN_LABELS.EXPORT_FORMAT}</Label>
              <Select
                value={exportFormat}
                onValueChange={(value) => setExportFormat(value as "csv" | "json")}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">{ADMIN_LABELS.EXPORT_CSV}</SelectItem>
                  <SelectItem value="json">{ADMIN_LABELS.EXPORT_JSON}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Exporting {users.length} user(s) with current filters applied.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              {ADMIN_LABELS.CANCEL}
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              {ADMIN_LABELS.EXPORT_USERS}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
