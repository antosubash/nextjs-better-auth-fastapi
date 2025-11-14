"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TASK_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";
import type { Task, TaskStatus } from "@/lib/types/task";
import { Edit, Trash2 } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
  isLoading?: boolean;
}

function getStatusBadgeVariant(status: TaskStatus): "default" | "secondary" | "outline" {
  switch (status) {
    case "pending":
      return "outline";
    case "in_progress":
      return "secondary";
    case "completed":
      return "default";
    default:
      return "outline";
  }
}

function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case "pending":
      return TASK_LABELS.PENDING;
    case "in_progress":
      return TASK_LABELS.IN_PROGRESS;
    case "completed":
      return TASK_LABELS.COMPLETED;
    default:
      return status;
  }
}

export function TaskList({ tasks, onEdit, onDelete, isLoading }: TaskListProps) {
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (taskId: string) => {
    setDeleteTaskId(taskId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTaskId) return;

    setIsDeleting(true);
    try {
      await onDelete(deleteTaskId);
      setDeleteTaskId(null);
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{TASK_LABELS.LOADING}</p>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{TASK_LABELS.NO_TASKS}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-2">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(task)}
                    aria-label={TASK_LABELS.EDIT_TASK}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(task.id)}
                    aria-label={TASK_LABELS.DELETE_TASK}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">{TASK_LABELS.TASK_CREATED_AT}:</span>{" "}
                  {formatDate(task.created_at)}
                </div>
                <div>
                  <span className="font-medium">{TASK_LABELS.TASK_UPDATED_AT}:</span>{" "}
                  {formatDate(task.updated_at)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={deleteTaskId !== null}
        onOpenChange={(open) => !open && setDeleteTaskId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{TASK_LABELS.DELETE_TASK}</AlertDialogTitle>
            <AlertDialogDescription>{TASK_LABELS.CONFIRM_DELETE}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{TASK_LABELS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? TASK_LABELS.DELETING : TASK_LABELS.DELETE_TASK}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
