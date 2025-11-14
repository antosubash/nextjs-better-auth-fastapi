"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobHistoryList } from "@/components/jobs/job-history-list";
import { JOB_LABELS, JOB_ERRORS, PAGE_CONTAINER } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export function JobHistoryPageContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.session) {
          router.push("/");
          return;
        }

        setIsAuthorized(true);
      } catch (err) {
        console.error("Failed to check auth:", err);
        setError(err instanceof Error ? err.message : JOB_ERRORS.LOAD_JOB_HISTORY_FAILED);
        toast.error(JOB_ERRORS.LOAD_JOB_HISTORY_FAILED);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <JobHistoryList showJobFilter={true} />
    </main>
  );
}
