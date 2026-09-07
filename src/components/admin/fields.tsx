"use client";

import { ChevronDown, ChevronUp, Plus, Trash, TriangleAlert } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { getAtPath, moveItem, setAtPath } from "@/lib/paths";
import { useAdminStore } from "@/lib/store";
import { safeUrl } from "@/lib/url";
import { resolveCssColor } from "@/lib/color";

/**
 * Form primitives for the admin center.
 *
 * Every input addresses its slice of the config by dotted path and shares one
 * setter, so a few hundred editable fields do not need a few hundred actions.
 * Each control subscribes to just its own value, which means typing in one box
 * re-renders that box and the preview, not the whole editor.
 *
 * The admin chrome deliberately uses fixed neutral colours rather than the
 * portfolio's theme tokens: changing the site's palette must not restyle the
 * tool you are changing it with.
 */

/* ------------------------------------------------------------------- hooks */

function useField<T>(path: string): [T, (value: T) => void] {
  const value = useAdminStore((s) => getAtPath(s.config, path) as T);
  const set = useAdminStore((s) => s.set);
  return [value, (next: T) => set(path, next)];
}

/* ------------------------------------------------------------------ layout */

export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-sm font-semibold text-neutral-100">{title}</h2>
      {description ? (
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          {description}
        </p>
      ) : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Label({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-medium uppercase tracking-wider text-neutral-400"
      >
        {children}
      </label>
      {hint ? (
        <span className="text-[11px] text-neutral-600">{hint}</span>
      ) : null}
    </div>
  );
}

const inputClass =
  "w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-neutral-600";

/* ------------------------------------------------------------------ inputs */

export function TextField({
  path,
  label,
  placeholder,
  hint,
  mono,
}: {
  path: string;
  label: string;
  placeholder?: string;
  hint?: string;
  mono?: boolean;
}) {
  const id = useId();
  const [value, setValue] = useField<string>(path);

  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <input
        id={id}
        type="text"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        className={`${inputClass} ${mono ? "font-mono text-xs" : ""}`}
      />
    </div>
  );
}

/**
 * URL input that warns when the value will be dropped at render time.
 *
 * The site sanitises every config URL through an allowlist, so an unsupported
 * scheme silently hides its own link. Surfacing that here means you find out
 * while typing rather than wondering why a button vanished.
 */
export function UrlField({
  path,
  label,
  placeholder,
  hint,
}: {
  path: string;
  label: string;
  placeholder?: string;
  hint?: string;
}) {
  const id = useId();
  const [value, setValue] = useField<string>(path);
  const raw = value ?? "";
  const unsafe = raw.trim().length > 0 && safeUrl(raw) === null;

  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <input
        id={id}
        type="text"
        inputMode="url"
        value={raw}
        placeholder={placeholder ?? "https://"}
        onChange={(e) => setValue(e.target.value)}
        className={`${inputClass} ${
          unsafe ? "border-amber-700/70 focus:border-amber-600" : ""
        }`}
      />
      {unsafe ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-500">
          <TriangleAlert size={12} className="mt-px shrink-0" />
          Only http, https, mailto, tel and site-relative paths are allowed.
          This link will be hidden on the site.
        </p>
      ) : null}
    </div>
  );
}

