"use client";

import { ORGANIZATION_ROLES } from "@/lib/constants";

interface MemberRoleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MemberRoleSelector({ value, onChange, disabled }: MemberRoleSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value={ORGANIZATION_ROLES.MEMBER}>{ORGANIZATION_ROLES.MEMBER}</option>
      <option value={ORGANIZATION_ROLES.ADMIN}>{ORGANIZATION_ROLES.ADMIN}</option>
      <option value={ORGANIZATION_ROLES.OWNER}>{ORGANIZATION_ROLES.OWNER}</option>
      <option value={ORGANIZATION_ROLES.MY_CUSTOM_ROLE}>{ORGANIZATION_ROLES.MY_CUSTOM_ROLE}</option>
    </select>
  );
}
