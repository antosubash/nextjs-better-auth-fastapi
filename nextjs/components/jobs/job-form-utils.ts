import { JOB_ERRORS } from "@/lib/constants";
import type { JobCreate, JobTriggerType } from "@/lib/types/job";
import type { JobFormValues } from "./job-form-schema";

export function serializeArgs(args: unknown): string {
  return args ? JSON.stringify(args) : "";
}

export function parseArgs(argsString: string | undefined): unknown[] {
  if (!argsString) return [];
  try {
    return JSON.parse(argsString);
  } catch {
    throw new Error(JOB_ERRORS.INVALID_ARGS);
  }
}

export function parseKwargs(kwargsString: string | undefined): Record<string, unknown> {
  if (!kwargsString) return {};
  try {
    return JSON.parse(kwargsString);
  } catch {
    throw new Error(JOB_ERRORS.INVALID_KWARGS);
  }
}

export function formatDateTimeForInput(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function buildCronTriggerData(values: JobFormValues): Partial<JobCreate> {
  if (values.trigger_type !== "cron") return {};
  return {
    cron_expression: values.cron_expression || null,
  };
}

export function buildIntervalTriggerData(values: JobFormValues): Partial<JobCreate> {
  if (values.trigger_type !== "interval") return {};
  return {
    weeks: values.weeks,
    days: values.days,
    hours: values.hours,
    minutes: values.minutes,
    seconds: values.seconds,
  };
}

export function buildOnceTriggerData(values: JobFormValues): Partial<JobCreate> {
  if (values.trigger_type !== "once") return {};
  return {
    run_date: values.run_date || null,
  };
}

export function buildJobData(
  values: JobFormValues,
  args: unknown[],
  kwargs: Record<string, unknown>
): JobCreate {
  return {
    job_id: values.job_id,
    function: values.function,
    trigger_type: values.trigger_type as JobTriggerType,
    ...buildCronTriggerData(values),
    ...buildIntervalTriggerData(values),
    ...buildOnceTriggerData(values),
    start_date: values.start_date || null,
    end_date: values.end_date || null,
    args: args.length > 0 ? args : undefined,
    kwargs: Object.keys(kwargs).length > 0 ? kwargs : undefined,
    replace_existing: values.replace_existing,
  };
}

export function getEmptyDefaultValues(): JobFormValues {
  return {
    job_id: "",
    function: "",
    trigger_type: "cron",
    cron_expression: "",
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    run_date: null,
    start_date: null,
    end_date: null,
    args: "",
    kwargs: "",
    replace_existing: true,
  };
}

export function getDefaultValuesFromInitial(initialValues?: Partial<JobCreate>): JobFormValues {
  if (!initialValues) {
    return getEmptyDefaultValues();
  }

  return {
    job_id: initialValues.job_id || "",
    function: initialValues.function || "",
    trigger_type: initialValues.trigger_type || "cron",
    cron_expression: initialValues.cron_expression || "",
    weeks: initialValues.weeks || 0,
    days: initialValues.days || 0,
    hours: initialValues.hours || 0,
    minutes: initialValues.minutes || 0,
    seconds: initialValues.seconds || 0,
    run_date: initialValues.run_date || null,
    start_date: initialValues.start_date || null,
    end_date: initialValues.end_date || null,
    args: serializeArgs(initialValues.args),
    kwargs: serializeArgs(initialValues.kwargs),
    replace_existing: initialValues.replace_existing ?? true,
  };
}
