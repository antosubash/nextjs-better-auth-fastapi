"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { getAssignableUserRoles } from "@/lib/permissions-api";
import { RoleInfo } from "@/lib/permissions-utils";
import {
  ADMIN_LABELS,
  ADMIN_ERRORS,
  ADMIN_SUCCESS,
  ADMIN_PAGINATION,
  USER_ROLES,
  ROLE_DISPLAY_NAMES,
} from "@/lib/constants";
import { UserForm } from "./user-form";
import { UserActions } from "./user-actions";
import { UserDetails } from "./user-details";
import { UserFilters } from "./user-filters";
import { UserBulkActions } from "./user-bulk-actions";
import { Search, Plus, Users, ChevronsLeft, ChevronsRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { exportUsers } from "@/lib/utils/user-export";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { CheckCircle2, XCircle } from "lucide-react";

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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchValue, setSearchValue] = useState("");
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
  const [availableRoles, setAvailableRoles] = useState<RoleInfo[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  const loadRoles = useCallback(async () => {
    try {
      const roles = await getAssignableUserRoles();
      setAvailableRoles(roles);
    } catch (err) {
      console.error("Failed to load roles:", err);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");
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
        setError(result.error.message || ADMIN_ERRORS.LOAD_USERS_FAILED);
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
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (usersToFilter: User[]) => {
    let filtered = [...usersToFilter];

    if (filterRole !== "all") {
      filtered = filtered.filter((u) => u.role === filterRole);
    }

    if (filterStatus === "active") {
      filtered = filtered.filter((u) => !u.banned);
    } else if (filterStatus === "banned") {
      filtered = filtered.filter((u) => u.banned);
    }

    if (dateFrom) {
      const fromTimestamp = dateFrom.getTime();
      filtered = filtered.filter((u) => u.createdAt >= fromTimestamp);
    }

    if (dateTo) {
      const toTimestamp = dateTo.getTime() + 24 * 60 * 60 * 1000 - 1;
      filtered = filtered.filter((u) => u.createdAt <= toTimestamp);
    }

    setUsers(filtered);
    setTotalUsers(filtered.length);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  useEffect(() => {
    applyFilters(allUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole, filterStatus, dateFrom, dateTo]);

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
    setSuccess(ADMIN_SUCCESS.USER_CREATED);
    setTimeout(() => setSuccess(""), 3000);
    loadUsers();
  };

  const handleUserDeleted = () => {
    setSuccess(ADMIN_SUCCESS.USER_DELETED);
    setTimeout(() => setSuccess(""), 3000);
    setSelectedUserIds(new Set());
    loadUsers();
  };

  const handleActionSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
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
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
    setSelectedUserIds(new Set());
    loadUsers();
  };

  const handleBulkError = (message: string) => {
    setError(message);
    setTimeout(() => setError(""), 5000);
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

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div>
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

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

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
            <div className="p-8 text-center">
              <Skeleton className="h-8 w-48 mx-auto" />
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">{ADMIN_LABELS.NO_USERS}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
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
                    {paginatedUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedUser(user)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedUserIds.has(user.id)}
                            onCheckedChange={(checked) =>
                              handleSelectUser(user.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {ROLE_DISPLAY_NAMES[user.role as keyof typeof ROLE_DISPLAY_NAMES] ||
                              user.role ||
                              USER_ROLES.USER}
                          </Badge>
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
                    ))}
                  </TableBody>
                </Table>
              </div>

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
                      {getPageNumbers().map((page, idx) => (
                        <PaginationItem key={idx}>
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
                      ))}
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
