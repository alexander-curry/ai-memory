"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Category, ChannelId, ChatMessage, Contact, Tint } from "./types";
import { USER } from "./data";

export interface CustomCollection {
  id: string;
  title: string;
  category: Category;
  tint: Tint;
  cover?: string;
  contactIds: string[];
  itemIds: string[];
  createdAt: number;
}

export type SyncFrequency = "1h" | "6h" | "12h" | "24h" | "manual";

export interface Prefs {
  syncFrequency: SyncFrequency;
  location: boolean;
  notifications: boolean;
}

export type Stage = "welcome" | "app";

interface AppState {
  stage: Stage;
  user: { name: string; email: string };
  connected: ChannelId[];
  mainMemory: ChannelId | null;
  pinnedCollections: Record<string, boolean>;
  pinnedContacts: Record<string, boolean>;
  deletedCollections: string[];
  deletedContacts: string[];
  renamed: Record<string, string>;
  customCollections: CustomCollection[];
  customContacts: Contact[];
  mutedContacts: string[];
  prefs: Prefs;
  lastSyncedAt: number;
  calendarAdded: string[];
  chat: ChatMessage[];
  bannerDismissed: boolean;
  newItemIds: string[];

  setStage: (s: Stage) => void;
  setUser: (u: Partial<{ name: string; email: string }>) => void;
  connect: (c: ChannelId) => void;
  disconnect: (c: ChannelId) => void;
  setConnected: (c: ChannelId[]) => void;
  setMainMemory: (c: ChannelId | null) => void;
  togglePinCollection: (id: string, current: boolean) => void;
  togglePinContact: (id: string, current: boolean) => void;
  deleteCollection: (id: string) => void;
  deleteContact: (id: string) => void;
  renameCollection: (id: string, title: string) => void;
  addCollection: (c: CustomCollection) => void;
  addContact: (c: Contact) => void;
  toggleMute: (id: string) => void;
  setPrefs: (p: Partial<Prefs>) => void;
  markSynced: () => void;
  addToCalendar: (id: string) => void;
  addChat: (m: ChatMessage) => void;
  clearChat: () => void;
  dismissBanner: () => void;
  setNewItems: (ids: string[]) => void;
  resetAll: () => void;
}

const initial = {
  stage: "welcome" as Stage,
  user: { ...USER },
  connected: [] as ChannelId[],
  mainMemory: null as ChannelId | null,
  pinnedCollections: {},
  pinnedContacts: {},
  deletedCollections: [],
  deletedContacts: [],
  renamed: {},
  customCollections: [],
  customContacts: [],
  mutedContacts: [],
  prefs: { syncFrequency: "6h" as SyncFrequency, location: true, notifications: true },
  lastSyncedAt: 0,
  calendarAdded: [],
  chat: [],
  bannerDismissed: false,
  newItemIds: [],
};

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      ...initial,
      setStage: (stage) => set({ stage }),
      setUser: (u) => set((s) => ({ user: { ...s.user, ...u } })),
      connect: (c) =>
        set((s) => ({
          connected: s.connected.includes(c) ? s.connected : [...s.connected, c],
          mainMemory: s.mainMemory ?? c,
        })),
      disconnect: (c) =>
        set((s) => {
          const connected = s.connected.filter((x) => x !== c);
          return {
            connected,
            mainMemory: s.mainMemory === c ? connected[0] ?? null : s.mainMemory,
          };
        }),
      setConnected: (connected) => set({ connected }),
      setMainMemory: (mainMemory) => set({ mainMemory }),
      togglePinCollection: (id, current) =>
        set((s) => ({ pinnedCollections: { ...s.pinnedCollections, [id]: !current } })),
      togglePinContact: (id, current) =>
        set((s) => ({ pinnedContacts: { ...s.pinnedContacts, [id]: !current } })),
      deleteCollection: (id) =>
        set((s) => ({
          deletedCollections: [...s.deletedCollections, id],
          customCollections: s.customCollections.filter((c) => c.id !== id),
        })),
      deleteContact: (id) =>
        set((s) => ({
          deletedContacts: [...s.deletedContacts, id],
          customContacts: s.customContacts.filter((c) => c.id !== id),
        })),
      renameCollection: (id, title) => set((s) => ({ renamed: { ...s.renamed, [id]: title } })),
      addCollection: (c) => set((s) => ({ customCollections: [c, ...s.customCollections] })),
      addContact: (c) => set((s) => ({ customContacts: [c, ...s.customContacts] })),
      toggleMute: (id) =>
        set((s) => ({
          mutedContacts: s.mutedContacts.includes(id)
            ? s.mutedContacts.filter((x) => x !== id)
            : [...s.mutedContacts, id],
        })),
      setPrefs: (p) => set((s) => ({ prefs: { ...s.prefs, ...p } })),
      markSynced: () => set({ lastSyncedAt: Date.now() }),
      addToCalendar: (id) =>
        set((s) => ({ calendarAdded: s.calendarAdded.includes(id) ? s.calendarAdded : [...s.calendarAdded, id] })),
      addChat: (m) => set((s) => ({ chat: [...s.chat, m].slice(-60) })),
      clearChat: () => set({ chat: [] }),
      dismissBanner: () => set({ bannerDismissed: true }),
      setNewItems: (newItemIds) => set({ newItemIds }),
      resetAll: () => set({ ...initial, user: { ...USER } }),
    }),
    {
      name: "aimemory-demo-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { newItemIds, ...rest } = s;
        return rest;
      },
    },
  ),
);

