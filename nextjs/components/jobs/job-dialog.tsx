"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { JOB_LABELS, PREDEFINED_JOBS } from "@/lib/constants";
import type { JobCreate } from "@/lib/types/job";
import { JobForm } from "./job-form";

interface JobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: JobCreate) => Promise<void>;
  isSubmitting?: boolean;
}

export function JobDialog({ open, onOpenChange, onSubmit, isSubmitting = false }: JobDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const handleSubmit = async (data: JobCreate) => {
    await onSubmit(data);
    onOpenChange(false);
    setSelectedTemplate("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedTemplate("");
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const buildBaseValues = (
    template: (typeof PREDEFINED_JOBS.TEMPLATES)[number]
  ): Partial<JobCreate> => {
    return {
      job_id: template.id,
      function: template.function,
      trigger_type: template.trigger_type,
      args: Array.from(template.args) as unknown[],
      kwargs: template.kwargs as Record<string, unknown>,
      replace_existing: true,
    };
  };

  const addCronExpression = (
    baseValues: Partial<JobCreate>,
    template: (typeof PREDEFINED_JOBS.TEMPLATES)[number]
  ): void => {
    if (template.trigger_type === "cron" && "cron_expression" in template) {
      baseValues.cron_expression = template.cron_expression;
    }
  };

  const addIntervalValue = (
    baseValues: Partial<JobCreate>,
    template: (typeof PREDEFINED_JOBS.TEMPLATES)[number],
    key: "weeks" | "days" | "hours" | "minutes" | "seconds"
  ): void => {
    if (
      template.trigger_type === "interval" &&
      key in template &&
      typeof template[key as keyof typeof template] === "number"
    ) {
      baseValues[key] = template[key as keyof typeof template] as number;
    }
  };

  const addIntervalValues = (
    baseValues: Partial<JobCreate>,
    template: (typeof PREDEFINED_JOBS.TEMPLATES)[number]
  ): void => {
    if (template.trigger_type !== "interval") return;

    addIntervalValue(baseValues, template, "weeks");
    addIntervalValue(baseValues, template, "days");
    addIntervalValue(baseValues, template, "hours");
    addIntervalValue(baseValues, template, "minutes");
    addIntervalValue(baseValues, template, "seconds");
  };

  const getInitialValues = (): Partial<JobCreate> | undefined => {
    if (!selectedTemplate || selectedTemplate === "custom") {
      return undefined;
    }

    const template = PREDEFINED_JOBS.TEMPLATES.find((t) => t.id === selectedTemplate);
    if (!template) {
      return undefined;
    }

    const baseValues = buildBaseValues(template);
    addCronExpression(baseValues, template);
    addIntervalValues(baseValues, template);

    return baseValues;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{JOB_LABELS.CREATE_JOB}</DialogTitle>
          <DialogDescription>{JOB_LABELS.CREATE_JOB_DESCRIPTION}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="template-select" className="text-sm font-medium mb-2 block">
              {PREDEFINED_JOBS.SELECT_TEMPLATE}
            </label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger id="template-select">
                <SelectValue placeholder={PREDEFINED_JOBS.SELECT_TEMPLATE} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">{PREDEFINED_JOBS.CREATE_CUSTOM}</SelectItem>
                {PREDEFINED_JOBS.TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && selectedTemplate !== "custom" && (
              <p className="text-sm text-muted-foreground mt-2">
                {PREDEFINED_JOBS.TEMPLATES.find((t) => t.id === selectedTemplate)?.description}
              </p>
            )}
          </div>

          {selectedTemplate && <Separator />}

          <JobForm
            key={selectedTemplate}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            initialValues={getInitialValues()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
