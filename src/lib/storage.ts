"use client";

import { DEFAULT_CONFIG } from "@/config/defaults";
import { normalizeConfig } from "@/config/normalize";
import type { PortfolioConfig } from "@/config/schema";

/**
 * Where admin edits live between page loads.
 *
 * This is deliberately an interface with one implementation. The committed
 * JSON file is the source of truth for what visitors see; a draft is just the
 * work-in-progress copy belonging to whoever is editing. Today that copy sits
 * in localStorage, which is why the production site needs no backend at all.
 *
 * To make drafts follow you across devices later, implement this same
 * interface against a hosted database (libSQL/Turso is the natural fit, since
 * it speaks SQLite over HTTP and needs no server of your own) and swap the
 * export at the bottom. Nothing else in the app reads storage directly.
 *
 * A note on trust: because drafts are per-browser and never leave the client,
 * /admin needs no authentication to be safe in production — there is nothing
 * shared to protect. That stops being true the moment a real backend appears
 * here, and at that point the route needs genuine authn/authz.
 */

export type PublishResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

export interface DraftStore {
  readonly id: string;
  /** True when edits can be written back to the real config file. */
  readonly canPublish: boolean;
  read(): Promise<PortfolioConfig | null>;
  write(config: PortfolioConfig): Promise<void>;
  clear(): Promise<void>;
  publish(config: PortfolioConfig): Promise<PublishResult>;
}

const DRAFT_KEY = "xfolio:draft:v2";
/** Keys from older schema versions, cleared on read so they cannot resurface. */
const LEGACY_KEYS = ["xfolio:draft:v1", "xfolio:config"];

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Private windows and "block site data" both throw on access.
    return null;
  }
}

export const localDraftStore: DraftStore = {
  id: "localStorage",

  // The dev-only save route is what actually rewrites the file. In a
  // production build it returns 404, so publishing degrades to Export.
  canPublish: process.env.NODE_ENV === "development",

  async read() {
    if (typeof window === "undefined") return null;
    for (const key of LEGACY_KEYS) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    const raw = readStorage(DRAFT_KEY);
    if (!raw) return null;
    try {
      // Drafts are still run through normalizeConfig: an older build may have
      // written a shape this one no longer understands.
      return normalizeConfig(JSON.parse(raw), DEFAULT_CONFIG);
    } catch {
      return null;
    }
  },

  async write(config) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(config));
    } catch {
      // Quota exceeded or storage blocked. The in-memory config is unaffected,
      // so editing keeps working for this session.
    }
  },

  async clear() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  },

  async publish(config) {
    if (!this.canPublish) {
      return {
        ok: false,
        error:
          "Writing to disk only works while running `npm run dev`. Use Export to download the file instead.",
      };
    }
    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: unknown }).error)
            : `Save failed (${res.status})`;
        return { ok: false, error: message };
      }
      const path =
        typeof data === "object" && data !== null && "path" in data
          ? String((data as { path: unknown }).path)
          : "data/portfolio.config.json";
      return { ok: true, path };
    } catch {
      return { ok: false, error: "Could not reach the dev server." };
    }
  },
};

/* --------------------------------------------------------- file transfers */

export function downloadConfig(
  config: PortfolioConfig,
  filename = "portfolio.config.json",
): void {
  const json = `${JSON.stringify(config, null, 2)}\n`;
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on the next tick so the download has started.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readConfigFile(file: File): Promise<PortfolioConfig> {
  if (file.size > 2_000_000) {
    throw new Error("That file is larger than 2 MB, which is not a config.");
  }
  const text = await file.text();
  const parsed: unknown = JSON.parse(text);
  return normalizeConfig(parsed, DEFAULT_CONFIG);
}
