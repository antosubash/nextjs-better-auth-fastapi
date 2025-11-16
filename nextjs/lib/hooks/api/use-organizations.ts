import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAdminOrganizations,
  getOrganization,
  addOrganizationMember,
} from "@/lib/api/organizations";
import { MEMBER_ERRORS, MEMBER_SUCCESS } from "@/lib/constants";
import { queryKeys } from "./query-keys";

export function useAdminOrganizations() {
  return useQuery({
    queryKey: queryKeys.organizations.list(),
    queryFn: () => getAdminOrganizations(),
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: queryKeys.organizations.detail(id),
    queryFn: () => getOrganization(id),
    enabled: !!id,
  });
}

export function useAddOrganizationMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      userId,
      role,
    }: {
      organizationId: string;
      userId: string;
      role: string;
    }) => addOrganizationMember(organizationId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.lists() });
      toast.success(MEMBER_SUCCESS.MEMBER_ADDED);
    },
    onError: (error: Error) => {
      toast.error(error.message || MEMBER_ERRORS.ADD_FAILED);
    },
  });
}
