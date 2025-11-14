import { PAGE_LOADING } from "@/lib/constants";
import { LoadingSpinner } from "./loading-spinner";

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = PAGE_LOADING.DEFAULT }: PageLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <div className="text-lg text-gray-600 dark:text-gray-400">{message}</div>
      </div>
    </div>
  );
}

