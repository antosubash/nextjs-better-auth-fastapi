"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { JOB_LABELS, JOB_PLACEHOLDERS } from "@/lib/constants";
import type { JobCreate } from "@/lib/types/job";
import { type JobFormValues, jobSchema } from "./job-form-schema";
import {
  buildJobData,
  formatDateTimeForInput,
  getDefaultValuesFromInitial,
  parseArgs,
  parseKwargs,
} from "./job-form-utils";
import { JobTriggerFields } from "./job-trigger-fields";

interface JobFormProps {
  onSubmit: (data: JobCreate) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialValues?: Partial<JobCreate>;
}

export function JobForm({ onSubmit, onCancel, isSubmitting = false, initialValues }: JobFormProps) {
  const getDefaultValues = useCallback((): JobFormValues => {
    return getDefaultValuesFromInitial(initialValues);
  }, [initialValues]);

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

  const handleSubmit = async (values: JobFormValues) => {
    const args = parseArgs(values.args);
    const kwargs = parseKwargs(values.kwargs);
    const jobData = buildJobData(values, args, kwargs);
    await onSubmit(jobData);
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

        <JobTriggerFields form={form} triggerType={triggerType} />

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
