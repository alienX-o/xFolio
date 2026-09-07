"use client";

import { Braces, Copy, Download, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { DEFAULT_CONFIG } from "@/config/defaults";
import { normalizeConfig } from "@/config/normalize";
import { useAdminStore } from "@/lib/store";
import { downloadConfig, readConfigFile } from "@/lib/storage";

import { Panel } from "./fields";

/**
 * Import, export and raw JSON editing.
 *
 * The raw editor is the escape hatch: anything the forms cannot express can be
 * typed here, and it is also how you audit exactly what will be committed.
 * Pasted JSON goes through normalizeConfig like every other input, so an
 * import from someone else's portfolio cannot introduce fields or values this
 * build does not understand.
 */
export function JsonPanel() {
  const config = useAdminStore((s) => s.config);
  const replaceAll = useAdminStore((s) => s.replaceAll);
  const factoryReset = useAdminStore((s) => s.factoryReset);
  const setStatus = useAdminStore((s) => s.setStatus);

  const fileInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const serialised = `${JSON.stringify(config, null, 2)}\n`;
  const shown = draft ?? serialised;
  const dirtyText = draft !== null && draft !== serialised;

  const applyText = () => {
    if (draft === null) return;
    try {
      const parsed: unknown = JSON.parse(draft);
      replaceAll(normalizeConfig(parsed, DEFAULT_CONFIG));
      setDraft(null);
      setError(null);
      setStatus({ kind: "ok", message: "Applied the pasted JSON." });
    } catch {
      setError("That is not valid JSON.");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(serialised);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("The browser blocked clipboard access.");
    }
  };

  const importFile = async (file: File) => {
    try {
      replaceAll(await readConfigFile(file));
      setDraft(null);
      setError(null);
      setStatus({ kind: "ok", message: `Imported ${file.name}.` });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not read that file.",
      );
    }
  };

  const buttonClass =
    "inline-flex items-center gap-1.5 rounded border border-neutral-800 px-2.5 py-1.5 text-xs text-neutral-300 transition-colors hover:border-neutral-600 hover:text-neutral-100";

  return (
    <>
      <Panel
        title="Transfer"
        description="Export writes the file you commit. Import replaces everything with the file you choose."
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadConfig(config)}
            className={buttonClass}
          >
            <Download size={12} />
            Export JSON
          </button>

          <button type="button" onClick={copy} className={buttonClass}>
            <Copy size={12} />
            {copied ? "Copied" : "Copy to clipboard"}
          </button>

          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className={buttonClass}
          >
            <Upload size={12} />
            Import file
          </button>

          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importFile(file);
              // Clear the value so re-picking the same file fires again.
              event.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => {
              const ok = window.confirm(
                "Reset every field to the blank template? Your current draft will be replaced. This does not touch the committed file until you save or export.",
              );
              if (ok) factoryReset();
            }}
            className="inline-flex items-center gap-1.5 rounded border border-red-900/60 px-2.5 py-1.5 text-xs text-red-400 transition-colors hover:border-red-700 hover:text-red-300"
          >
            <RotateCcw size={12} />
            Reset to template
          </button>
        </div>
      </Panel>

      <Panel
        title="Raw config"
        description="The whole site, as it will be written to data/portfolio.config.json."
      >
        {error ? (
          <p className="rounded border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <textarea
          value={shown}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          spellCheck={false}
          rows={22}
          className="w-full resize-y rounded border border-neutral-800 bg-neutral-950 p-3 font-mono text-[11px] leading-relaxed text-neutral-300 outline-none focus:border-neutral-600"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyText}
            disabled={!dirtyText}
            className="inline-flex items-center gap-1.5 rounded bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 transition-opacity hover:opacity-85 disabled:opacity-30"
          >
            <Braces size={12} />
            Apply JSON
          </button>
          {draft !== null ? (
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                setError(null);
              }}
              className={buttonClass}
            >
              Discard edits
            </button>
          ) : null}
          {dirtyText ? (
            <span className="text-[11px] text-amber-500">
              Unapplied changes in the text above.
            </span>
          ) : null}
        </div>
      </Panel>
    </>
  );
}
