"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { JobHistoryList } from "@/components/jobs/job-history-list";
import { Button } from "@/components/ui/button";
import { JOB_LABELS, PAGE_CONTAINER } from "@/lib/constants";
import { useSession } from "@/lib/hooks/api/use-auth";

export function JobHistoryPageContent() {
  const router = useRouter();
  const { data: session, isLoading } = useSession();

  const isAuthorized = !!session?.session;

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      router.push("/login");
    }
  }, [isLoading, isAuthorized, router]);

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
          <div className="flex items-center gap-4">
            <Link href="/admin/jobs">
              <Button variant="ghost" size="icon" aria-label={JOB_LABELS.BACK_TO_JOBS}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {JOB_LABELS.JOB_HISTORY_TITLE}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {JOB_LABELS.JOB_HISTORY_DESCRIPTION}
              </p>
            </div>
          </div>
        </div>
      </div>

      <JobHistoryList showJobFilter={true} />
    </main>
  );
}
