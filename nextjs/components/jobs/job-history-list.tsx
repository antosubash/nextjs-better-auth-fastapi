"use client";

import { Check, ChevronDown, ChevronUp, Copy, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JOB_ERRORS, JOB_LABELS } from "@/lib/constants";
import { useJobHistory, useJobs } from "@/lib/hooks/api/use-jobs";
import { useJobHistoryStore } from "@/lib/stores/job-store";
import { formatDate } from "@/lib/utils/date";

interface JobHistoryListProps {
  jobId?: string;
  showJobFilter?: boolean;
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
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

export function JobHistoryList({
  jobId: initialJobId,
  showJobFilter = false,
}: JobHistoryListProps) {
  const {
    page,
    pageSize,
    selectedJobId,
    expandedItems,
    copiedId,
    setPage,
    setPageSize,
    setSelectedJobId,
    toggleExpandedItem,
    setCopiedId,
  } = useJobHistoryStore();

  // Sync initialJobId to store
  useEffect(() => {
    if (initialJobId !== undefined && initialJobId !== selectedJobId) {
      setSelectedJobId(initialJobId);
    }
  }, [initialJobId, selectedJobId, setSelectedJobId]);

  const { data: jobsData } = useJobs(1, 100, { enabled: showJobFilter });
  const {
    data: historyData,
    isLoading: loading,
    error: historyError,
  } = useJobHistory(selectedJobId, page, pageSize);

  const jobs = jobsData?.items ?? [];
  const history = historyData?.items ?? [];
  const total = historyData?.total ?? 0;
  const totalPages = historyData?.total_pages ?? 1;

  // Handle error - this is a necessary useEffect for error handling
  useEffect(() => {
    if (historyError) {
      toast.error(JOB_ERRORS.LOAD_JOB_HISTORY_FAILED);
    }
  }, [historyError]);

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

  const renderExpandedContent = (item: (typeof history)[0]) => {
    const hasLogs = item.logs && item.logs.trim().length > 0;
    const hasError = item.error_message && item.error_message.trim().length > 0;

    if (!hasLogs && !hasError) {
      return <p className="text-sm text-muted-foreground">{JOB_LABELS.NO_LOGS}</p>;
    }

    return (
      <div className="space-y-4">
        {hasError && (
          <div>
            <h4 className="font-semibold mb-2 text-destructive">{JOB_LABELS.ERROR_MESSAGE}</h4>
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
      </div>
    );
  };

  const renderItemHeader = (item: (typeof history)[0]) => {
    return (
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
    );
  };

  const renderItemActions = (item: (typeof history)[0], hasLogs: boolean, hasError: boolean) => {
    const isExpanded = expandedItems.has(item.id);

    return (
      <div className="flex items-center gap-2">
        {hasLogs && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyLogs(item.logs || "", item.id)}
            aria-label={JOB_LABELS.COPY_LOGS}
            title={JOB_LABELS.COPY_LOGS}
          >
            {copiedId === item.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        )}
        {(hasLogs || hasError) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleExpandedItem(item.id)}
            aria-label={isExpanded ? JOB_LABELS.COLLAPSE_LOGS : JOB_LABELS.EXPAND_LOGS}
            title={isExpanded ? JOB_LABELS.COLLAPSE_LOGS : JOB_LABELS.EXPAND_LOGS}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}
      </div>
    );
  };

  const renderHistoryItem = (item: (typeof history)[0]) => {
    const isExpanded = expandedItems.has(item.id);
    const hasLogs = !!(item.logs && item.logs.trim().length > 0);
    const hasError = !!(item.error_message && item.error_message.trim().length > 0);

    return (
      <Card key={item.id}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            {renderItemHeader(item)}
            {renderItemActions(item, hasLogs, hasError)}
          </div>
        </CardHeader>
        {isExpanded && <CardContent>{renderExpandedContent(item)}</CardContent>}
      </Card>
    );
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
              <label htmlFor="job-filter-select" className="text-sm font-medium">
                {JOB_LABELS.FILTER_BY_JOB}:
              </label>
              <Select
                value={selectedJobId || "all"}
                onValueChange={(value) => {
                  setSelectedJobId(value === "all" ? undefined : value);
                }}
              >
                <SelectTrigger id="job-filter-select" className="w-[300px]">
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

      {history.map((item) => renderHistoryItem(item))}

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
