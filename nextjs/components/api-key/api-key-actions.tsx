"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  API_KEY_LABELS,
  API_KEY_ERRORS,
  API_KEY_SUCCESS,
} from "@/lib/constants";
import { MoreVertical, Trash2, Edit, Power, PowerOff, Eye } from "lucide-react";

interface ApiKey {
  id: string;
  name?: string | null;
  enabled?: boolean;
}

interface ApiKeyActionsProps {
  apiKey: ApiKey;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  onActionSuccess: (message: string) => void;
}

export function ApiKeyActions({
  apiKey,
  onEdit,
  onDelete,
  onViewDetails,
  onActionSuccess,
}: ApiKeyActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggleEnabled = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/api-keys/${apiKey.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: !apiKey.enabled,
        }),
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        alert(result.error || API_KEY_ERRORS.UPDATE_FAILED);
      } else {
        onActionSuccess(
          apiKey.enabled
            ? API_KEY_SUCCESS.API_KEY_DISABLED
            : API_KEY_SUCCESS.API_KEY_ENABLED,
        );
        setIsOpen(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : API_KEY_ERRORS.UPDATE_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(API_KEY_LABELS.CONFIRM_DELETE)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/api-keys/${apiKey.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        alert(result.error || API_KEY_ERRORS.DELETE_FAILED);
      } else {
        onDelete();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : API_KEY_ERRORS.DELETE_FAILED;
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
          });
        }
      };

      updatePosition();

      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  const dropdownContent = isOpen && dropdownPosition && (
    <>
      <div
        className="fixed inset-0 z-10"
        onClick={() => setIsOpen(false)}
      />
      <div
        className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
        style={{
          top: `${dropdownPosition.top}px`,
          right: `${dropdownPosition.right}px`,
        }}
      >
        <button
          onClick={() => {
            setIsOpen(false);
            onViewDetails();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          {API_KEY_LABELS.VIEW_DETAILS}
        </button>

        <button
          onClick={() => {
            setIsOpen(false);
            onEdit();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          {API_KEY_LABELS.EDIT_API_KEY}
        </button>

        <button
          onClick={() => {
            setIsOpen(false);
            handleToggleEnabled();
          }}
          disabled={isLoading}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          {apiKey.enabled ? (
            <>
              <PowerOff className="w-4 h-4" />
              {API_KEY_LABELS.DISABLED}
            </>
          ) : (
            <>
              <Power className="w-4 h-4" />
              {API_KEY_LABELS.ENABLED}
            </>
          )}
        </button>

        <button
          onClick={() => {
            setIsOpen(false);
            handleDelete();
          }}
          disabled={isLoading}
          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          {API_KEY_LABELS.DELETE_API_KEY}
        </button>
      </div>
    </>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
      >
        <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {typeof window !== "undefined" &&
        dropdownContent &&
        createPortal(dropdownContent, document.body)}
    </div>
  );
}

