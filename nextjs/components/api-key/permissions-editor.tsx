"use client";

import { ChevronDown, Code, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { API_KEY_LABELS, API_KEY_PLACEHOLDERS } from "@/lib/constants";
import { statement } from "@/lib/permissions";

interface PermissionsEditorProps {
  value: Record<string, string[]>;
  onChange: (permissions: Record<string, string[]>) => void;
}

// Extract resources and actions from the permissions statement
const COMMON_RESOURCES = Object.keys(statement) as Array<keyof typeof statement>;

interface AddResourceFormValues {
  resource: string;
}

interface AddActionFormValues {
  action: string;
}

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

  const resourceForm = useForm<AddResourceFormValues>({
    defaultValues: {
      resource: "",
    },
  });

  const actionForm = useForm<AddActionFormValues>({
    defaultValues: {
      action: "",
    },
  });

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

  const handleAddResource = (values: AddResourceFormValues) => {
    const resource = values.resource.trim().toLowerCase();
    if (resource && !value[resource]) {
      onChange({ ...value, [resource]: [] });
      setExpandedResources(new Set([...expandedResources, resource]));
      resourceForm.reset();
      setShowAddResourceDialog(false);
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

  const handleAddCustomAction = (values: AddActionFormValues) => {
    const action = values.action.trim().toLowerCase();
    if (action && currentResourceForAction) {
      const currentActions = value[currentResourceForAction] || [];
      if (!currentActions.includes(action)) {
        onChange({ ...value, [currentResourceForAction]: [...currentActions, action] });
      }
      actionForm.reset();
      setShowAddActionDialog(false);
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
              const isCustom = !COMMON_RESOURCES.includes(resource as keyof typeof statement);
              const predefinedActions = getResourceActions(resource);
              const customActions = actions.filter((action) => !predefinedActions.includes(action));
              const allSelected =
                predefinedActions.length > 0 &&
                predefinedActions.every((action) => actions.includes(action));

              return (
                <Card
                  key={resource}
                  className={cn(
                    "transition-all duration-200",
                    isExpanded ? "shadow-md" : "!pb-0 !pt-3 shadow-sm hover:shadow-md"
                  )}
                >
                  <Collapsible open={isExpanded} onOpenChange={() => toggleResource(resource)}>
                    <CardHeader className="pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="flex items-center gap-3 flex-1 justify-start p-0 h-auto font-semibold text-base hover:bg-accent/50 rounded-lg px-3 py-2 -ml-3 transition-colors"
                          >
                            <ChevronDown
                              className={cn(
                                "w-5 h-5 transition-transform duration-200 text-muted-foreground",
                                isExpanded ? "rotate-180" : "rotate-0"
                              )}
                            />
                            <span className="capitalize text-base">{resource}</span>
                            {actions.length > 0 && (
                              <Badge variant="secondary" className="ml-auto text-xs font-medium">
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
                            onClick={(e) => {
                              e.stopPropagation();
                              removeResource(resource);
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    <CollapsibleContent>
                      <CardContent className="space-y-4 pt-0">
                        {predefinedActions.length > 0 && (
                          <>
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">
                                {API_KEY_LABELS.PREDEFINED_ACTIONS}
                              </Label>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => selectAllActions(resource)}
                                  disabled={allSelected}
                                >
                                  {API_KEY_LABELS.SELECT_ALL}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deselectAllActions(resource)}
                                  disabled={actions.length === 0}
                                >
                                  {API_KEY_LABELS.DESELECT_ALL}
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {predefinedActions.map((action) => {
                                const isSelected = actions.includes(action);
                                const actionId = `action-${resource}-${action}`;
                                return (
                                  <div
                                    key={action}
                                    className={`
                                      flex items-center gap-2 p-2 rounded border transition-colors
                                      ${
                                        isSelected
                                          ? "bg-primary/10 border-primary"
                                          : "bg-muted border-border hover:bg-muted/80"
                                      }
                                    `}
                                  >
                                    <Checkbox
                                      id={actionId}
                                      checked={isSelected}
                                      onCheckedChange={() => toggleAction(resource, action)}
                                    />
                                    <Label
                                      htmlFor={actionId}
                                      className={`text-sm cursor-pointer flex-1 ${
                                        isSelected ? "font-medium" : ""
                                      }`}
                                    >
                                      {action}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}

                        {customActions.length > 0 && (
                          <>
                            {predefinedActions.length > 0 && <Separator />}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">
                                {API_KEY_LABELS.CUSTOM_ACTIONS}
                              </Label>
                              <div className="space-y-2">
                                {customActions.map((action) => (
                                  <div
                                    key={action}
                                    className="flex items-center justify-between p-2 bg-muted rounded border"
                                  >
                                    <div className="flex items-center gap-2 flex-1">
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
                              </div>
                            </div>
                          </>
                        )}

                        <Separator />

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1 border-dashed"
                            onClick={() => openAddActionDialog(resource)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {API_KEY_LABELS.ADD_CUSTOM_ACTION}
                          </Button>
                          {!value[resource] && (
                            <Button
                              type="button"
                              variant="outline"
                              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => removeResource(resource)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {API_KEY_LABELS.REMOVE_RESOURCE}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
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

      <Dialog open={showAddResourceDialog} onOpenChange={setShowAddResourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{API_KEY_LABELS.ADD_RESOURCE}</DialogTitle>
            <DialogDescription>{API_KEY_PLACEHOLDERS.PERMISSIONS}</DialogDescription>
          </DialogHeader>
          <Form {...resourceForm}>
            <form onSubmit={resourceForm.handleSubmit(handleAddResource)} className="space-y-4">
              <FormField
                control={resourceForm.control}
                name="resource"
                rules={{
                  required: "Resource name is required",
                  validate: (val) => {
                    const resource = val.trim().toLowerCase();
                    if (value[resource]) {
                      return "Resource already exists";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{API_KEY_LABELS.RESOURCE_NAME}</FormLabel>
                    <FormControl>
                      <Input placeholder={API_KEY_PLACEHOLDERS.PERMISSIONS} {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddResourceDialog(false);
                    resourceForm.reset();
                  }}
                >
                  {API_KEY_LABELS.CANCEL}
                </Button>
                <Button type="submit">{API_KEY_LABELS.ADD}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddActionDialog} onOpenChange={setShowAddActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{API_KEY_LABELS.ADD_CUSTOM_ACTION}</DialogTitle>
            <DialogDescription>
              Add a custom action for the resource:{" "}
              <span className="font-medium capitalize">{currentResourceForAction}</span>
            </DialogDescription>
          </DialogHeader>
          <Form {...actionForm}>
            <form onSubmit={actionForm.handleSubmit(handleAddCustomAction)} className="space-y-4">
              <FormField
                control={actionForm.control}
                name="action"
                rules={{
                  required: "Action name is required",
                  validate: (val) => {
                    const action = val.trim().toLowerCase();
                    const currentActions = value[currentResourceForAction] || [];
                    if (currentActions.includes(action)) {
                      return "Action already exists";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{API_KEY_LABELS.ACTION_NAME}</FormLabel>
                    <FormControl>
                      <Input placeholder={API_KEY_PLACEHOLDERS.ACTION_NAME} {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddActionDialog(false);
                    actionForm.reset();
                    setCurrentResourceForAction("");
                  }}
                >
                  {API_KEY_LABELS.CANCEL}
                </Button>
                <Button type="submit">{API_KEY_LABELS.ADD}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
