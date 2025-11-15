"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TASK_LABELS } from "@/lib/constants";
import type { Task, TaskCreate } from "@/lib/types/task";
import { TaskForm } from "./task-form";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  onSubmit: (data: TaskCreate) => Promise<void>;
  isSubmitting?: boolean;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  onSubmit,
  isSubmitting = false,
}: TaskDialogProps) {
  const handleSubmit = async (data: TaskCreate) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? TASK_LABELS.EDIT_TASK : TASK_LABELS.CREATE_TASK}</DialogTitle>
          <DialogDescription>
            {task
              ? `${TASK_LABELS.EDIT_TASK.toLowerCase()} details`
              : `${TASK_LABELS.CREATE_TASK.toLowerCase()} a new task`}
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          task={task}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
