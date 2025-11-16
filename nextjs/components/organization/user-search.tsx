"use client";

import { Check, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MEMBER_ERRORS, USER_SEARCH_LABELS, USER_SEARCH_PLACEHOLDERS } from "@/lib/constants";
import { useAdminListUsers } from "@/lib/hooks/api/use-auth";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface UserSearchProps {
  value?: string;
  onSelect: (user: User | null) => void;
  existingMemberIds?: Set<string>;
  disabled?: boolean;
}

export function UserSearch({
  value,
  onSelect,
  existingMemberIds = new Set(),
  disabled,
}: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState(value || "");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (value !== undefined && value !== searchQuery) {
      setSearchQuery(value);
      setSelectedUser(null);
    }
  }, [value, searchQuery]);

  const {
    data: usersData,
    isLoading,
    error: queryError,
  } = useAdminListUsers({
    searchValue: searchQuery.length >= 2 ? searchQuery : undefined,
    limit: "20",
    offset: "0",
    enabled: searchQuery.length >= 2,
  });

  useEffect(() => {
    if (usersData) {
      const usersArray = (usersData as { users?: User[] })?.users || [];
      setUsers(usersArray);
    } else if (searchQuery.length < 2) {
      setUsers([]);
    }
  }, [usersData, searchQuery]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message || MEMBER_ERRORS.SEARCH_FAILED);
    } else {
      setError("");
    }
  }, [queryError]);

  const handleSelect = (user: User) => {
    setSelectedUser(user);
    setSearchQuery(user.email);
    onSelect(user);
  };

  const isAlreadyMember = (userId: string) => {
    return existingMemberIds.has(userId);
  };

  return (
    <Command className="rounded-lg border">
      <CommandInput
        placeholder={USER_SEARCH_PLACEHOLDERS.SEARCH}
        value={searchQuery}
        onValueChange={setSearchQuery}
        disabled={disabled}
      />
      <CommandList>
        {isLoading ? (
          <div className="py-6 text-center text-sm text-gray-500">
            {USER_SEARCH_LABELS.LOADING_USERS}
          </div>
        ) : error ? (
          <div className="py-6 text-center text-sm text-red-500">{error}</div>
        ) : users.length === 0 && searchQuery.length >= 2 ? (
          <CommandEmpty>{USER_SEARCH_LABELS.NO_USERS_FOUND}</CommandEmpty>
        ) : (
          <CommandGroup>
            {users.map((user) => {
              const isMember = isAlreadyMember(user.id);
              return (
                <CommandItem
                  key={user.id}
                  value={user.email}
                  onSelect={() => !isMember && handleSelect(user)}
                  disabled={isMember || disabled}
                  className={cn("cursor-pointer", isMember && "opacity-50 cursor-not-allowed")}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <UserIcon className="w-6 h-6 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{user.name || user.email}</div>
                      {user.name && <div className="text-sm text-gray-500">{user.email}</div>}
                    </div>
                    {isMember && (
                      <span className="text-xs text-gray-500">
                        {USER_SEARCH_LABELS.USER_ALREADY_MEMBER}
                      </span>
                    )}
                    {selectedUser?.id === user.id && !isMember && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