/* ---------------- Navigation ---------------- */

export type RouteName =
  | "welcome"
  | "ob-ai"
  | "ob-privacy"
  | "ob-connect"
  | "ob-main"
  | "ob-building"
  | "signin"
  | "home"
  | "contacts"
  | "settings"
  | "collections"
  | "collection"
  | "contact"
  | "search"
  | "thera";

export interface Route {
  name: RouteName;
  params?: Record<string, string>;
  key: number;
}

let keySeq = 1;

interface NavState {
  stack: Route[];
  direction: "push" | "pop" | "none";
  push: (name: RouteName, params?: Record<string, string>) => void;
  pop: () => void;
  reset: (name: RouteName, params?: Record<string, string>) => void;
  /** pops without touching browser history (used by popstate) */
  popFromHistory: () => void;
}

const syncHistoryPush = () => {
  if (typeof window !== "undefined") {
    window.history.pushState({ aimemory: true, t: Date.now() }, "");
  }
};

export const useNav = create<NavState>()((set, get) => ({
  stack: [{ name: "welcome", key: 0 }],
  direction: "none",
  push: (name, params) => {
    syncHistoryPush();
    set((s) => ({ stack: [...s.stack, { name, params, key: keySeq++ }], direction: "push" }));
  },
  pop: () => {
    if (get().stack.length <= 1) return;
    if (typeof window !== "undefined") {
      window.history.back();
    } else {
      get().popFromHistory();
    }
  },
  popFromHistory: () =>
    set((s) => (s.stack.length > 1 ? { stack: s.stack.slice(0, -1), direction: "pop" } : s)),
  reset: (name, params) => set({ stack: [{ name, params, key: keySeq++ }], direction: "none" }),
}));

/* ---------------- Toasts ---------------- */

export interface Toast {
  id: number;
  text: string;
  tone?: "default" | "success";
}

interface ToastState {
  toasts: Toast[];
  show: (text: string, tone?: Toast["tone"]) => void;
  remove: (id: number) => void;
}

let toastSeq = 1;

export const useToast = create<ToastState>()((set, get) => ({
  toasts: [],
  show: (text, tone = "default") => {
    const id = toastSeq++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, tone }] }));
    setTimeout(() => get().remove(id), 2600);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (text: string, tone?: Toast["tone"]) => useToast.getState().show(text, tone);
