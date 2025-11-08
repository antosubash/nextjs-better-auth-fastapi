"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  INVITATION_LABELS,
  INVITATION_ERRORS,
  INVITATION_SUCCESS,
} from "@/lib/constants";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "processing"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const acceptInvitation = async () => {
      if (!token) {
        setStatus("error");
        setMessage(INVITATION_ERRORS.INVALID_TOKEN);
        return;
      }

      setStatus("processing");
      try {
        const result = await authClient.organization.acceptInvitation({
          invitationId: token,
        });

        if (result.error) {
          setStatus("error");
          setMessage(result.error.message || INVITATION_ERRORS.ACCEPT_FAILED);
        } else {
          setStatus("success");
          setMessage(INVITATION_SUCCESS.INVITATION_ACCEPTED);
          setTimeout(() => {
            router.push("/admin/organizations");
          }, 2000);
        }
      } catch (err) {
        setStatus("error");
        const errorMessage =
          err instanceof Error ? err.message : INVITATION_ERRORS.ACCEPT_FAILED;
        setMessage(errorMessage);
      }
    };

    acceptInvitation();
  }, [token, router]);

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          {status === "loading" || status === "processing" ? (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-gray-600 dark:text-gray-400 animate-spin" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {status === "loading" ? "Loading..." : "Processing Invitation"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we process your invitation...
              </p>
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600 dark:text-green-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {INVITATION_LABELS.ACCEPT_INVITATION}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Redirecting to organizations...
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600 dark:text-red-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Error
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
              <button
                onClick={() => router.push("/admin/organizations")}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Go to Organizations
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
