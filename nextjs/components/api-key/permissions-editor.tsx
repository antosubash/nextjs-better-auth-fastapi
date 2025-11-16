"use client";

import { Code, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_KEY_LABELS } from "@/lib/constants";
import { statement } from "@/lib/permissions";
import { AddActionDialog, AddResourceDialog } from "./permissions-dialogs";
import { PermissionsJsonEditor } from "./permissions-json-editor";
import { PermissionsResourceCard } from "./permissions-resource-card";

interface PermissionsEditorProps {
  value: Record<string, string[]>;
  onChange: (permissions: Record<string, string[]>) => void;
}

const COMMON_RESOURCES = Object.keys(statement) as Array<keyof typeof statement>;

export function PermissionsEditor({ value, onChange }: PermissionsEditorProps) {
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonValue, setJsonValue] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [expandedResources, setExpandedResources] = useState<Set<string>>(
    new Set(Object.keys(value))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddResourceDialog, setShowAddResourceDialog] = useState(false);
  const [showAddActionDialog, setShowAddActionDialog] = useState(false);
  const [currentResourceForAction, setCurrentResourceForAction] = useState<string>("");

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

  const handleAddResource = (resource: string) => {
    onChange({ ...value, [resource]: [] });
    setExpandedResources(new Set([...expandedResources, resource]));
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

  const handleAddCustomAction = (action: string) => {
    if (currentResourceForAction) {
      const currentActions = value[currentResourceForAction] || [];
      if (!currentActions.includes(action)) {
        onChange({ ...value, [currentResourceForAction]: [...currentActions, action] });
      }
      setCurrentResourceForAction("");
    }
  };

  const openAddActionDialog = (resource: string) => {
    setCurrentResourceForAction(resource);
    setShowAddActionDialog(true);
  };

  const selectAllActions = (resource: string) => {
    const availableActions = getResourceActions(resource);
    onChange({ ...value, [resource]: [...availableActions] });
  };

  const deselectAllActions = (resource: string) => {
    onChange({ ...value, [resource]: [] });
  };

  const validateParsedPermissions = (parsed: unknown): parsed is Record<string, string[]> => {
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Permissions must be an object");
    }
    for (const [key, val] of Object.entries(parsed)) {
      if (!Array.isArray(val)) {
        throw new Error(`Invalid format: ${key} must be an array of strings`);
      }
    }
    return true;
  };

  const handleJsonChange = (json: string) => {
    setJsonValue(json);
    setJsonError("");
    try {
      if (json.trim()) {
        const parsed = JSON.parse(json);
        if (validateParsedPermissions(parsed)) {
          onChange(parsed);
        }
      } else {
        onChange({});
      }
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON format");
    }
  };

  const resources = Object.keys(value);
  const allResources: string[] = Array.from(
    new Set([...COMMON_RESOURCES.map(String), ...resources])
  ).sort();

  // Filter resources based on search query
  const filteredResources = allResources.filter((resource) =>
    resource.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get available actions for a specific resource
  const getResourceActions = (resource: string): readonly string[] => {
    return statement[resource as keyof typeof statement] || [];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{API_KEY_LABELS.PERMISSIONS}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowJsonEditor(!showJsonEditor)}
        >
          <Code className="w-4 h-4 mr-2" />
          {showJsonEditor ? API_KEY_LABELS.VISUAL_EDITOR : API_KEY_LABELS.JSON_EDITOR}
        </Button>
      </div>

      {showJsonEditor ? (
        <PermissionsJsonEditor value={jsonValue} error={jsonError} onChange={handleJsonChange} />
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder={API_KEY_LABELS.SEARCH_RESOURCES}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchQuery && (
              <Button type="button" variant="ghost" size="icon" onClick={() => setSearchQuery("")}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {filteredResources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? "No resources found" : "No resources available"}
            </div>
          ) : (
            filteredResources.map((resource) => {
              const actions = value[resource] || [];
              const isExpanded = expandedResources.has(resource);
              return (
                <PermissionsResourceCard
                  key={resource}
                  resource={resource}
                  actions={actions}
                  isExpanded={isExpanded}
                  onToggle={() => toggleResource(resource)}
                  onToggleAction={(action) => toggleAction(resource, action)}
                  onSelectAll={() => selectAllActions(resource)}
                  onDeselectAll={() => deselectAllActions(resource)}
                  onRemoveResource={() => removeResource(resource)}
                  onAddCustomAction={() => openAddActionDialog(resource)}
                />
              );
            })
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setShowAddResourceDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {API_KEY_LABELS.ADD_RESOURCE}
          </Button>
        </div>
      )}

      <AddResourceDialog
        open={showAddResourceDialog}
        onOpenChange={setShowAddResourceDialog}
        onSubmit={handleAddResource}
        existingResources={Object.keys(value)}
      />

      <AddActionDialog
        open={showAddActionDialog}
        onOpenChange={(open) => {
          setShowAddActionDialog(open);
          if (!open) {
            setCurrentResourceForAction("");
          }
        }}
        onSubmit={handleAddCustomAction}
        resource={currentResourceForAction}
        existingActions={value[currentResourceForAction] || []}
      />
    </div>
  );
}
