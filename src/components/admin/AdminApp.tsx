"use client";

import {
  Braces,
  Eye,
  FolderOpen,
  GraduationCap,
  Layers,
  Mail,
  Palette,
  Save,
  SlidersHorizontal,
  Sparkles,
  User,
  Redo2,
  Undo2,
  Wand,
  Briefcase,
} from "lucide-react";
import { useCallback, useEffect, useState, type ComponentType } from "react";

import type { PortfolioConfig } from "@/config/schema";
import { useAdminStore } from "@/lib/store";
import { downloadConfig, localDraftStore } from "@/lib/storage";

import { JsonPanel } from "./JsonPanel";
import { Preview } from "./Preview";
import {
  AboutPanel,
  ContactPanel,
  EducationPanel,
  EffectsPanel,
  ExperiencePanel,
  IdentityPanel,
  LayoutPanel,
  ProjectsPanel,
  SeoPanel,
  SkillsPanel,
  ThemePanel,
} from "./panels";

/**
 * The admin center.
 *
 * Left: a tab per area of the config. Middle: the form for that area. Right:
 * a live preview of the real site. Everything edits one draft object held in
 * the store, autosaved to localStorage, so a reload or a crash never loses
 * work — and nothing reaches the published site until you save or export.
 */

type Tab = {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  panel: ComponentType;
};

const TABS: Tab[] = [
  { id: "identity", label: "Identity", icon: User, panel: IdentityPanel },
  { id: "theme", label: "Theme", icon: Palette, panel: ThemePanel },
  { id: "effects", label: "Effects", icon: Sparkles, panel: EffectsPanel },
  { id: "layout", label: "Layout", icon: Layers, panel: LayoutPanel },
  { id: "about", label: "About", icon: Wand, panel: AboutPanel },
  {
    id: "experience",
    label: "Experience",
    icon: Briefcase,
    panel: ExperiencePanel,
  },
  {
    id: "skills",
    label: "Skills",
    icon: SlidersHorizontal,
    panel: SkillsPanel,
  },
  { id: "projects", label: "Projects", icon: FolderOpen, panel: ProjectsPanel },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    panel: EducationPanel,
  },
  { id: "contact", label: "Contact", icon: Mail, panel: ContactPanel },
  { id: "seo", label: "Metadata", icon: Eye, panel: SeoPanel },
  { id: "json", label: "JSON", icon: Braces, panel: JsonPanel },
];

