"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import {
  ADMIN_LABELS,
  ADMIN_ERRORS,
  ADMIN_SUCCESS,
  USER_ROLES,
} from "@/lib/constants";
import { UserForm } from "./user-form";
import { UserActions } from "./user-actions";
import { Search, Plus, Users } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: number;
  createdAt: number;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 10;

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await authClient.admin.listUsers({
        query: {
          searchValue: searchValue || undefined,
          limit: limit.toString(),
          offset: ((currentPage - 1) * limit).toString(),
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });

      if (result.error) {
        setError(result.error.message || ADMIN_ERRORS.LOAD_USERS_FAILED);
      } else if (result.data) {
        const usersData = (result.data as { users?: User[] })?.users || [];
        setUsers(
          usersData.map((u) => ({
            ...u,
            banned: u.banned ?? false,
          })),
        );
        setTotalUsers(result.data.total || 0);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ADMIN_ERRORS.LOAD_USERS_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchValue]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleUserCreated = () => {
    setShowCreateForm(false);
    setSuccess(ADMIN_SUCCESS.USER_CREATED);
    setTimeout(() => setSuccess(""), 3000);
    loadUsers();
  };

  const handleUserUpdated = () => {
    setEditingUser(null);
    setSuccess(ADMIN_SUCCESS.USER_UPDATED);
    setTimeout(() => setSuccess(""), 3000);
    loadUsers();
  };

  const handleUserDeleted = () => {
    setSuccess(ADMIN_SUCCESS.USER_DELETED);
    setTimeout(() => setSuccess(""), 3000);
    loadUsers();
  };

  const handleActionSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
    loadUsers();
  };

  const totalPages = Math.ceil(totalUsers / limit);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-gray-900 dark:text-white" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {ADMIN_LABELS.TITLE}
          </h1>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          <Plus className="w-5 h-5" />
          {ADMIN_LABELS.CREATE_USER}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
          {success}
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6">
          <UserForm
            onSuccess={handleUserCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {editingUser && (
        <div className="mb-6">
          <UserForm
            user={editingUser}
            onSuccess={handleUserUpdated}
            onCancel={() => setEditingUser(null)}
          />
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={ADMIN_LABELS.SEARCH_USERS}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            {ADMIN_LABELS.LOADING}
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            {ADMIN_LABELS.NO_USERS}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {ADMIN_LABELS.NAME}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {ADMIN_LABELS.EMAIL}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {ADMIN_LABELS.ROLE}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {ADMIN_LABELS.STATUS}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {ADMIN_LABELS.ACTIONS}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                          {user.role || USER_ROLES.USER}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.banned ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                            {ADMIN_LABELS.BANNED}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                            {ADMIN_LABELS.ACTIVE}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <UserActions
                          user={user}
                          onEdit={() => setEditingUser(user)}
                          onDelete={handleUserDeleted}
                          onActionSuccess={handleActionSuccess}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {(currentPage - 1) * limit + 1} to{" "}
                  {Math.min(currentPage * limit, totalUsers)} of {totalUsers}{" "}
                  users
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
