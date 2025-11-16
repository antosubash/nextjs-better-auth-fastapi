"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginForm } from "@/components/login-form";
import { LOGIN_PAGE, PAGE_CONTAINER } from "@/lib/constants";
import { useSession } from "@/lib/hooks/api/use-auth";
import { getDashboardPath } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isLoading } = useSession();

  const isAuthenticated = !!session?.session;

  useEffect(() => {
    if (isAuthenticated && session?.user?.role) {
      router.push(getDashboardPath(session.user.role));
    }
  }, [isAuthenticated, session, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <main className="w-full">
      <div className={PAGE_CONTAINER.CLASS}>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 lg:p-10">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {LOGIN_PAGE.TITLE}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{LOGIN_PAGE.DESCRIPTION}</p>
              </div>
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
