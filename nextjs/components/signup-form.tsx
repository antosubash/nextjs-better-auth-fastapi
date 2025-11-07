"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AUTH_LABELS, AUTH_PLACEHOLDERS, AUTH_ERRORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message || AUTH_ERRORS.SIGNUP_FAILED);
      } else {
        window.location.reload();
      }
    } catch {
      setError(AUTH_ERRORS.SIGNUP_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium">
          {AUTH_LABELS.NAME}
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={AUTH_PLACEHOLDERS.NAME}
          required
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          {AUTH_LABELS.EMAIL}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={AUTH_PLACEHOLDERS.EMAIL}
          required
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          {AUTH_LABELS.PASSWORD}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={AUTH_PLACEHOLDERS.PASSWORD}
          required
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200"
        )}
      >
        {isLoading ? "Loading..." : AUTH_LABELS.SIGNUP}
      </button>

      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        {AUTH_LABELS.ALREADY_HAVE_ACCOUNT}{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-black hover:underline dark:text-white"
        >
          {AUTH_LABELS.LOGIN}
        </button>
      </p>
    </form>
  );
}

