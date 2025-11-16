import { useQuery } from "@tanstack/react-query";
import {
  getPermissions,
  getRoles,
  getAssignableUserRoles,
  getRole,
  getUserPermissions,
} from "@/lib/api/permissions";
import { queryKeys } from "./query-keys";

export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.permissions.list(),
    queryFn: () => getPermissions(),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: queryKeys.permissions.roles(),
    queryFn: () => getRoles(),
  });
}

export function useAssignableUserRoles() {
  return useQuery({
    queryKey: queryKeys.permissions.assignableRoles(),
    queryFn: () => getAssignableUserRoles(),
  });
}

export function useRole(roleName: string) {
  return useQuery({
    queryKey: queryKeys.permissions.role(roleName),
    queryFn: () => getRole(roleName),
    enabled: !!roleName,
  });
}

export function useUserPermissions(userId: string) {
  return useQuery({
    queryKey: queryKeys.permissions.userPermissions(userId),
    queryFn: () => getUserPermissions(userId),
    enabled: !!userId,
  });
}
