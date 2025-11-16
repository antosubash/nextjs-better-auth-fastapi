"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import { API_KEY_LABELS, API_KEY_PLACEHOLDERS } from "@/lib/constants";

interface AddResourceFormValues {
  resource: string;
}

interface AddActionFormValues {
  action: string;
}

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (resource: string) => void;
  existingResources: string[];
}

export function AddResourceDialog({
  open,
  onOpenChange,
  onSubmit,
  existingResources,
}: AddResourceDialogProps) {
  const form = useForm<AddResourceFormValues>({
    defaultValues: {
      resource: "",
    },
  });

  const handleSubmit = (values: AddResourceFormValues) => {
    const resource = values.resource.trim().toLowerCase();
    if (resource && !existingResources.includes(resource)) {
      onSubmit(resource);
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{API_KEY_LABELS.ADD_RESOURCE}</DialogTitle>
          <DialogDescription>{API_KEY_PLACEHOLDERS.PERMISSIONS}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="resource"
              rules={{
                required: "Resource name is required",
                validate: (val) => {
                  const resource = val.trim().toLowerCase();
                  if (existingResources.includes(resource)) {
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
                  onOpenChange(false);
                  form.reset();
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
  );
}

interface AddActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (action: string) => void;
  resource: string;
  existingActions: string[];
}

export function AddActionDialog({
  open,
  onOpenChange,
  onSubmit,
  resource,
  existingActions,
}: AddActionDialogProps) {
  const form = useForm<AddActionFormValues>({
    defaultValues: {
      action: "",
    },
  });

  const handleSubmit = (values: AddActionFormValues) => {
    const action = values.action.trim().toLowerCase();
    if (action && !existingActions.includes(action)) {
      onSubmit(action);
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{API_KEY_LABELS.ADD_CUSTOM_ACTION}</DialogTitle>
          <DialogDescription>
            Add a custom action for the resource:{" "}
            <span className="font-medium capitalize">{resource}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="action"
              rules={{
                required: "Action name is required",
                validate: (val) => {
                  const action = val.trim().toLowerCase();
                  if (existingActions.includes(action)) {
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
                  onOpenChange(false);
                  form.reset();
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
  );
}