export function AdminApp({ base }: { base: PortfolioConfig }) {
  const [tabId, setTabId] = useState(TABS[0]!.id);
  const [showPreview, setShowPreview] = useState(true);

  const init = useAdminStore((s) => s.init);
  const hydrate = useAdminStore((s) => s.hydrate);
  const hydrated = useAdminStore((s) => s.hydrated);
  const dirty = useAdminStore((s) => s.dirty);
  const status = useAdminStore((s) => s.status);
  const setStatus = useAdminStore((s) => s.setStatus);
  const config = useAdminStore((s) => s.config);
  const undo = useAdminStore((s) => s.undo);
  const redo = useAdminStore((s) => s.redo);
  const canUndo = useAdminStore((s) => s.past.length > 0);
  const canRedo = useAdminStore((s) => s.future.length > 0);
  const revertToFile = useAdminStore((s) => s.revertToFile);

  // Seed the store with the committed file, then restore any local draft.
  useEffect(() => {
    init(base);
    void hydrate();
  }, [base, init, hydrate]);

  // Warn before losing unsaved work on a reload or tab close.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const save = useCallback(async () => {
    setStatus({ kind: "saving" });
    const result = await localDraftStore.publish(config);
    if (result.ok) {
      setStatus({ kind: "ok", message: `Wrote ${result.path}` });
      // The file on disk now matches the draft, so drop the local copy and
      // treat this as the new baseline.
      await localDraftStore.clear();
      init(config);
      useAdminStore.setState({ base: config, dirty: false });
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }, [config, init, setStatus]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        redo();
      } else if (key === "s") {
        event.preventDefault();
        if (localDraftStore.canPublish) void save();
        else downloadConfig(config);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // `save` closes over the draft, so the listener rebinds as it changes.
  }, [undo, redo, config, save]);

  const ActivePanel = (TABS.find((t) => t.id === tabId) ?? TABS[0]!).panel;

  const iconButton =
    "rounded border border-neutral-800 p-1.5 text-neutral-400 transition-colors hover:border-neutral-600 hover:text-neutral-100 disabled:opacity-25 disabled:hover:border-neutral-800";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-900 text-neutral-200">
      {/* ------------------------------------------------------------ top */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-neutral-100">
            xFolio admin
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
              dirty
                ? "bg-amber-500/15 text-amber-400"
                : "bg-neutral-800 text-neutral-500"
            }`}
          >
            {hydrated ? (dirty ? "unsaved" : "saved") : "loading"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status.kind === "ok" ? (
            <span className="text-[11px] text-emerald-400">
              {status.message}
            </span>
          ) : null}
          {status.kind === "error" ? (
            <span className="max-w-sm text-[11px] text-red-400">
              {status.message}
            </span>
          ) : null}
          {status.kind === "saving" ? (
            <span className="text-[11px] text-neutral-500">Saving…</span>
          ) : null}

          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={iconButton}
          >
            <Undo2 size={13} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className={iconButton}
          >
            <Redo2 size={13} />
          </button>

          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            aria-pressed={showPreview}
            className="rounded border border-neutral-800 px-2.5 py-1.5 text-xs text-neutral-300 transition-colors hover:border-neutral-600 hover:text-neutral-100"
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>

          <button
            type="button"
            onClick={revertToFile}
            disabled={!dirty}
            title="Discard the draft and go back to the committed file"
            className="rounded border border-neutral-800 px-2.5 py-1.5 text-xs text-neutral-300 transition-colors hover:border-neutral-600 hover:text-neutral-100 disabled:opacity-30"
          >
            Revert
          </button>

          {localDraftStore.canPublish ? (
            <button
              type="button"
              onClick={() => void save()}
              disabled={!dirty || status.kind === "saving"}
              title="Write data/portfolio.config.json (Ctrl+S)"
              className="inline-flex items-center gap-1.5 rounded bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 transition-opacity hover:opacity-85 disabled:opacity-30"
            >
              <Save size={12} />
              Save to file
            </button>
          ) : (
            <button
              type="button"
              onClick={() => downloadConfig(config)}
              title="Download the config to commit (Ctrl+S)"
              className="inline-flex items-center gap-1.5 rounded bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 transition-opacity hover:opacity-85"
            >
              <Save size={12} />
              Export JSON
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* --------------------------------------------------------- tabs */}
        <nav
          aria-label="Config sections"
          className="w-14 shrink-0 overflow-y-auto border-r border-neutral-800 bg-neutral-950 py-2 lg:w-44"
        >
          <ul>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === tabId;
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => setTabId(tab.id)}
                    aria-current={active ? "page" : undefined}
                    title={tab.label}
                    className={`flex w-full items-center justify-center gap-2.5 px-3 py-2.5 text-xs transition-colors lg:justify-start ${
                      active
                        ? "bg-neutral-900 text-neutral-100"
                        : "text-neutral-500 hover:text-neutral-200"
                    }`}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span className="hidden lg:inline">{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* -------------------------------------------------------- editor */}
        <main className="min-w-0 flex-1 overflow-y-auto px-5 py-6">
          <div className="mx-auto max-w-xl">
            {hydrated ? (
              <ActivePanel />
            ) : (
              <p className="text-xs text-neutral-500">Loading config…</p>
            )}
          </div>
        </main>

        {/* ------------------------------------------------------- preview */}
        {showPreview ? (
          <aside className="hidden w-[46%] shrink-0 border-l border-neutral-800 xl:block">
            <Preview />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
