"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { API_KEY_LABELS } from "@/lib/constants";
import { statement } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const COMMON_RESOURCES = Object.keys(statement) as Array<keyof typeof statement>;

interface PermissionsResourceCardProps {
  resource: string;
  actions: string[];
  isExpanded: boolean;
  onToggle: () => void;
  onToggleAction: (action: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRemoveResource: () => void;
  onAddCustomAction: () => void;
}

export function PermissionsResourceCard({
  resource,
  actions,
  isExpanded,
  onToggle,
  onToggleAction,
  onSelectAll,
  onDeselectAll,
  onRemoveResource,
  onAddCustomAction,
}: PermissionsResourceCardProps) {
  const isCustom = !COMMON_RESOURCES.includes(resource as keyof typeof statement);
  const predefinedActions: readonly string[] =
    (resource in statement ? statement[resource as keyof typeof statement] : []) || [];
  const customActions = actions.filter((action) => !predefinedActions.includes(action));
  const allSelected =
    predefinedActions.length > 0 && predefinedActions.every((action) => actions.includes(action));

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isExpanded ? "shadow-md" : "!pb-0 !pt-3 shadow-sm hover:shadow-md"
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
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
                    {actions.length === 1 ? API_KEY_LABELS.ACTION : API_KEY_LABELS.ACTIONS_PLURAL}
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
                  onRemoveResource();
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
                  <Label className="text-sm font-medium">{API_KEY_LABELS.PREDEFINED_ACTIONS}</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onSelectAll}
                      disabled={allSelected}
                    >
                      {API_KEY_LABELS.SELECT_ALL}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onDeselectAll}
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
                          onCheckedChange={() => onToggleAction(action)}
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
                          <Checkbox checked={true} onCheckedChange={() => onToggleAction(action)} />
                          <Label className="text-sm font-medium">{action}</Label>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onToggleAction(action)}
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
                onClick={onAddCustomAction}
              >
                <Plus className="w-4 h-4 mr-2" />
                {API_KEY_LABELS.ADD_CUSTOM_ACTION}
              </Button>
              {actions.length === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={onRemoveResource}
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
}