export function TextAreaField({
  path,
  label,
  placeholder,
  rows = 4,
  hint,
}: {
  path: string;
  label: string;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  const id = useId();
  const [value, setValue] = useField<string>(path);

  return (
    <div>
      <Label htmlFor={id} hint={hint ?? "**bold**  *italic*  `code`  [text](url)"}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        className={`${inputClass} resize-y leading-relaxed`}
      />
    </div>
  );
}

export function ToggleField({
  path,
  label,
  hint,
}: {
  path: string;
  label: string;
  hint?: string;
}) {
  const id = useId();
  const [value, setValue] = useField<boolean>(path);
  const on = Boolean(value);

  return (
    <div className="flex items-start justify-between gap-4 rounded border border-neutral-800 bg-neutral-950 px-3 py-2.5">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm text-neutral-200">
          {label}
        </label>
        {hint ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">
            {hint}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setValue(!on)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
          on ? "bg-neutral-100" : "bg-neutral-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full transition-transform ${
            on ? "translate-x-4 bg-neutral-900" : "translate-x-0.5 bg-neutral-300"
          }`}
        />
      </button>
    </div>
  );
}

export type SelectOption = { value: string; label: string };

/**
 * Not generic over the option union on purpose. The value is written back by
 * dotted path, which is untyped either way, and a generic here makes TypeScript
 * infer the union from the first array element — so a list of differing
 * literals fails to typecheck for no benefit.
 */
export function SelectField({
  path,
  label,
  options,
  hint,
}: {
  path: string;
  label: string;
  options: readonly SelectOption[] | readonly string[];
  hint?: string;
}) {
  const id = useId();
  const [value, setValue] = useField<string>(path);

  const normalised: SelectOption[] = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );

  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        className={inputClass}
      >
        {normalised.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SliderField({
  path,
  label,
  min,
  max,
  step = 1,
  format,
}: {
  path: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
}) {
  const id = useId();
  const [value, setValue] = useField<number>(path);
  const current = typeof value === "number" ? value : min;

  return (
    <div>
      <Label htmlFor={id} hint={format ? format(current) : String(current)}>
        {label}
      </Label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => setValue(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 accent-neutral-100"
      />
    </div>
  );
}

/**
 * Colour input pairing a native swatch with a free-text field.
 *
 * The text field is the source of truth because config accepts any CSS colour
 * notation, while `input[type=color]` only speaks hex. The swatch shows the
 * resolved colour so exotic notations still preview correctly.
 */
export function ColorField({
  path,
  label,
}: {
  path: string;
  label: string;
}) {
  const id = useId();
  const [value, setValue] = useField<string>(path);
  const raw = value ?? "";

  const hex = (() => {
    const resolved = resolveCssColor(raw, 0x000000);
    return `#${resolved.toString(16).padStart(6, "0")}`;
  })();

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} colour picker`}
          value={hex}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded border border-neutral-800 bg-neutral-950 p-0.5"
        />
        <input
          id={id}
          type="text"
          value={raw}
          onChange={(e) => setValue(e.target.value)}
          className={`${inputClass} font-mono text-xs`}
        />
      </div>
    </div>
  );
}

/** Comma-separated editor for a string array. */
export function TagsField({
  path,
  label,
  placeholder,
  hint,
}: {
  path: string;
  label: string;
  placeholder?: string;
  hint?: string;
}) {
  const id = useId();
  const [value, setValue] = useField<string[]>(path);
  const list = Array.isArray(value) ? value : [];

  // Local text state, so a trailing comma does not vanish mid-typing.
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? list.join(", ");

  const commit = (next: string) => {
    setValue(
      next
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    );
  };

  return (
    <div>
      <Label htmlFor={id} hint={hint ?? "comma separated"}>
        {label}
      </Label>
      <input
        id={id}
        type="text"
        value={shown}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        onBlur={() => setText(null)}
        className={inputClass}
      />
    </div>
  );
}

/** One-per-line editor for a string array, for bullets and paragraphs. */
export function LinesField({
  path,
  label,
  rows = 4,
  hint,
}: {
  path: string;
  label: string;
  rows?: number;
  hint?: string;
}) {
  const id = useId();
  const [value, setValue] = useField<string[]>(path);
  const list = Array.isArray(value) ? value : [];

  const [text, setText] = useState<string | null>(null);
  const shown = text ?? list.join("\n");

  return (
    <div>
      <Label htmlFor={id} hint={hint ?? "one per line"}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={rows}
        value={shown}
        onChange={(e) => {
          setText(e.target.value);
          setValue(
            e.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          );
        }}
        onBlur={() => setText(null)}
        className={`${inputClass} resize-y leading-relaxed`}
      />
    </div>
  );
}

/* -------------------------------------------------------------- list editor */

/**
 * Generic array editor: add, remove and reorder.
 *
 * Reordering is buttons rather than drag-and-drop. It needs no library, works
 * from the keyboard, and is precise on a phone — dragging a list of 20 items
 * inside a scrolling panel is worse in every one of those respects.
 */
export function ListEditor<T extends { id: string }>({
  path,
  label,
  items,
  factory,
  renderItem,
  itemTitle,
  addLabel = "Add",
  emptyLabel = "Nothing here yet.",
}: {
  path: string;
  label: string;
  items: T[];
  factory: () => T;
  renderItem: (item: T, index: number) => ReactNode;
  itemTitle: (item: T, index: number) => string;
  addLabel?: string;
  emptyLabel?: string;
}) {
  const mutate = useAdminStore((s) => s.mutate);
  const set = useAdminStore((s) => s.set);
  const [openId, setOpenId] = useState<string | null>(null);

  const write = (next: T[]) => set(path, next);

  const add = () => {
    const item = factory();
    mutate((config) => {
      const current = (getAtPath(config, path) as T[]) ?? [];
      return setAtPath(config, path, [...current, item]);
    });
    setOpenId(item.id);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
          {label}
        </span>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-300 transition-colors hover:border-neutral-600 hover:text-neutral-100"
        >
          <Plus size={11} />
          {addLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded border border-dashed border-neutral-800 px-3 py-6 text-center text-xs text-neutral-600">
          {emptyLabel}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => {
            const open = openId === item.id;
            return (
              <li
                key={item.id}
                className="overflow-hidden rounded border border-neutral-800 bg-neutral-950"
              >
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : item.id)}
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-left"
                  >
                    <span className="font-mono text-[10px] text-neutral-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate text-xs text-neutral-200">
                      {itemTitle(item, index) || "Untitled"}
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => write(moveItem(items, index, index - 1))}
                    className="rounded p-1 text-neutral-500 transition-colors hover:text-neutral-200 disabled:opacity-25"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={index === items.length - 1}
                    onClick={() => write(moveItem(items, index, index + 1))}
                    className="rounded p-1 text-neutral-500 transition-colors hover:text-neutral-200 disabled:opacity-25"
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${itemTitle(item, index)}`}
                    onClick={() =>
                      write(items.filter((candidate) => candidate.id !== item.id))
                    }
                    className="rounded p-1 text-neutral-500 transition-colors hover:text-red-400"
                  >
                    <Trash size={13} />
                  </button>
                </div>

                {open ? (
                  <div className="space-y-3 border-t border-neutral-800 p-3">
                    {renderItem(item, index)}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
