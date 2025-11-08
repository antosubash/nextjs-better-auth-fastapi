import { Clock } from "lucide-react";

interface ActivityItem {
  type: string;
  message: string;
  timestamp: number;
  details?: {
    [key: string]: string | undefined;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  emptyMessage?: string;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function ActivityFeed({
  activities,
  emptyMessage = "No recent activity",
}: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <p className="text-center text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
          >
            <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
              <Clock className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.message}
              </p>
              {activity.details && (
                <div className="mt-1 space-y-1">
                  {activity.details.ipAddress && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      IP: {activity.details.ipAddress}
                    </p>
                  )}
                  {activity.details.userAgent && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {activity.details.userAgent}
                    </p>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

