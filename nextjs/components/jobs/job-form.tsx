"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { JOB_ERRORS, JOB_LABELS, JOB_PLACEHOLDERS } from "@/lib/constants";
import type { JobCreate, JobTriggerType } from "@/lib/types/job";

const jobSchema = z
  .object({
    job_id: z.string().min(1, JOB_ERRORS.JOB_ID_REQUIRED),
    function: z.string().min(1, JOB_ERRORS.FUNCTION_REQUIRED),
    trigger_type: z.enum(["cron", "interval", "once"]),
    cron_expression: z.string().optional().nullable(),
    weeks: z.number().min(0),
    days: z.number().min(0),
    hours: z.number().min(0),
    minutes: z.number().min(0),
    seconds: z.number().min(0),
    run_date: z.string().optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    args: z.string().optional(),
    kwargs: z.string().optional(),
    replace_existing: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.trigger_type === "cron") {
        return !!data.cron_expression;
      }
      return true;
    },
    {
      message: JOB_ERRORS.CRON_EXPRESSION_REQUIRED,
      path: ["cron_expression"],
    }
  )
  .refine(
    (data) => {
      if (data.trigger_type === "interval") {
        return (
          data.weeks > 0 || data.days > 0 || data.hours > 0 || data.minutes > 0 || data.seconds > 0
        );
      }
      return true;
    },
    {
      message: JOB_ERRORS.INTERVAL_REQUIRED,
      path: ["seconds"],
    }
  )
  .refine(
    (data) => {
      if (data.args && data.args.trim() !== "") {
        try {
          const parsed = JSON.parse(data.args);
          return Array.isArray(parsed);
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message: JOB_ERRORS.INVALID_ARGS,
      path: ["args"],
    }
  )
  .refine(
    (data) => {
      if (data.kwargs && data.kwargs.trim() !== "") {
        try {
          const parsed = JSON.parse(data.kwargs);
          return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message: JOB_ERRORS.INVALID_KWARGS,
      path: ["kwargs"],
    }
  );

type JobFormValues = z.infer<typeof jobSchema>;

interface JobFormProps {
  onSubmit: (data: JobCreate) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialValues?: Partial<JobCreate>;
}

export function JobForm({ onSubmit, onCancel, isSubmitting = false, initialValues }: JobFormProps) {
  const getEmptyDefaultValues = useCallback((): JobFormValues => {
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
  }, []);

  const serializeArgs = useCallback((args: unknown): string => {
    return args ? JSON.stringify(args) : "";
  }, []);

  const getDefaultValuesFromInitial = useCallback((): JobFormValues => {
    if (!initialValues) {
      return getEmptyDefaultValues();
    }

    const baseValues: JobFormValues = {
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

    return baseValues;
  }, [initialValues, getEmptyDefaultValues, serializeArgs]);

  const getDefaultValues = useCallback((): JobFormValues => {
    return getDefaultValuesFromInitial();
  }, [getDefaultValuesFromInitial]);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(getDefaultValues());
    }
  }, [initialValues, form.reset, getDefaultValues]);

  const triggerType = form.watch("trigger_type");

  const parseArgs = (argsString: string | undefined): unknown[] => {
    if (!argsString) return [];
    try {
      return JSON.parse(argsString);
    } catch {
      throw new Error(JOB_ERRORS.INVALID_ARGS);
    }
  };

  const parseKwargs = (kwargsString: string | undefined): Record<string, unknown> => {
    if (!kwargsString) return {};
    try {
      return JSON.parse(kwargsString);
    } catch {
      throw new Error(JOB_ERRORS.INVALID_KWARGS);
    }
  };

  const buildCronTriggerData = (values: JobFormValues): Partial<JobCreate> => {
    if (values.trigger_type !== "cron") return {};
    return {
      cron_expression: values.cron_expression || null,
    };
  };

  const buildIntervalTriggerData = (values: JobFormValues): Partial<JobCreate> => {
    if (values.trigger_type !== "interval") return {};
    return {
      weeks: values.weeks,
      days: values.days,
      hours: values.hours,
      minutes: values.minutes,
      seconds: values.seconds,
    };
  };

  const buildOnceTriggerData = (values: JobFormValues): Partial<JobCreate> => {
    if (values.trigger_type !== "once") return {};
    return {
      run_date: values.run_date || null,
    };
  };

  const buildJobData = (
    values: JobFormValues,
    args: unknown[],
    kwargs: Record<string, unknown>
  ): JobCreate => {
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
  };

  const handleSubmit = async (values: JobFormValues) => {
    const args = parseArgs(values.args);
    const kwargs = parseKwargs(values.kwargs);
    const jobData = buildJobData(values, args, kwargs);
    await onSubmit(jobData);
  };

  const formatDateTimeForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="job_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{JOB_LABELS.JOB_ID}</FormLabel>
              <FormControl>
                <Input placeholder={JOB_PLACEHOLDERS.JOB_ID} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="function"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{JOB_LABELS.FUNCTION}</FormLabel>
              <FormControl>
                <Input placeholder={JOB_PLACEHOLDERS.FUNCTION} {...field} />
              </FormControl>
              <FormDescription>e.g., jobs.example_jobs:function_name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trigger_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{JOB_LABELS.TRIGGER_TYPE}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={JOB_PLACEHOLDERS.TRIGGER_TYPE} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cron">{JOB_LABELS.CRON}</SelectItem>
                  <SelectItem value="interval">{JOB_LABELS.INTERVAL}</SelectItem>
                  <SelectItem value="once">{JOB_LABELS.ONCE}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {triggerType === "cron" && (
          <FormField
            control={form.control}
            name="cron_expression"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{JOB_LABELS.CRON_EXPRESSION}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={JOB_PLACEHOLDERS.CRON_EXPRESSION}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>e.g., 0 0 * * * (daily at midnight)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {triggerType === "interval" && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <FormField
              control={form.control}
              name="weeks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{JOB_LABELS.WEEKS}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder={JOB_PLACEHOLDERS.WEEKS}
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{JOB_LABELS.DAYS}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder={JOB_PLACEHOLDERS.DAYS}
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{JOB_LABELS.HOURS}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder={JOB_PLACEHOLDERS.HOURS}
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{JOB_LABELS.MINUTES}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder={JOB_PLACEHOLDERS.MINUTES}
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seconds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{JOB_LABELS.SECONDS}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder={JOB_PLACEHOLDERS.SECONDS}
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {triggerType === "once" && (
          <FormField
            control={form.control}
            name="run_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{JOB_LABELS.RUN_DATE}</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value ? formatDateTimeForInput(field.value) : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? new Date(value).toISOString() : null);
                    }}
                  />
                </FormControl>
                <FormDescription>{JOB_LABELS.LEAVE_EMPTY_FOR_IMMEDIATE}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{JOB_LABELS.START_DATE}</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                  value={field.value ? formatDateTimeForInput(field.value) : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value ? new Date(value).toISOString() : null);
                  }}
                />
              </FormControl>
              <FormDescription>{JOB_LABELS.OPTIONAL_START_DATE}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{JOB_LABELS.END_DATE}</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                  value={field.value ? formatDateTimeForInput(field.value) : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value ? new Date(value).toISOString() : null);
                  }}
                />
              </FormControl>
              <FormDescription>{JOB_LABELS.OPTIONAL_END_DATE}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="args"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{JOB_LABELS.ARGS}</FormLabel>
              <FormControl>
                <Input placeholder={JOB_PLACEHOLDERS.ARGS} {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>{JOB_LABELS.JSON_ARRAY_FORMAT}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kwargs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{JOB_LABELS.KWARGS}</FormLabel>
              <FormControl>
                <Input placeholder={JOB_PLACEHOLDERS.KWARGS} {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>{JOB_LABELS.JSON_OBJECT_FORMAT}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="replace_existing"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{JOB_LABELS.REPLACE_EXISTING}</FormLabel>
                <FormDescription>{JOB_LABELS.REPLACE_EXISTING_DESCRIPTION}</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {JOB_LABELS.CANCEL}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? JOB_LABELS.CREATING : JOB_LABELS.SAVE}
          </Button>
        </div>
      </form>
    </Form>
  );
}
