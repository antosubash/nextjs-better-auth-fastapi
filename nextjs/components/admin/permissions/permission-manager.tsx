"use client";

import { useState } from "react";
import { PermissionList } from "./permission-list";
import { RolePermissions } from "./role-permissions";
import { UserRoleManager } from "./user-role-manager";
import { PERMISSION_LABELS } from "@/lib/constants";
import { Shield, Users, List } from "lucide-react";

type Tab = "permissions" | "roles" | "users";

export function PermissionManager() {
  const [activeTab, setActiveTab] = useState<Tab>("permissions");

  const tabs = [
    {
      id: "permissions" as Tab,
      label: PERMISSION_LABELS.PERMISSIONS,
      icon: List,
    },
    {
      id: "roles" as Tab,
      label: PERMISSION_LABELS.ROLES,
      icon: Shield,
    },
    {
      id: "users" as Tab,
      label: PERMISSION_LABELS.USERS,
      icon: Users,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-gray-900 dark:text-white" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {PERMISSION_LABELS.TITLE}
          </h1>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      isActive
                        ? "border-gray-900 text-gray-900 dark:border-white dark:text-white"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "permissions" && <PermissionList />}
        {activeTab === "roles" && <RolePermissions />}
        {activeTab === "users" && <UserRoleManager />}
      </div>
    </div>
  );
}

