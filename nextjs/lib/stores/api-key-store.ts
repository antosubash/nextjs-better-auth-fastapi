"use client";

import { create } from "zustand";

interface ApiKey {
  id: string;
  name?: string | null;
  prefix?: string | null;
  enabled?: boolean;
  expiresAt?: Date | number | null;
  createdAt: Date | number;
}

interface ApiKeyFormState {
  permissions: Record<string, string[]>;
  remaining: string;
  refillAmount: string;
  refillInterval: string;
  rateLimitEnabled: boolean;
  rateLimitTimeWindow: string;
  rateLimitMax: string;
}

interface ApiKeyListState {
  searchValue: string;
  showCreateForm: boolean;
  editingApiKey: ApiKey | null;
  viewingApiKeyId: string | null;
  showVerifyModal: boolean;
  newlyCreatedKey: string | null;
  keyCopied: boolean;
  showDeleteExpiredDialog: boolean;
}

interface PermissionsEditorState {
  showJsonEditor: boolean;
  jsonValue: string;
  jsonError: string;
  expandedResources: Set<string>;
  searchQuery: string;
  showAddResourceDialog: boolean;
  showAddActionDialog: boolean;
  currentResourceForAction: string;
}

interface ApiKeyState {
  form: ApiKeyFormState;
  list: ApiKeyListState;
  permissionsEditor: PermissionsEditorState;
}

interface ApiKeyActions {
  // Form actions
  setFormPermissions: (permissions: Record<string, string[]>) => void;
  setFormRemaining: (remaining: string) => void;
  setFormRefillAmount: (amount: string) => void;
  setFormRefillInterval: (interval: string) => void;
  setFormRateLimitEnabled: (enabled: boolean) => void;
  setFormRateLimitTimeWindow: (window: string) => void;
  setFormRateLimitMax: (max: string) => void;
  resetForm: () => void;
  initializeForm: (data: Partial<ApiKeyFormState>) => void;

  // List actions
  setSearchValue: (value: string) => void;
  setShowCreateForm: (show: boolean) => void;
  setEditingApiKey: (key: ApiKey | null) => void;
  setViewingApiKeyId: (id: string | null) => void;
  setShowVerifyModal: (show: boolean) => void;
  setNewlyCreatedKey: (key: string | null) => void;
  setKeyCopied: (copied: boolean) => void;
  setShowDeleteExpiredDialog: (show: boolean) => void;
  resetList: () => void;

  // Permissions editor actions
  setShowJsonEditor: (show: boolean) => void;
  setJsonValue: (value: string) => void;
  setJsonError: (error: string) => void;
  toggleExpandedResource: (resource: string) => void;
  setSearchQuery: (query: string) => void;
  setShowAddResourceDialog: (show: boolean) => void;
  setShowAddActionDialog: (show: boolean) => void;
  setCurrentResourceForAction: (resource: string) => void;
  resetPermissionsEditor: () => void;
}

type ApiKeyStore = ApiKeyState & ApiKeyActions;

const initialFormState: ApiKeyFormState = {
  permissions: {},
  remaining: "",
  refillAmount: "",
  refillInterval: "",
  rateLimitEnabled: false,
  rateLimitTimeWindow: "",
  rateLimitMax: "",
};

const initialListState: ApiKeyListState = {
  searchValue: "",
  showCreateForm: false,
  editingApiKey: null,
  viewingApiKeyId: null,
  showVerifyModal: false,
  newlyCreatedKey: null,
  keyCopied: false,
  showDeleteExpiredDialog: false,
};

const initialPermissionsEditorState: PermissionsEditorState = {
  showJsonEditor: false,
  jsonValue: "",
  jsonError: "",
  expandedResources: new Set(),
  searchQuery: "",
  showAddResourceDialog: false,
  showAddActionDialog: false,
  currentResourceForAction: "",
};

