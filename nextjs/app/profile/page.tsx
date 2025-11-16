"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserProfile } from "@/components/user-profile";
import { PAGE_CONTAINER, PAGE_LOADING } from "@/lib/constants";
import { useSession } from "@/lib/hooks/api/use-auth";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading && !session?.session) {
      router.push("/login");
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return (
      <main className={PAGE_CONTAINER.CLASS}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-gray-600 dark:text-gray-400">{PAGE_LOADING.PROFILE}</div>
        </div>
      </main>
    );
  }

  if (!session?.session) {
    return null;
  }

  return (
    <main className={PAGE_CONTAINER.CLASS}>
      <UserProfile />
    </main>
  );
}
