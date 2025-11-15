import { PageLoading } from "@/components/ui/page-loading";
import { PAGE_LOADING } from "@/lib/constants";

export default function Loading() {
  return <PageLoading message={PAGE_LOADING.ADMIN_ORGANIZATION_DETAILS} />;
}
