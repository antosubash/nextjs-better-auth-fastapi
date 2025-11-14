"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JOB_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/date";
import { getJobHistory } from "@/lib/api/jobs";
import type { JobHistory } from "@/lib/types/job";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface JobHistoryProps {
  jobId: string;
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

export function JobHistoryComponent({ jobId }: JobHistoryProps) {
  const [history, setHistory] = useState<JobHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await getJobHistory(jobId, page, 10);
      setHistory(response.items);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error("Failed to load job history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, page]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  if (loading) {
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
                    <Badge variant={getStatusBadgeVariant(item.status)}>
                      {item.status}
                    </Badge>
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
                  </div>
                </div>
                {(hasLogs || hasError) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleExpand(item.id)}
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent className="space-y-4">
                {hasError && (
                  <div>
                    <h4 className="font-semibold mb-2 text-destructive">
                      {JOB_LABELS.ERROR_MESSAGE}
                    </h4>
                    <ScrollArea className="h-32 w-full rounded-md border p-4">
                      <pre className="text-sm text-destructive whitespace-pre-wrap">
                        {item.error_message}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
                {hasLogs && (
                  <div>
                    <h4 className="font-semibold mb-2">{JOB_LABELS.EXECUTION_LOGS}</h4>
                    <ScrollArea className="h-48 w-full rounded-md border p-4">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {item.logs || JOB_LABELS.NO_LOGS}
                      </pre>
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
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            {JOB_LABELS.PREVIOUS_PAGE}
          </Button>
          <span className="text-sm text-muted-foreground">
            {JOB_LABELS.PAGE} {page} {JOB_LABELS.OF} {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            {JOB_LABELS.NEXT_PAGE}
          </Button>
        </div>
      )}
    </div>
  );
}

