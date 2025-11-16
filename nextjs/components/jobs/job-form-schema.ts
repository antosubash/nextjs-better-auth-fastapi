import { z } from "zod";
import { JOB_ERRORS } from "@/lib/constants";

export const jobSchema = z
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

export type JobFormValues = z.infer<typeof jobSchema>;
