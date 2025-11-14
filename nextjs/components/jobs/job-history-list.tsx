"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { JOB_LABELS, JOB_ERRORS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";
import { getJobHistory, getJobs } from "@/lib/api/jobs";
import type { JobHistory, Job } from "@/lib/types/job";
import { Loader2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface JobHistoryListProps {
  jobId?: string;
  showJobFilter?: boolean;
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case "completed":
      return "default";
    case "failed":
      return "destructive";
    case "paused":
    case "removed":
      return "outline";
    case "created":
    case "resumed":
      return "secondary";
    default:
      return "outline";
  }
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    created: JOB_LABELS.CREATED,
    completed: JOB_LABELS.COMPLETED,
    failed: JOB_LABELS.FAILED,
    removed: JOB_LABELS.REMOVED,
    paused: JOB_LABELS.PAUSED,
    resumed: JOB_LABELS.RESUMED,
    misfired: JOB_LABELS.MISFIRED,
  };
  return statusMap[status.toLowerCase()] || status;
}

export function JobHistoryList({ jobId: initialJobId, showJobFilter = false }: JobHistoryListProps) {
  const [history, setHistory] = useState<JobHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(initialJobId);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadJobs = async () => {
    try {
      // Load jobs with maximum allowed page size (100)
      // This should be sufficient for the filter dropdown
      const response = await getJobs(1, 100);
      setJobs(response.items);
    } catch (error) {
      console.error("Failed to load jobs:", error);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await getJobHistory(selectedJobId, page, pageSize);
      setHistory(response.items);
      setTotal(response.total);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error("Failed to load job history:", error);
      toast.error(JOB_ERRORS.LOAD_JOB_HISTORY_FAILED);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showJobFilter) {
      loadJobs();
    }
  }, [showJobFilter]);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId, page, pageSize]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const copyLogs = async (logs: string, id: string) => {
    try {
      await navigator.clipboard.writeText(logs);
      setCopiedId(id);
      toast.success(JOB_LABELS.LOGS_COPIED);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy logs:", error);
    }
  };

  if (loading && history.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">{JOB_LABELS.LOADING_HISTORY}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{JOB_LABELS.NO_HISTORY}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showJobFilter && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">{JOB_LABELS.FILTER_BY_JOB}:</label>
              <Select
                value={selectedJobId || "all"}
                onValueChange={(value) => {
                  setSelectedJobId(value === "all" ? undefined : value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{JOB_LABELS.ALL_JOBS}</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {history.map((item) => {
        const isExpanded = expandedItems.has(item.id);
        const hasLogs = item.logs && item.logs.trim().length > 0;
        const hasError = item.error_message && item.error_message.trim().length > 0;

        return (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-base">{getStatusLabel(item.status)}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(item.status)}>{item.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                    <div>
                      <span className="font-medium">{JOB_LABELS.JOB_ID}:</span> {item.job_id}
                    </div>
                    <div>
                      <span className="font-medium">{JOB_LABELS.FUNCTION_NAME}:</span> {item.function}
                    </div>
                    <div>
                      <span className="font-medium">{JOB_LABELS.TRIGGER_TYPE}:</span> {item.trigger_type}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">{JOB_LABELS.EXECUTED_AT}:</span>{" "}
                      {formatDate(item.created_at, "long")}
                    </div>
                    {item.next_run_time && (
                      <div>
                        <span className="font-medium">{JOB_LABELS.NEXT_RUN_TIME}:</span>{" "}
                        {formatDate(item.next_run_time, "long")}
                      </div>
                    )}
                    {item.user_id && (
                      <div>
                        <span className="font-medium">{JOB_LABELS.USER_ID}:</span> {item.user_id}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasLogs && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyLogs(item.logs || "", item.id)}
                      aria-label={JOB_LABELS.COPY_LOGS}
                      title={JOB_LABELS.COPY_LOGS}
                    >
                      {copiedId === item.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {(hasLogs || hasError) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpand(item.id)}
                      aria-label={isExpanded ? JOB_LABELS.COLLAPSE_LOGS : JOB_LABELS.EXPAND_LOGS}
                      title={isExpanded ? JOB_LABELS.COLLAPSE_LOGS : JOB_LABELS.EXPAND_LOGS}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent className="space-y-4">
                {hasError && (
                  <div>
                    <h4 className="font-semibold mb-2 text-destructive">
                      {JOB_LABELS.ERROR_MESSAGE}
                    </h4>
                    <ScrollArea className="h-32 w-full rounded-md border p-4 bg-destructive/10">
                      <pre className="text-sm text-destructive whitespace-pre-wrap font-mono">
                        {item.error_message}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
                {hasLogs && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{JOB_LABELS.EXECUTION_LOGS}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLogs(item.logs || "", item.id)}
                        className="h-8"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="h-3 w-3 mr-2" />
                            {JOB_LABELS.LOGS_COPIED}
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-2" />
                            {JOB_LABELS.COPY_LOGS}
                          </>
                        )}
                      </Button>
                    </div>
                    <ScrollArea className="h-64 w-full rounded-md border p-4 bg-muted/50">
                      <pre className="text-sm whitespace-pre-wrap font-mono">{item.logs}</pre>
                    </ScrollArea>
                  </div>
                )}
                {!hasLogs && !hasError && (
                  <p className="text-sm text-muted-foreground">{JOB_LABELS.NO_LOGS}</p>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {total > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{JOB_LABELS.ITEMS_PER_PAGE}:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
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

              {totalPages > 1 && (
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
              )}
            </div>
            <div className="text-center mt-4 text-sm text-muted-foreground">
              {JOB_LABELS.SHOWING} {Math.min((page - 1) * pageSize + 1, total)} {JOB_LABELS.TO}{" "}
              {Math.min(page * pageSize, total)} {JOB_LABELS.OF} {total}{" "}
              {total === 1 ? JOB_LABELS.RECORD : JOB_LABELS.RECORDS}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

