"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JOB_LABELS } from "@/lib/constants";
import type { Job } from "@/lib/types/job";
import { formatDate } from "@/lib/utils/date";
import { JobHistoryComponent } from "./job-history";

interface JobDetailsDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobDetailsDialog({ job, open, onOpenChange }: JobDetailsDialogProps) {
  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job.id}</DialogTitle>
          <DialogDescription>{JOB_LABELS.JOB_DETAILS_DESCRIPTION}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">{JOB_LABELS.HISTORY}</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2">{JOB_LABELS.STATUS}</h3>
              <div className="flex gap-2">
                <Badge variant={job.paused ? "outline" : "default"}>{JOB_LABELS.PAUSED}</Badge>
                <Badge variant={job.pending ? "secondary" : "default"}>{JOB_LABELS.PENDING}</Badge>
              </div>
            </div>

            {job.name && (
              <div>
                <h3 className="font-semibold mb-2">{JOB_LABELS.JOB_ID}</h3>
                <p className="text-sm text-muted-foreground">{job.name}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">{JOB_LABELS.FUNCTION_REF}</h3>
              <p className="text-sm text-muted-foreground font-mono">{job.func_ref}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">{JOB_LABELS.TRIGGER}</h3>
              <p className="text-sm text-muted-foreground font-mono">{job.trigger}</p>
            </div>

            {job.next_run_time && (
              <div>
                <h3 className="font-semibold mb-2">{JOB_LABELS.NEXT_RUN_TIME}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(job.next_run_time, "long")}
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">{JOB_LABELS.ADDITIONAL_INFORMATION}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">ID:</span>{" "}
                  <span className="text-muted-foreground font-mono">{job.id}</span>
                </div>
                <div>
                  <span className="font-medium">Pending:</span>{" "}
                  <span className="text-muted-foreground">{job.pending ? "Yes" : "No"}</span>
                </div>
                <div>
                  <span className="font-medium">Paused:</span>{" "}
                  <span className="text-muted-foreground">{job.paused ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <JobHistoryComponent jobId={job.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
