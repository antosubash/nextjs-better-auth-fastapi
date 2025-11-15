import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJob, getJobHistory, getJobs } from "@/lib/api/jobs";
import { queryKeys } from "./query-keys";
import type { JobCreate } from "@/lib/types/job";
import { createJob, deleteJob, pauseJob, resumeJob } from "@/lib/api/jobs";
import { toast } from "sonner";
import { JOB_ERRORS, JOB_SUCCESS } from "@/lib/constants";

export function useJobs(page: number = 1, pageSize: number = 10, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.jobs.list(page, pageSize),
    queryFn: () => getJobs(page, pageSize),
    enabled: options?.enabled !== false,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(id),
    queryFn: () => getJob(id),
    enabled: !!id,
  });
}

export function useJobHistory(jobId: string | undefined, page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: queryKeys.jobs.historyList(jobId, page, pageSize),
    queryFn: () => getJobHistory(jobId, page, pageSize),
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JobCreate) => createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      toast.success(JOB_SUCCESS.JOB_CREATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || JOB_ERRORS.CREATE_FAILED);
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.history() });
      toast.success(JOB_SUCCESS.JOB_DELETED);
    },
    onError: (error: Error) => {
      toast.error(error.message || JOB_ERRORS.DELETE_FAILED);
    },
  });
}

export function usePauseJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pauseJob(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(id) });
      toast.success(JOB_SUCCESS.JOB_PAUSED);
    },
    onError: (error: Error) => {
      toast.error(error.message || JOB_ERRORS.PAUSE_FAILED);
    },
  });
}

export function useResumeJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resumeJob(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(id) });
      toast.success(JOB_SUCCESS.JOB_RESUMED);
    },
    onError: (error: Error) => {
      toast.error(error.message || JOB_ERRORS.RESUME_FAILED);
    },
  });
}
