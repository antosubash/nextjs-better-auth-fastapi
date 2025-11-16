"use client";

import { Download, Plus, Search, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ADMIN_LABELS, ADMIN_NAVIGATION, ADMIN_SUCCESS } from "@/lib/constants";
import { useAdminListUsers } from "@/lib/hooks/api/use-auth";
import { useAssignableUserRoles } from "@/lib/hooks/api/use-permissions";
import { useToast } from "@/lib/hooks/use-toast";
import { exportUsers } from "@/lib/utils/user-export";
import { UserBulkActions } from "./user-bulk-actions";
import { UserDetails } from "./user-details";
import { UserFilters } from "./user-filters";
import { UserForm } from "./user-form";
import type { FilterStatus, User } from "./user-list-utils";
import { UserPagination } from "./user-pagination";
import { UserRow } from "./user-row";

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
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

  const {
    data: usersData,
    isLoading,
    refetch: refetchUsers,
  } = useAdminListUsers({
    searchValue: searchValue || undefined,
    limit: "1000",
    offset: "0",
    sortBy: "createdAt",
    sortDirection: "desc",
  });

  const filterByRole = useCallback(
    (users: User[]): User[] => {
      if (filterRole === "all") return users;
      return users.filter((u) => u.role === filterRole);
    },
    [filterRole]
  );

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

  useEffect(() => {
    if (usersData) {
      const usersArray = (usersData as { users?: User[] })?.users || [];
      const processedUsers = usersArray.map((u) => ({
        ...u,
        banned: u.banned ?? false,
        emailVerified: u.emailVerified ?? false,
      }));
      setAllUsers(processedUsers);
      applyFilters(processedUsers);
    }
  }, [usersData, applyFilters]);

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
    refetchUsers();
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
    refetchUsers();
  };

  const handleBulkError = (message: string) => {
    toast.error(message);
  };

  const handleBulkComplete = () => {
    refetchUsers();
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
                    {paginatedUsers.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        selectedUserIds={selectedUserIds}
                        onSelectUser={handleSelectUser}
                        onUserClick={setSelectedUser}
                      />
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <UserPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalUsers={totalUsers}
                pageStart={pageStart}
                pageEnd={pageEnd}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value) => {
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
              />
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
