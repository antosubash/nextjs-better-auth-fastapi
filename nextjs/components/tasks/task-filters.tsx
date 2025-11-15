"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TASK_LABELS } from "@/lib/constants";
import type { TaskStatus } from "@/lib/types/task";

interface TaskFiltersProps {
  statusFilter: TaskStatus | null;
  onStatusFilterChange: (status: TaskStatus | null) => void;
}

export function TaskFilters({ statusFilter, onStatusFilterChange }: TaskFiltersProps) {
  const statuses: Array<{ value: TaskStatus | null; label: string }> = [
    { value: null, label: TASK_LABELS.ALL_STATUSES },
    { value: "pending", label: TASK_LABELS.PENDING },
    { value: "in_progress", label: TASK_LABELS.IN_PROGRESS },
    { value: "completed", label: TASK_LABELS.COMPLETED },
  ];

  return (
    <ToggleGroup
      type="single"
      value={statusFilter || "all"}
      onValueChange={(value) =>
        onStatusFilterChange(value === "all" ? null : (value as TaskStatus))
      }
      variant="outline"
      size="sm"
      className="flex flex-wrap"
    >
      {statuses.map((status) => (
        <ToggleGroupItem
          key={status.value || "all"}
          value={status.value || "all"}
          aria-label={status.label}
        >
          {status.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
