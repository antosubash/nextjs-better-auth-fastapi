"use client";

import { useState, useEffect } from "react";
import {
  API_KEY_LABELS,
  API_KEY_PLACEHOLDERS,
} from "@/lib/constants";
import { statement } from "@/lib/permissions";
import { Plus, Trash2, ChevronDown, ChevronUp, Code } from "lucide-react";

interface PermissionsEditorProps {
  value: Record<string, string[]>;
  onChange: (permissions: Record<string, string[]>) => void;
}

// Extract resources and actions from the permissions statement
const COMMON_RESOURCES = Object.keys(statement) as Array<keyof typeof statement>;

export function PermissionsEditor({
  value,
  onChange,
}: PermissionsEditorProps) {
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonValue, setJsonValue] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [expandedResources, setExpandedResources] = useState<Set<string>>(
    new Set(Object.keys(value))
  );

  useEffect(() => {
    setJsonValue(JSON.stringify(value, null, 2));
  }, [value]);

  const toggleResource = (resource: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(resource)) {
      newExpanded.delete(resource);
    } else {
      newExpanded.add(resource);
    }
    setExpandedResources(newExpanded);
  };

  const addResource = () => {
    const newResource = prompt(API_KEY_PLACEHOLDERS.PERMISSIONS);
    if (newResource && newResource.trim()) {
      const resource = newResource.trim().toLowerCase();
      if (!value[resource]) {
        onChange({ ...value, [resource]: [] });
        setExpandedResources(new Set([...expandedResources, resource]));
      }
    }
  };

  const removeResource = (resource: string) => {
    const newValue = { ...value };
    delete newValue[resource];
    onChange(newValue);
    const newExpanded = new Set(expandedResources);
    newExpanded.delete(resource);
    setExpandedResources(newExpanded);
  };

  const toggleAction = (resource: string, action: string) => {
    const currentActions = value[resource] || [];
    const newActions = currentActions.includes(action)
      ? currentActions.filter((a) => a !== action)
      : [...currentActions, action];
    onChange({ ...value, [resource]: newActions });
  };

  const addCustomAction = (resource: string) => {
    const newAction = prompt(API_KEY_PLACEHOLDERS.ACTION_NAME);
    if (newAction && newAction.trim()) {
      const action = newAction.trim().toLowerCase();
      const currentActions = value[resource] || [];
      if (!currentActions.includes(action)) {
        onChange({ ...value, [resource]: [...currentActions, action] });
      }
    }
  };

  const handleJsonChange = (json: string) => {
    setJsonValue(json);
    setJsonError("");
    try {
      if (json.trim()) {
        const parsed = JSON.parse(json);
        if (typeof parsed === "object" && !Array.isArray(parsed)) {
          // Validate structure
          for (const [key, val] of Object.entries(parsed)) {
            if (!Array.isArray(val)) {
              throw new Error(
                `Invalid format: ${key} must be an array of strings`,
              );
            }
          }
          onChange(parsed);
        } else {
          throw new Error("Permissions must be an object");
        }
      } else {
        onChange({});
      }
    } catch (err) {
      setJsonError(
        err instanceof Error ? err.message : "Invalid JSON format",
      );
    }
  };

  const resources = Object.keys(value);
  const allResources: string[] = Array.from(
    new Set([...COMMON_RESOURCES.map(String), ...resources]),
  ).sort();

  // Get available actions for a specific resource
  const getResourceActions = (resource: string): readonly string[] => {
    return statement[resource as keyof typeof statement] || [];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {API_KEY_LABELS.PERMISSIONS}
        </label>
        <button
          type="button"
          onClick={() => setShowJsonEditor(!showJsonEditor)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        >
          <Code className="w-4 h-4" />
          {showJsonEditor
            ? API_KEY_LABELS.VISUAL_EDITOR
            : API_KEY_LABELS.JSON_EDITOR}
        </button>
      </div>

      {showJsonEditor ? (
        <div>
          <textarea
            value={jsonValue}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder={API_KEY_PLACEHOLDERS.PERMISSIONS}
            rows={8}
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white font-mono text-sm ${
              jsonError
                ? "border-red-300 dark:border-red-700"
                : "border-gray-300 dark:border-gray-700"
            }`}
          />
          {jsonError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {jsonError}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {allResources.map((resource) => {
            const actions = value[resource] || [];
            const isExpanded = expandedResources.has(resource);
            const isCustom = !COMMON_RESOURCES.includes(resource as keyof typeof statement);

            return (
              <div
                key={resource}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900">
                  <button
                    type="button"
                    onClick={() => toggleResource(resource)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {resource}
                    </span>
                    {actions.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                        {actions.length}{" "}
                        {actions.length === 1
                          ? API_KEY_LABELS.ACTION
                          : API_KEY_LABELS.ACTIONS_PLURAL}
                      </span>
                    )}
                  </button>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => removeResource(resource)}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="p-4 bg-white dark:bg-gray-800 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {getResourceActions(resource).map((action) => {
                        const isSelected = actions.includes(action);
                        return (
                          <label
                            key={action}
                            className={`
                              flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors
                              ${
                                isSelected
                                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                  : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAction(resource, action)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span
                              className={`text-sm ${
                                isSelected
                                  ? "text-blue-900 dark:text-blue-100 font-medium"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {action}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {actions
                      .filter((action) => !getResourceActions(resource).includes(action))
                      .map((action) => (
                        <div
                          key={action}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={() => toggleAction(resource, action)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                              {action}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleAction(resource, action)}
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                    <button
                      type="button"
                      onClick={() => addCustomAction(resource)}
                      className="w-full px-3 py-2 text-sm border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      + {API_KEY_LABELS.ADD_CUSTOM_ACTION}
                    </button>

                    {!value[resource] && (
                      <button
                        type="button"
                        onClick={() => removeResource(resource)}
                        className="w-full px-3 py-2 text-sm border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        {API_KEY_LABELS.REMOVE_RESOURCE}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addResource}
            className="w-full px-4 py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {API_KEY_LABELS.ADD_RESOURCE}
          </button>
        </div>
      )}
    </div>
  );
}

