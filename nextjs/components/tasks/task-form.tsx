"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TASK_LABELS, TASK_PLACEHOLDERS, TASK_ERRORS } from "@/lib/constants";
import type { Task, TaskCreate, TaskStatus } from "@/lib/types/task";

const taskSchema = z.object({
  title: z.string().min(1, TASK_ERRORS.TITLE_REQUIRED).max(255, TASK_ERRORS.TITLE_TOO_LONG),
  description: z.string().max(5000, TASK_ERRORS.DESCRIPTION_TOO_LONG).optional().nullable(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: TaskCreate) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function TaskForm({ task, onSubmit, onCancel, isSubmitting = false }: TaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "pending",
    },
  });

  const handleSubmit = async (values: TaskFormValues) => {
    await onSubmit({
      title: values.title,
      description: values.description || null,
      status: values.status as TaskStatus,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{TASK_LABELS.TASK_TITLE}</FormLabel>
              <FormControl>
                <Input placeholder={TASK_PLACEHOLDERS.TITLE} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{TASK_LABELS.TASK_DESCRIPTION}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={TASK_PLACEHOLDERS.DESCRIPTION}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{TASK_LABELS.TASK_STATUS}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={TASK_PLACEHOLDERS.STATUS} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">{TASK_LABELS.PENDING}</SelectItem>
                  <SelectItem value="in_progress">{TASK_LABELS.IN_PROGRESS}</SelectItem>
                  <SelectItem value="completed">{TASK_LABELS.COMPLETED}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {TASK_LABELS.CANCEL}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (task ? TASK_LABELS.SAVING : TASK_LABELS.CREATING) : TASK_LABELS.SAVE}
          </Button>
        </div>
      </form>
    </Form>
  );
}

