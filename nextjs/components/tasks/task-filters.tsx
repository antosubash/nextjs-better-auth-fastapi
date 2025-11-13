"use client";

import { Button } from "@/components/ui/button";
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
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <Button
          key={status.value || "all"}
          variant={statusFilter === status.value ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusFilterChange(status.value)}
        >
          {status.label}
        </Button>
      ))}
    </div>
  );
}
