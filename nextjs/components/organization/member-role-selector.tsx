"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORGANIZATION_ROLES } from "@/lib/constants";

interface MemberRoleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

export function MemberRoleSelector({ value, onChange, disabled, id }: MemberRoleSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ORGANIZATION_ROLES.MEMBER}>{ORGANIZATION_ROLES.MEMBER}</SelectItem>
        <SelectItem value={ORGANIZATION_ROLES.ADMIN}>{ORGANIZATION_ROLES.ADMIN}</SelectItem>
        <SelectItem value={ORGANIZATION_ROLES.OWNER}>{ORGANIZATION_ROLES.OWNER}</SelectItem>
        <SelectItem value={ORGANIZATION_ROLES.MY_CUSTOM_ROLE}>
          {ORGANIZATION_ROLES.MY_CUSTOM_ROLE}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
