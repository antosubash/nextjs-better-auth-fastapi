"use client";

import { ChevronDown, ChevronUp, Code, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { API_KEY_LABELS, API_KEY_PLACEHOLDERS } from "@/lib/constants";
import { statement } from "@/lib/permissions";

interface PermissionsEditorProps {
  value: Record<string, string[]>;
  onChange: (permissions: Record<string, string[]>) => void;
}

// Extract resources and actions from the permissions statement
const COMMON_RESOURCES = Object.keys(statement) as Array<keyof typeof statement>;

export function PermissionsEditor({ value, onChange }: PermissionsEditorProps) {
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
    if (newResource?.trim()) {
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
    if (newAction?.trim()) {
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
              throw new Error(`Invalid format: ${key} must be an array of strings`);
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
      setJsonError(err instanceof Error ? err.message : "Invalid JSON format");
    }
  };

  const resources = Object.keys(value);
  const allResources: string[] = Array.from(
    new Set([...COMMON_RESOURCES.map(String), ...resources])
  ).sort();

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
        <div className="space-y-2">
          <Textarea
            value={jsonValue}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder={API_KEY_PLACEHOLDERS.PERMISSIONS}
            rows={8}
            className={`font-mono text-sm ${jsonError ? "border-destructive" : ""}`}
          />
          {jsonError && (
            <Alert variant="destructive">
              <AlertDescription>{jsonError}</AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {allResources.map((resource) => {
            const actions = value[resource] || [];
            const isExpanded = expandedResources.has(resource);
            const isCustom = !COMMON_RESOURCES.includes(resource as keyof typeof statement);

            return (
              <Card key={resource}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleResource(resource)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 flex-1 justify-start p-0 h-auto font-medium"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                          <span className="capitalize">{resource}</span>
                          {actions.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {actions.length}{" "}
                              {actions.length === 1
                                ? API_KEY_LABELS.ACTION
                                : API_KEY_LABELS.ACTIONS_PLURAL}
                            </Badge>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      {isCustom && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeResource(resource)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {getResourceActions(resource).map((action) => {
                          const isSelected = actions.includes(action);
                          return (
                            <div
                              key={action}
                              className={`
                                flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors
                                ${
                                  isSelected
                                    ? "bg-primary/10 border-primary"
                                    : "bg-muted border-border hover:bg-muted/80"
                                }
                              `}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleAction(resource, action)}
                              />
                              <Label
                                className={`text-sm cursor-pointer ${
                                  isSelected ? "font-medium" : ""
                                }`}
                              >
                                {action}
                              </Label>
                            </div>
                          );
                        })}
                      </div>

                      {actions
                        .filter((action) => !getResourceActions(resource).includes(action))
                        .map((action) => (
                          <div
                            key={action}
                            className="flex items-center justify-between p-2 bg-muted rounded border"
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={true}
                                onCheckedChange={() => toggleAction(resource, action)}
                              />
                              <Label className="text-sm font-medium">{action}</Label>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleAction(resource, action)}
                              className="text-destructive hover:text-destructive h-8 w-8"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-dashed"
                        onClick={() => addCustomAction(resource)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {API_KEY_LABELS.ADD_CUSTOM_ACTION}
                      </Button>

                      {!value[resource] && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeResource(resource)}
                        >
                          {API_KEY_LABELS.REMOVE_RESOURCE}
                        </Button>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={addResource}
          >
            <Plus className="w-4 h-4 mr-2" />
            {API_KEY_LABELS.ADD_RESOURCE}
          </Button>
        </div>
      )}
    </div>
  );
}
