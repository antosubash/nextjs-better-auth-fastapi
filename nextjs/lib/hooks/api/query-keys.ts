export const queryKeys = {
  jobs: {
    all: ["jobs"] as const,
    lists: () => [...queryKeys.jobs.all, "list"] as const,
    list: (page: number, pageSize: number) => [...queryKeys.jobs.lists(), page, pageSize] as const,
    details: () => [...queryKeys.jobs.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.jobs.details(), id] as const,
    history: () => [...queryKeys.jobs.all, "history"] as const,
    historyList: (jobId: string | undefined, page: number, pageSize: number) =>
      [...queryKeys.jobs.history(), jobId, page, pageSize] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    lists: () => [...queryKeys.tasks.all, "list"] as const,
    list: (page: number, pageSize: number, statusFilter?: string | null) =>
      [...queryKeys.tasks.lists(), page, pageSize, statusFilter] as const,
    details: () => [...queryKeys.tasks.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
  },
  apiKeys: {
    all: ["apiKeys"] as const,
    lists: () => [...queryKeys.apiKeys.all, "list"] as const,
    list: () => [...queryKeys.apiKeys.lists()] as const,
    details: () => [...queryKeys.apiKeys.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.apiKeys.details(), id] as const,
  },
  organizations: {
    all: ["organizations"] as const,
    lists: () => [...queryKeys.organizations.all, "list"] as const,
    list: () => [...queryKeys.organizations.lists()] as const,
    details: () => [...queryKeys.organizations.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.organizations.details(), id] as const,
  },
  sessions: {
    all: ["sessions"] as const,
    lists: () => [...queryKeys.sessions.all, "list"] as const,
    list: () => [...queryKeys.sessions.lists()] as const,
  },
  stats: {
    all: ["stats"] as const,
    user: () => [...queryKeys.stats.all, "user"] as const,
    admin: () => [...queryKeys.stats.all, "admin"] as const,
  },
  permissions: {
    all: ["permissions"] as const,
    lists: () => [...queryKeys.permissions.all, "list"] as const,
    list: () => [...queryKeys.permissions.lists()] as const,
    roles: () => [...queryKeys.permissions.all, "roles"] as const,
    role: (roleName: string) => [...queryKeys.permissions.roles(), roleName] as const,
    assignableRoles: () => [...queryKeys.permissions.all, "assignableRoles"] as const,
    userPermissions: (userId: string) => [...queryKeys.permissions.all, "userPermissions", userId] as const,
  },
  storage: {
    all: ["storage"] as const,
  },
} as const;
