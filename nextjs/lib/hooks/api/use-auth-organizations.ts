import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { ORGANIZATION_ERRORS, ORGANIZATION_SUCCESS } from "@/lib/constants";
import { queryKeys } from "./query-keys";
import { useSession } from "./use-auth-session";

export function useOrganizations() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user?.id;

  return useQuery({
    queryKey: queryKeys.auth.organizations(),
    queryFn: async () => {
      const result = await authClient.organization.list();
      if (result.error) {
        throw new Error(result.error.message || ORGANIZATION_ERRORS.LOAD_ORGANIZATIONS_FAILED);
      }
      return Array.isArray(result.data) ? result.data : [];
    },
    enabled: isAuthenticated, // Only fetch when user is authenticated
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSetActiveOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const result = await authClient.organization.setActive({
        organizationId,
      });
      if (result.error) {
        throw new Error(result.error.message || ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
      }
      return result.data;
    },
    onSuccess: async () => {
      // Invalidate and refetch queries to ensure UI updates immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.organizations() }),
      ]);
      // Refetch to ensure data is fresh
      await Promise.all([
        queryClient.refetchQueries({ queryKey: queryKeys.auth.session() }),
        queryClient.refetchQueries({ queryKey: queryKeys.auth.organizations() }),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message || ORGANIZATION_ERRORS.SET_ACTIVE_FAILED);
    },
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      slug?: string;
      metadata?: { description?: string };
    }) => {
      const result = await authClient.organization.create({
        name: data.name,
        ...(data.slug ? { slug: data.slug } : {}),
        ...(data.metadata ? { metadata: data.metadata } : {}),
      } as Parameters<typeof authClient.organization.create>[0]);
      if (result.error) {
        throw new Error(result.error.message || ORGANIZATION_ERRORS.CREATE_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.organizations() });
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.lists() });
      toast.success(ORGANIZATION_SUCCESS.ORGANIZATION_CREATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ORGANIZATION_ERRORS.CREATE_FAILED);
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      organizationId: string;
      name?: string;
      slug?: string;
      metadata?: { description?: string };
    }) => {
      const result = await authClient.organization.update({
        organizationId: data.organizationId,
        ...(data.name !== undefined
          ? {
              data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.slug !== undefined ? { slug: data.slug } : {}),
                ...(data.metadata ? { metadata: data.metadata } : {}),
              },
            }
          : {}),
      } as Parameters<typeof authClient.organization.update>[0]);
      if (result.error) {
        throw new Error(result.error.message || ORGANIZATION_ERRORS.UPDATE_FAILED);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.organizations() });
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.organization(variables.organizationId),
      });
      toast.success(ORGANIZATION_SUCCESS.ORGANIZATION_UPDATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ORGANIZATION_ERRORS.UPDATE_FAILED);
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const result = await authClient.organization.delete({
        organizationId,
      });
      if (result.error) {
        throw new Error(result.error.message || ORGANIZATION_ERRORS.DELETE_FAILED);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.organizations() });
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      toast.success(ORGANIZATION_SUCCESS.ORGANIZATION_DELETED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ORGANIZATION_ERRORS.DELETE_FAILED);
    },
  });
}
