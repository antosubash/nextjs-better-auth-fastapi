import { PageLoading } from "@/components/ui/page-loading";
import { ADMIN_DASHBOARD } from "@/lib/constants";

export default function Loading() {
  return <PageLoading message={ADMIN_DASHBOARD.LOADING} />;
}
