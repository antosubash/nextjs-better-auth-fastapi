"use client";

import { History, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JobDetailsDialog } from "@/components/jobs/job-details-dialog";
import { JobDialog } from "@/components/jobs/job-dialog";
import { JobList } from "@/components/jobs/job-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JOB_ERRORS, JOB_LABELS, PAGE_CONTAINER } from "@/lib/constants";
import { useSession } from "@/lib/hooks/api/use-auth";
import {
  useCreateJob,
  useDeleteJob,
  useJobs,
  usePauseJob,
  useResumeJob,
} from "@/lib/hooks/api/use-jobs";
import type { Job, JobCreate } from "@/lib/types/job";

export function JobsPageContent() {
  const router = useRouter();
  const { data: session, isLoading } = useSession();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const { data: jobsData, isLoading: isLoadingJobs, error: jobsError } = useJobs(page, pageSize);
  const createJobMutation = useCreateJob();
  const deleteJobMutation = useDeleteJob();
  const pauseJobMutation = usePauseJob();
  const resumeJobMutation = useResumeJob();

  const jobs = jobsData?.items ?? [];
  const total = jobsData?.total ?? 0;
  const isAuthorized = !!session?.session;

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      router.push("/");
    }
  }, [isLoading, isAuthorized, router]);

  const handleCreateClick = () => {
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: JobCreate) => {
    try {
      await createJobMutation.mutateAsync(data);
      setIsDialogOpen(false);
    } catch (err) {
      // Error is handled by the mutation hook
      console.error("Failed to create job:", err);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      await deleteJobMutation.mutateAsync(jobId);
    } catch (err) {
      // Error is handled by the mutation hook
      console.error("Failed to delete job:", err);
      throw err;
    }
  };

  const handlePause = async (jobId: string) => {
    try {
      await pauseJobMutation.mutateAsync(jobId);
    } catch (err) {
      // Error is handled by the mutation hook
      console.error("Failed to pause job:", err);
      throw err;
    }
  };

  const handleResume = async (jobId: string) => {
    try {
      await resumeJobMutation.mutateAsync(jobId);
    } catch (err) {
      // Error is handled by the mutation hook
      console.error("Failed to resume job:", err);
      throw err;
    }
  };

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    setIsDetailsDialogOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize) || 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">{JOB_LABELS.LOADING}</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <main className={PAGE_CONTAINER.CLASS}>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {JOB_LABELS.TITLE}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {JOB_LABELS.SHOWING} {Math.min((page - 1) * pageSize + 1, total)} {JOB_LABELS.TO}{" "}
              {Math.min(page * pageSize, total)} {JOB_LABELS.OF} {total} {JOB_LABELS.JOBS}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/jobs/history">
              <Button variant="outline">
                <History className="h-4 w-4 mr-2" />
                {JOB_LABELS.VIEW_HISTORY}
              </Button>
            </Link>
            <Button onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              {JOB_LABELS.CREATE_JOB}
            </Button>
          </div>
        </div>
      </div>

      {jobsError && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              {jobsError instanceof Error ? jobsError.message : JOB_ERRORS.LOAD_JOBS_FAILED}
            </p>
          </CardContent>
        </Card>
      )}

      <JobList
        jobs={jobs}
        onPause={handlePause}
        onResume={handleResume}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
        isLoading={isLoadingJobs}
      />

      {totalPages > 1 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{JOB_LABELS.ITEMS_PER_PAGE}:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(Math.max(1, page - 1));
                      }}
                      className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(pageNum);
                          }}
                          isActive={page === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(Math.min(totalPages, page + 1));
                      }}
                      className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      )}

      <JobDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        isSubmitting={createJobMutation.isPending}
      />

      <JobDetailsDialog
        job={selectedJob}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </main>
  );
}
