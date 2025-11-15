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

  const getInitialValues = (): Partial<JobCreate> | undefined => {
    if (!selectedTemplate || selectedTemplate === "custom") {
      return undefined;
    }

    const template = PREDEFINED_JOBS.TEMPLATES.find((t) => t.id === selectedTemplate);
    if (!template) {
      return undefined;
    }

    return {
      job_id: template.id,
      function: template.function,
      trigger_type: template.trigger_type,
      cron_expression: template.cron_expression || undefined,
      weeks: template.weeks || undefined,
      days: template.days || undefined,
      hours: template.hours || undefined,
      minutes: template.minutes || undefined,
      seconds: template.seconds || undefined,
      args: template.args,
      kwargs: template.kwargs,
      replace_existing: true,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{JOB_LABELS.CREATE_JOB}</DialogTitle>
          <DialogDescription>Create a new background job</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {PREDEFINED_JOBS.SELECT_TEMPLATE}
            </label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
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
