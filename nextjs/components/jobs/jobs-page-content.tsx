"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { JobList } from "@/components/jobs/job-list";
import { JobDialog } from "@/components/jobs/job-dialog";
import { JobDetailsDialog } from "@/components/jobs/job-details-dialog";
import { JOB_LABELS, JOB_ERRORS, JOB_SUCCESS, PAGE_CONTAINER } from "@/lib/constants";
import { getJobs, createJob, deleteJob, pauseJob, resumeJob, getJob } from "@/lib/api/jobs";
import type { Job, JobCreate } from "@/lib/types/job";
import { Plus, History } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function JobsPageContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await getJobs(page, pageSize);
      setJobs(response.items);
      setTotal(response.total);
    } catch (err) {
      console.error("Failed to load jobs:", err);
      setError(err instanceof Error ? err.message : JOB_ERRORS.LOAD_JOBS_FAILED);
      toast.error(JOB_ERRORS.LOAD_JOBS_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuthAndLoadJobs = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.session) {
          router.push("/");
          return;
        }

        setIsAuthorized(true);
        await loadJobs();
      } catch (err) {
        console.error("Failed to load jobs:", err);
        setError(err instanceof Error ? err.message : JOB_ERRORS.LOAD_JOBS_FAILED);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (isAuthorized) {
      loadJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, isAuthorized]);

  const handleCreateClick = () => {
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: JobCreate) => {
    try {
      setIsSubmitting(true);
      setError("");
      await createJob(data);
      toast.success(JOB_SUCCESS.JOB_CREATED);
      setIsDialogOpen(false);
      await loadJobs();
    } catch (err) {
      console.error("Failed to create job:", err);
      const errorMessage = err instanceof Error ? err.message : JOB_ERRORS.CREATE_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      await deleteJob(jobId);
      toast.success(JOB_SUCCESS.JOB_DELETED);
      await loadJobs();
    } catch (err) {
      console.error("Failed to delete job:", err);
      toast.error(JOB_ERRORS.DELETE_FAILED);
      throw err;
    }
  };

  const handlePause = async (jobId: string) => {
    try {
      await pauseJob(jobId);
      toast.success(JOB_SUCCESS.JOB_PAUSED);
      await loadJobs();
    } catch (err) {
      console.error("Failed to pause job:", err);
      toast.error(JOB_ERRORS.PAUSE_FAILED);
      throw err;
    }
  };

  const handleResume = async (jobId: string) => {
    try {
      await resumeJob(jobId);
      toast.success(JOB_SUCCESS.JOB_RESUMED);
      await loadJobs();
    } catch (err) {
      console.error("Failed to resume job:", err);
      toast.error(JOB_ERRORS.RESUME_FAILED);
      throw err;
    }
  };

  const handleViewDetails = async (job: Job) => {
    try {
      const fullJob = await getJob(job.id);
      setSelectedJob(fullJob);
      setIsDetailsDialogOpen(true);
    } catch (err) {
      console.error("Failed to load job details:", err);
      toast.error(JOB_ERRORS.LOAD_JOB_FAILED);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 0;

  if (isLoading && !isAuthorized) {
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

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <JobList
        jobs={jobs}
        onPause={handlePause}
        onResume={handleResume}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
        isLoading={isLoading}
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
        isSubmitting={isSubmitting}
      />

      <JobDetailsDialog
        job={selectedJob}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </main>
  );
}
