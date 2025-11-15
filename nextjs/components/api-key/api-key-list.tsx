"use client";

import { Check, Copy, Key, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_KEY_LABELS, API_KEY_SUCCESS } from "@/lib/constants";
import { useDeleteExpiredApiKeys, useApiKeys } from "@/lib/hooks/api/use-api-keys";
import { SearchInput } from "../organization/shared/search-input";
import { ApiKeyActions } from "./api-key-actions";
import { ApiKeyDetails } from "./api-key-details";
import { ApiKeyForm } from "./api-key-form";
import { ApiKeyVerify } from "./api-key-verify";

interface ApiKey {
  id: string;
  name?: string | null;
  prefix?: string | null;
  enabled?: boolean;
  expiresAt?: Date | number | null;
  createdAt: Date | number;
}

export function ApiKeyList() {
  const { data: apiKeys = [], isLoading } = useApiKeys();
  const deleteExpiredMutation = useDeleteExpiredApiKeys();
  const [searchValue, setSearchValue] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [viewingApiKeyId, setViewingApiKeyId] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [showDeleteExpiredDialog, setShowDeleteExpiredDialog] = useState(false);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleApiKeyCreated = (createdKey?: string) => {
    setShowCreateForm(false);
    if (createdKey) {
      setNewlyCreatedKey(createdKey);
    }
  };

  const handleApiKeyUpdated = () => {
    setEditingApiKey(null);
  };

  const handleApiKeyDeleted = () => {
    // Handled by mutation hook
  };

  const handleActionSuccess = () => {
    // Handled by mutation hooks
  };

  const handleDeleteExpired = async () => {
    try {
      await deleteExpiredMutation.mutateAsync();
      setShowDeleteExpiredDialog(false);
    } catch (err) {
      // Error is handled by the mutation hook
      console.error("Failed to delete expired keys:", err);
    }
  };

  const handleCopyKey = async () => {
    if (newlyCreatedKey) {
      try {
        await navigator.clipboard.writeText(newlyCreatedKey);
        setKeyCopied(true);
        setTimeout(() => setKeyCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy key:", err);
      }
    }
  };

  const filteredApiKeys = apiKeys.filter(
    (key) =>
      key.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      key.prefix?.toLowerCase().includes(searchValue.toLowerCase())
  );

  const formatDate = (timestamp: number | Date) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (expiresAt: Date | number | null | undefined) => {
    if (!expiresAt) return false;
    const expiryDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    return expiryDate < new Date();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="w-8 h-8 text-gray-900 dark:text-white" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {API_KEY_LABELS.TITLE}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowVerifyModal(true)}>
            {API_KEY_LABELS.VERIFY_API_KEY}
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-5 h-5" />
            {API_KEY_LABELS.CREATE_API_KEY}
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <div className="mb-6">
          <ApiKeyForm onSuccess={handleApiKeyCreated} onCancel={() => setShowCreateForm(false)} />
        </div>
      )}

      {editingApiKey && (
        <div className="mb-6">
          <ApiKeyForm
            apiKey={editingApiKey}
            onSuccess={handleApiKeyUpdated}
            onCancel={() => setEditingApiKey(null)}
          />
        </div>
      )}

      {viewingApiKeyId && (
        <ApiKeyDetails apiKeyId={viewingApiKeyId} onClose={() => setViewingApiKeyId(null)} />
      )}

      {showVerifyModal && <ApiKeyVerify onClose={() => setShowVerifyModal(false)} />}

      <Dialog open={!!newlyCreatedKey} onOpenChange={(open) => !open && setNewlyCreatedKey(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{API_KEY_SUCCESS.API_KEY_CREATED}</DialogTitle>
            <DialogDescription>{API_KEY_LABELS.KEY_WARNING}</DialogDescription>
          </DialogHeader>
          <div className="mb-4">
            <Label htmlFor="newly-created-api-key">{API_KEY_LABELS.YOUR_API_KEY}</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="newly-created-api-key"
                type="text"
                value={newlyCreatedKey || ""}
                readOnly
                className="flex-1 font-mono"
              />
              <Button type="button" onClick={handleCopyKey}>
                {keyCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    {API_KEY_LABELS.KEY_COPIED}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {API_KEY_LABELS.COPY_KEY}
                  </>
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setNewlyCreatedKey(null)}>
              {API_KEY_LABELS.CANCEL}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <SearchInput
            placeholder={API_KEY_LABELS.SEARCH_API_KEYS}
            value={searchValue}
            onChange={handleSearch}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowDeleteExpiredDialog(true)}
          className="text-destructive"
        >
          <Trash2 className="w-4 h-4" />
          {API_KEY_LABELS.DELETE_ALL_EXPIRED}
        </Button>
      </div>

      <AlertDialog open={showDeleteExpiredDialog} onOpenChange={setShowDeleteExpiredDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{API_KEY_LABELS.DELETE_ALL_EXPIRED}</AlertDialogTitle>
            <AlertDialogDescription>{API_KEY_LABELS.CONFIRM_DELETE_EXPIRED}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteExpiredMutation.isPending}>
              {API_KEY_LABELS.CANCEL}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExpired}
              disabled={deleteExpiredMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteExpiredMutation.isPending ? (
                <>
                  <Trash2 className="w-4 h-4 mr-2 animate-spin" />
                  {API_KEY_LABELS.DELETING}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {API_KEY_LABELS.DELETE_ALL_EXPIRED}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton loaders are static and won't reorder
                  <div key={`skeleton-${i}`} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredApiKeys.length === 0 ? (
            <Empty>
              <EmptyDescription>{API_KEY_LABELS.NO_API_KEYS}</EmptyDescription>
            </Empty>
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{API_KEY_LABELS.NAME}</TableHead>
                    <TableHead>{API_KEY_LABELS.PREFIX}</TableHead>
                    <TableHead>{API_KEY_LABELS.STATUS}</TableHead>
                    <TableHead>{API_KEY_LABELS.EXPIRES_AT}</TableHead>
                    <TableHead>{API_KEY_LABELS.CREATED_AT}</TableHead>
                    <TableHead>{API_KEY_LABELS.ACTIONS}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApiKeys.map((key) => {
                    const expired = isExpired(key.expiresAt);
                    return (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name || "Unnamed"}</TableCell>
                        <TableCell className="font-mono">{key.prefix || "N/A"}</TableCell>
                        <TableCell>
                          {expired ? (
                            <Badge variant="destructive">{API_KEY_LABELS.EXPIRED}</Badge>
                          ) : key.enabled ? (
                            <Badge variant="default">{API_KEY_LABELS.ENABLED}</Badge>
                          ) : (
                            <Badge variant="secondary">{API_KEY_LABELS.DISABLED}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {key.expiresAt
                            ? formatDate(
                                key.expiresAt instanceof Date
                                  ? key.expiresAt.getTime()
                                  : typeof key.expiresAt === "number"
                                    ? key.expiresAt
                                    : new Date(key.expiresAt).getTime()
                              )
                            : "Never"}
                        </TableCell>
                        <TableCell>{formatDate(key.createdAt)}</TableCell>
                        <TableCell>
                          <ApiKeyActions
                            apiKey={key}
                            onEdit={() => setEditingApiKey(key)}
                            onDelete={handleApiKeyDeleted}
                            onViewDetails={() => setViewingApiKeyId(key.id)}
                            onActionSuccess={handleActionSuccess}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
