import { callFastApi } from "@/lib/api-client";
import type {
  Job,
  JobCreate,
  JobHistoryListResponse,
  JobListResponse,
} from "@/lib/types/job";

export async function getJobs(page: number = 1, pageSize: number = 10): Promise<JobListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  return callFastApi<JobListResponse>(`/jobs?${params.toString()}`);
}

export async function getJob(id: string): Promise<Job> {
  return callFastApi<Job>(`/jobs/${id}`);
}

export async function createJob(data: JobCreate): Promise<Job> {
  return callFastApi<Job>("/jobs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteJob(id: string): Promise<void> {
  return callFastApi<void>(`/jobs/${id}`, {
    method: "DELETE",
  });
}

export async function pauseJob(id: string): Promise<Job> {
  return callFastApi<Job>(`/jobs/${id}/pause`, {
    method: "POST",
  });
}

export async function resumeJob(id: string): Promise<Job> {
  return callFastApi<Job>(`/jobs/${id}/resume`, {
    method: "POST",
  });
}

export async function getJobHistory(
  jobId?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<JobHistoryListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (jobId) {
    params.append("job_id", jobId);
  }

  return callFastApi<JobHistoryListResponse>(`/jobs/history?${params.toString()}`);
}
