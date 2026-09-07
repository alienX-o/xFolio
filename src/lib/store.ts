"use client";

import { create } from "zustand";

import { DEFAULT_CONFIG } from "@/config/defaults";
import type { PortfolioConfig } from "@/config/schema";
import { setAtPath } from "./paths";
import { localDraftStore } from "./storage";

/**
 * Admin editing state: the draft config, an undo stack, and autosave.
 *
 * `base` is what the committed file says; `config` is what the editor is
 * showing. Everything the admin UI does funnels through set()/mutate() so
 * history and autosave are handled in exactly one place.
 */

export type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

type AdminState = {
  base: PortfolioConfig;
  config: PortfolioConfig;
  hydrated: boolean;
  dirty: boolean;
  past: PortfolioConfig[];
  future: PortfolioConfig[];
  status: Status;

  init: (base: PortfolioConfig) => void;
  hydrate: () => Promise<void>;
  /** Sets one field by dotted path. Rapid edits to the same path coalesce. */
  set: (path: string, value: unknown) => void;
  /** Arbitrary transform, for add/remove/reorder. */
  mutate: (fn: (config: PortfolioConfig) => PortfolioConfig) => void;
  replaceAll: (config: PortfolioConfig) => void;
  undo: () => void;
  redo: () => void;
  revertToFile: () => void;
  factoryReset: () => void;
  setStatus: (status: Status) => void;
};

const HISTORY_LIMIT = 80;
/** Typing in a text field should undo as one edit, not one per keystroke. */
const COALESCE_MS = 600;

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastPath: string | null = null;
let lastAt = 0;

function queueAutosave(config: PortfolioConfig) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void localDraftStore.write(config);
  }, 400);
}

const isSame = (a: PortfolioConfig, b: PortfolioConfig) =>
  JSON.stringify(a) === JSON.stringify(b);

export const useAdminStore = create<AdminState>((set, get) => ({
  base: DEFAULT_CONFIG,
  config: DEFAULT_CONFIG,
  hydrated: false,
  dirty: false,
  past: [],
  future: [],
  status: { kind: "idle" },

  init: (base) => {
    // Called with the committed file on mount. Do not clobber a draft that
    // hydrate() already restored.
    if (get().hydrated) {
      set({ base });
      return;
    }
    set({ base, config: base });
  },

  hydrate: async () => {
    const base = get().base;
    const draft = await localDraftStore.read();
    if (draft) {
      set({
        config: draft,
        hydrated: true,
        dirty: !isSame(draft, base),
      });
    } else {
      set({ hydrated: true });
    }
  },

  set: (path, value) => {
    const state = get();
    const next = setAtPath(state.config, path, value);
    if (next === state.config) return;

    const now = Date.now();
    const coalesce = path === lastPath && now - lastAt < COALESCE_MS;
    lastPath = path;
    lastAt = now;

    const past = coalesce
      ? state.past
      : [...state.past, state.config].slice(-HISTORY_LIMIT);

    set({
      config: next,
      past,
      future: [],
      dirty: !isSame(next, state.base),
      status: { kind: "idle" },
    });
    queueAutosave(next);
  },

  mutate: (fn) => {
    const state = get();
    const next = fn(state.config);
    if (next === state.config) return;

    lastPath = null;
    set({
      config: next,
      past: [...state.past, state.config].slice(-HISTORY_LIMIT),
      future: [],
      dirty: !isSame(next, state.base),
      status: { kind: "idle" },
    });
    queueAutosave(next);
  },

  replaceAll: (config) => {
    const state = get();
    lastPath = null;
    set({
      config,
      past: [...state.past, state.config].slice(-HISTORY_LIMIT),
      future: [],
      dirty: !isSame(config, state.base),
      status: { kind: "idle" },
    });
    queueAutosave(config);
  },

  undo: () => {
    const state = get();
    const previous = state.past[state.past.length - 1];
    if (!previous) return;
    lastPath = null;
    set({
      config: previous,
      past: state.past.slice(0, -1),
      future: [state.config, ...state.future].slice(0, HISTORY_LIMIT),
      dirty: !isSame(previous, state.base),
    });
    queueAutosave(previous);
  },

  redo: () => {
    const state = get();
    const next = state.future[0];
    if (!next) return;
    lastPath = null;
    set({
      config: next,
      past: [...state.past, state.config].slice(-HISTORY_LIMIT),
      future: state.future.slice(1),
      dirty: !isSame(next, state.base),
    });
    queueAutosave(next);
  },

  revertToFile: () => {
    const state = get();
    lastPath = null;
    set({
      config: state.base,
      past: [...state.past, state.config].slice(-HISTORY_LIMIT),
      future: [],
      dirty: false,
      status: { kind: "ok", message: "Reverted to the committed file." },
    });
    void localDraftStore.clear();
  },

  factoryReset: () => {
    const state = get();
    lastPath = null;
    set({
      config: DEFAULT_CONFIG,
      past: [...state.past, state.config].slice(-HISTORY_LIMIT),
      future: [],
      dirty: !isSame(DEFAULT_CONFIG, state.base),
      status: { kind: "ok", message: "Reset to the blank template." },
    });
    queueAutosave(DEFAULT_CONFIG);
  },

  setStatus: (status) => set({ status }),
}));

/**
 * Selector helpers. Each returns a stable reference, so components subscribe
 * to the narrowest slice they need — a selector that built a fresh object
 * would re-render on every store write under zustand v5.
 */
export const useDraft = () => useAdminStore((s) => s.config);
export const useSetField = () => useAdminStore((s) => s.set);
export const useMutate = () => useAdminStore((s) => s.mutate);
