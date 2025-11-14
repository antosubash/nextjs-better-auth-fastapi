export type JobTriggerType = "cron" | "interval" | "once";

export interface Job {
  id: string;
  name: string | null;
  func_ref: string;
  trigger: string;
  next_run_time: string | null;
  pending: boolean;
  paused: boolean;
}

export interface JobCreate {
  job_id: string;
  function: string;
  trigger_type: JobTriggerType;
  cron_expression?: string | null;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  run_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  args?: unknown[];
  kwargs?: Record<string, unknown>;
  replace_existing?: boolean;
}

export interface JobListResponse {
  items: Job[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface JobHistory {
  id: string;
  job_id: string;
  function: string;
  func_ref: string;
  trigger: string;
  trigger_type: string;
  status: string;
  args: Record<string, unknown> | null;
  kwargs: Record<string, unknown> | null;
  next_run_time: string | null;
  error_message: string | null;
  logs: string | null;
  user_id: string | null;
  created_at: string;
}

export interface JobHistoryListResponse {
  items: JobHistory[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
