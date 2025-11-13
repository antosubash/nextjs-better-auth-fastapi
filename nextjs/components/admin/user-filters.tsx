"use client";

import { ADMIN_FILTERS, ADMIN_LABELS, ROLE_DISPLAY_NAMES } from "@/lib/constants";
import { RoleInfo } from "@/lib/permissions-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { format } from "date-fns";

type FilterStatus = "all" | "active" | "banned";

interface UserFiltersProps {
  filterRole: string;
  filterStatus: FilterStatus;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  showFilters: boolean;
  availableRoles: RoleInfo[];
  onFilterRoleChange: (value: string) => void;
  onFilterStatusChange: (value: FilterStatus) => void;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onShowFiltersChange: (show: boolean) => void;
  onClearFilters: () => void;
}

export function UserFilters({
  filterRole,
  filterStatus,
  dateFrom,
  dateTo,
  showFilters,
  availableRoles,
  onFilterRoleChange,
  onFilterStatusChange,
  onDateFromChange,
  onDateToChange,
  onShowFiltersChange,
  onClearFilters,
}: UserFiltersProps) {
  const activeFilterCount = [
    filterRole !== "all" ? 1 : 0,
    filterStatus !== "all" ? 1 : 0,
    dateFrom ? 1 : 0,
    dateTo ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="mb-4 space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => onShowFiltersChange(!showFilters)}>
          <Filter className="w-4 h-4 mr-2" />
          {ADMIN_FILTERS.FILTER_BY_DATE}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{ADMIN_FILTERS.FILTER_BY_DATE}</h3>
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                <X className="w-4 h-4 mr-2" />
                {ADMIN_FILTERS.CLEAR_FILTERS}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{ADMIN_FILTERS.FILTER_BY_ROLE}</Label>
                <Select value={filterRole} onValueChange={onFilterRoleChange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{ADMIN_FILTERS.ALL_ROLES}</SelectItem>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.name} value={role.name}>
                        {ROLE_DISPLAY_NAMES[role.name as keyof typeof ROLE_DISPLAY_NAMES] ||
                          role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{ADMIN_FILTERS.FILTER_BY_STATUS}</Label>
                <Select
                  value={filterStatus}
                  onValueChange={(value) => onFilterStatusChange(value as FilterStatus)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{ADMIN_FILTERS.ALL_STATUSES}</SelectItem>
                    <SelectItem value="active">{ADMIN_LABELS.ACTIVE}</SelectItem>
                    <SelectItem value="banned">{ADMIN_LABELS.BANNED}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{ADMIN_FILTERS.DATE_FROM}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-2 justify-start text-left font-normal"
                    >
                      {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={onDateFromChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>{ADMIN_FILTERS.DATE_TO}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-2 justify-start text-left font-normal"
                    >
                      {dateTo ? format(dateTo, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={onDateToChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
