"use client";

import { JobHistoryList } from "./job-history-list";

interface JobHistoryProps {
  jobId: string;
}

export function JobHistoryComponent({ jobId }: JobHistoryProps) {
  return <JobHistoryList jobId={jobId} showJobFilter={false} />;
}

