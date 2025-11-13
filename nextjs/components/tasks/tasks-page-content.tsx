"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
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
import { TaskList } from "@/components/tasks/task-list";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TASK_LABELS, TASK_ERRORS, TASK_SUCCESS, PAGE_CONTAINER } from "@/lib/constants";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/api/tasks";
import type { Task, TaskCreate, TaskStatus } from "@/lib/types/task";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function TasksPageContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuthAndLoadTasks = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.session) {
          router.push("/");
          return;
        }

        setIsAuthorized(true);
        await loadTasks();
      } catch (err) {
        console.error("Failed to load tasks:", err);
        setError(err instanceof Error ? err.message : TASK_ERRORS.LOAD_TASKS_FAILED);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadTasks();
  }, [router]);

  useEffect(() => {
    if (isAuthorized) {
      loadTasks();
    }
  }, [page, pageSize, statusFilter, isAuthorized]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await getTasks(page, pageSize, statusFilter || undefined);
      setTasks(response.items);
      setTotal(response.total);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setError(err instanceof Error ? err.message : TASK_ERRORS.LOAD_TASKS_FAILED);
      toast.error(TASK_ERRORS.LOAD_TASKS_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingTask(undefined);
    setIsDialogOpen(true);
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: TaskCreate) => {
    try {
      setIsSubmitting(true);
      setError("");

      if (editingTask) {
        await updateTask(editingTask.id, data);
        toast.success(TASK_SUCCESS.TASK_UPDATED);
      } else {
        await createTask(data);
        toast.success(TASK_SUCCESS.TASK_CREATED);
      }

      setIsDialogOpen(false);
      setEditingTask(undefined);
      await loadTasks();
    } catch (err) {
      console.error("Failed to save task:", err);
      const errorMessage = editingTask
        ? TASK_ERRORS.UPDATE_FAILED
        : TASK_ERRORS.CREATE_FAILED;
      setError(err instanceof Error ? err.message : errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast.success(TASK_SUCCESS.TASK_DELETED);
      await loadTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
      toast.error(TASK_ERRORS.DELETE_FAILED);
      throw err;
    }
  };

  const handleStatusFilterChange = (status: TaskStatus | null) => {
    setStatusFilter(status);
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize) || 0;

  if (isLoading && !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">{TASK_LABELS.LOADING}</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <main className={PAGE_CONTAINER.CLASS}>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {TASK_LABELS.TITLE}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {TASK_LABELS.SHOWING} {Math.min((page - 1) * pageSize + 1, total)} {TASK_LABELS.TO}{" "}
              {Math.min(page * pageSize, total)} {TASK_LABELS.OF} {total} {TASK_LABELS.TASKS}
            </p>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            {TASK_LABELS.CREATE_TASK}
          </Button>
        </div>

        <div className="mb-6">
          <TaskFilters statusFilter={statusFilter} onStatusFilterChange={handleStatusFilterChange} />
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <TaskList tasks={tasks} onEdit={handleEditClick} onDelete={handleDelete} isLoading={isLoading} />

      {totalPages > 1 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{TASK_LABELS.ITEMS_PER_PAGE}:</span>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(Math.max(1, page - 1));
                      }}
                      className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(pageNum);
                          }}
                          isActive={page === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(Math.min(totalPages, page + 1));
                      }}
                      className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      )}

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={editingTask}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}

