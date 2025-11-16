"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { JOB_LABELS, JOB_PLACEHOLDERS } from "@/lib/constants";
import type { JobFormValues } from "./job-form-schema";
import { formatDateTimeForInput } from "./job-form-utils";

interface JobTriggerFieldsProps {
  form: UseFormReturn<JobFormValues>;
  triggerType: "cron" | "interval" | "once";
}

export function JobTriggerFields({ form, triggerType }: JobTriggerFieldsProps) {
  if (triggerType === "cron") {
    return (
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
    );
  }

  if (triggerType === "interval") {
    return (
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
    );
  }

  if (triggerType === "once") {
    return (
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
    );
  }

  return null;
}
