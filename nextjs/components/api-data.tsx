"use client";

import { useState } from "react";
import { callFastApi } from "@/lib/api-client";
import { API_DATA } from "@/lib/constants";
import { Send, Loader2, CheckCircle2, XCircle } from "lucide-react";

export function ApiData() {
  const [content, setContent] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setResponse(null);
    setIsLoading(true);

    try {
      const result = await callFastApi<{ content: string }>("/getdata", {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      setResponse(result.content);
      setSuccess(true);
      setContent("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : API_DATA.ERROR
      );
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        {API_DATA.TITLE}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {API_DATA.CONTENT_PLACEHOLDER}
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={API_DATA.CONTENT_PLACEHOLDER}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-gray-900 dark:text-white resize-none"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {API_DATA.LOADING}
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {API_DATA.SEND_BUTTON}
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {API_DATA.ERROR}
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {success && response && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              {API_DATA.SUCCESS}
            </p>
          </div>
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {API_DATA.RESPONSE_LABEL}
            </p>
            <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
              {response}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

