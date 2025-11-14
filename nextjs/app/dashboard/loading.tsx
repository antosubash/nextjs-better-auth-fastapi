import { PageLoading } from "@/components/ui/page-loading";
import { DASHBOARD } from "@/lib/constants";

export default function Loading() {
  return <PageLoading message={DASHBOARD.LOADING} />;
}
