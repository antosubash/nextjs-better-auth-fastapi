"use client";

import { DOCTOR } from "@/lib/constants";
import { ApiKeyTest } from "@/components/api-key-test";
import { Stethoscope } from "lucide-react";

export default function AdminDoctorPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Stethoscope className="h-8 w-8 text-gray-900 dark:text-white" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {DOCTOR.PAGE_TITLE}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">{DOCTOR.DESCRIPTION}</p>
      </div>

      <div className="space-y-6">
        <ApiKeyTest />
      </div>
    </div>
  );
}
