"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JOB_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";
import type { Job } from "@/lib/types/job";
import { JobActions } from "./job-actions";
import { Info } from "lucide-react";

interface JobListProps {
  jobs: Job[];
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewDetails: (job: Job) => void;
  isLoading?: boolean;
}

function getStatusBadgeVariant(
  paused: boolean,
  pending: boolean
): "default" | "secondary" | "outline" {
  if (paused) {
    return "outline";
  }
  if (pending) {
    return "secondary";
  }
  return "default";
}

function getStatusLabel(paused: boolean, pending: boolean): string {
  if (paused) {
    return JOB_LABELS.PAUSED;
  }
  if (pending) {
    return JOB_LABELS.PENDING;
  }
  return JOB_LABELS.ACTIVE;
}

export function JobList({
  jobs,
  onPause,
  onResume,
  onDelete,
  onViewDetails,
  isLoading,
}: JobListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{JOB_LABELS.LOADING}</p>
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{JOB_LABELS.NO_JOBS}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-lg">{job.id}</CardTitle>
                  <Badge variant={getStatusBadgeVariant(job.paused, job.pending)}>
                    {getStatusLabel(job.paused, job.pending)}
                  </Badge>
                </div>
                {job.name && <p className="text-sm text-muted-foreground mb-2">{job.name}</p>}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">{JOB_LABELS.FUNCTION_REF}:</span> {job.func_ref}
                  </div>
                  <div>
                    <span className="font-medium">{JOB_LABELS.TRIGGER}:</span> {job.trigger}
                  </div>
                  {job.next_run_time && (
                    <div>
                      <span className="font-medium">{JOB_LABELS.NEXT_RUN_TIME}:</span>{" "}
                      {formatDate(job.next_run_time)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDetails(job)}
                  aria-label={JOB_LABELS.VIEW_DETAILS}
                >
                  <Info className="h-4 w-4" />
                </Button>
                <JobActions job={job} onPause={onPause} onResume={onResume} onDelete={onDelete} />
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
