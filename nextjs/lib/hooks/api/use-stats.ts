import { useQuery } from "@tanstack/react-query";
import { getUserStats, getAdminStats } from "@/lib/api/stats";
import { queryKeys } from "./query-keys";

export function useUserStats() {
  return useQuery({
    queryKey: queryKeys.stats.user(),
    queryFn: () => getUserStats(),
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.stats.admin(),
    queryFn: () => getAdminStats(),
  });
}
