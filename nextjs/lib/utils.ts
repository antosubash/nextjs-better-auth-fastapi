import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { USER_ROLES } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDashboardPath(userRole?: string | null): string {
  return userRole === USER_ROLES.ADMIN ? "/admin/dashboard" : "/dashboard"
}
