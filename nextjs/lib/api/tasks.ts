import { callFastApi } from "@/lib/api-client";
import type { Task, TaskCreate, TaskListResponse, TaskUpdate } from "@/lib/types/task";

export async function getTasks(
  page: number = 1,
  pageSize: number = 10,
  statusFilter?: string | null
): Promise<TaskListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (statusFilter) {
    params.append("status_filter", statusFilter);
  }

  return callFastApi<TaskListResponse>(`/tasks?${params.toString()}`);
}

export async function getTask(id: string): Promise<Task> {
  return callFastApi<Task>(`/tasks/${id}`);
}

export async function createTask(data: TaskCreate): Promise<Task> {
  return callFastApi<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTask(id: string, data: TaskUpdate): Promise<Task> {
  return callFastApi<Task>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: string): Promise<void> {
  return callFastApi<void>(`/tasks/${id}`, {
    method: "DELETE",
  });
}

