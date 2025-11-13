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
