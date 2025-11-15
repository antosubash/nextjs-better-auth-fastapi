import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTask, getTasks } from "@/lib/api/tasks";
import { queryKeys } from "./query-keys";
import type { TaskCreate, TaskUpdate } from "@/lib/types/task";
import { createTask, deleteTask, updateTask } from "@/lib/api/tasks";
import { toast } from "sonner";
import { TASK_ERRORS, TASK_SUCCESS } from "@/lib/constants";

export function useTasks(page: number = 1, pageSize: number = 10, statusFilter?: string | null) {
  return useQuery({
    queryKey: queryKeys.tasks.list(page, pageSize, statusFilter),
    queryFn: () => getTasks(page, pageSize, statusFilter),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => getTask(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskCreate) => createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      toast.success(TASK_SUCCESS.TASK_CREATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || TASK_ERRORS.CREATE_FAILED);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskUpdate }) => updateTask(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(variables.id) });
      toast.success(TASK_SUCCESS.TASK_UPDATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || TASK_ERRORS.UPDATE_FAILED);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      toast.success(TASK_SUCCESS.TASK_DELETED);
    },
    onError: (error: Error) => {
      toast.error(error.message || TASK_ERRORS.DELETE_FAILED);
    },
  });
}
