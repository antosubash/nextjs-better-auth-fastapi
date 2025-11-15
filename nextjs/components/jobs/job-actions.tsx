"use client";

import { Pause, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { JOB_LABELS } from "@/lib/constants";
import type { Job } from "@/lib/types/job";

interface JobActionsProps {
  job: Job;
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function JobActions({ job, onPause, onResume, onDelete }: JobActionsProps) {
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  const handleDeleteClick = () => {
    setDeleteJobId(job.id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteJobId) return;

    setIsDeleting(true);
    try {
      await onDelete(deleteJobId);
      setDeleteJobId(null);
    } catch (error) {
      console.error("Failed to delete job:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePause = async () => {
    setIsPausing(true);
    try {
      await onPause(job.id);
    } catch (error) {
      console.error("Failed to pause job:", error);
    } finally {
      setIsPausing(false);
    }
  };

  const handleResume = async () => {
    setIsResuming(true);
    try {
      await onResume(job.id);
    } catch (error) {
      console.error("Failed to resume job:", error);
    } finally {
      setIsResuming(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {job.paused ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResume}
                disabled={isResuming}
                aria-label={JOB_LABELS.RESUME_JOB}
              >
                <Play className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{JOB_LABELS.RESUME_JOB}</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePause}
                disabled={isPausing}
                aria-label={JOB_LABELS.PAUSE_JOB}
              >
                <Pause className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{JOB_LABELS.PAUSE_JOB}</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteClick}
              aria-label={JOB_LABELS.DELETE_JOB}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{JOB_LABELS.DELETE_JOB}</TooltipContent>
        </Tooltip>
      </div>

      <AlertDialog
        open={deleteJobId !== null}
        onOpenChange={(open) => !open && setDeleteJobId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{JOB_LABELS.DELETE_JOB}</AlertDialogTitle>
            <AlertDialogDescription>{JOB_LABELS.CONFIRM_DELETE}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{JOB_LABELS.CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? JOB_LABELS.DELETING : JOB_LABELS.DELETE_JOB}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