export const useApiKeyStore = create<ApiKeyStore>((set) => ({
  // State
  form: initialFormState,
  list: initialListState,
  permissionsEditor: initialPermissionsEditorState,

  // Form actions
  setFormPermissions: (permissions) => set((state) => ({ form: { ...state.form, permissions } })),
  setFormRemaining: (remaining) => set((state) => ({ form: { ...state.form, remaining } })),
  setFormRefillAmount: (refillAmount) =>
    set((state) => ({ form: { ...state.form, refillAmount } })),
  setFormRefillInterval: (refillInterval) =>
    set((state) => ({ form: { ...state.form, refillInterval } })),
  setFormRateLimitEnabled: (rateLimitEnabled) =>
    set((state) => ({ form: { ...state.form, rateLimitEnabled } })),
  setFormRateLimitTimeWindow: (rateLimitTimeWindow) =>
    set((state) => ({ form: { ...state.form, rateLimitTimeWindow } })),
  setFormRateLimitMax: (rateLimitMax) =>
    set((state) => ({ form: { ...state.form, rateLimitMax } })),
  resetForm: () => set({ form: initialFormState }),
  initializeForm: (data) => set((state) => ({ form: { ...state.form, ...data } })),

  // List actions
  setSearchValue: (searchValue) => set((state) => ({ list: { ...state.list, searchValue } })),
  setShowCreateForm: (showCreateForm) =>
    set((state) => ({ list: { ...state.list, showCreateForm } })),
  setEditingApiKey: (editingApiKey) => set((state) => ({ list: { ...state.list, editingApiKey } })),
  setViewingApiKeyId: (viewingApiKeyId) =>
    set((state) => ({ list: { ...state.list, viewingApiKeyId } })),
  setShowVerifyModal: (showVerifyModal) =>
    set((state) => ({ list: { ...state.list, showVerifyModal } })),
  setNewlyCreatedKey: (newlyCreatedKey) =>
    set((state) => ({ list: { ...state.list, newlyCreatedKey } })),
  setKeyCopied: (keyCopied) => set((state) => ({ list: { ...state.list, keyCopied } })),
  setShowDeleteExpiredDialog: (showDeleteExpiredDialog) =>
    set((state) => ({ list: { ...state.list, showDeleteExpiredDialog } })),
  resetList: () => set({ list: initialListState }),

  // Permissions editor actions
  setShowJsonEditor: (showJsonEditor) =>
    set((state) => ({ permissionsEditor: { ...state.permissionsEditor, showJsonEditor } })),
  setJsonValue: (jsonValue) =>
    set((state) => ({ permissionsEditor: { ...state.permissionsEditor, jsonValue } })),
  setJsonError: (jsonError) =>
    set((state) => ({ permissionsEditor: { ...state.permissionsEditor, jsonError } })),
  toggleExpandedResource: (resource) =>
    set((state) => {
      const newExpanded = new Set(state.permissionsEditor.expandedResources);
      if (newExpanded.has(resource)) {
        newExpanded.delete(resource);
      } else {
        newExpanded.add(resource);
      }
      return {
        permissionsEditor: { ...state.permissionsEditor, expandedResources: newExpanded },
      };
    }),
  setSearchQuery: (searchQuery) =>
    set((state) => ({ permissionsEditor: { ...state.permissionsEditor, searchQuery } })),
  setShowAddResourceDialog: (showAddResourceDialog) =>
    set((state) => ({
      permissionsEditor: { ...state.permissionsEditor, showAddResourceDialog },
    })),
  setShowAddActionDialog: (showAddActionDialog) =>
    set((state) => ({
      permissionsEditor: { ...state.permissionsEditor, showAddActionDialog },
    })),
  setCurrentResourceForAction: (currentResourceForAction) =>
    set((state) => ({
      permissionsEditor: { ...state.permissionsEditor, currentResourceForAction },
    })),
  resetPermissionsEditor: () => set({ permissionsEditor: initialPermissionsEditorState }),
}));
