import type { Density, ThemeConfig } from "@/config/schema";

/**
 * Turns a ThemeConfig into CSS custom properties.
 *
 * Tailwind's theme (see globals.css) maps its color and font tokens onto these
 * variables with `@theme inline`, so `bg-surface` or `text-primary` resolve to
 * whatever the config currently says. That is what lets the admin center
 * restyle the entire site without a rebuild: it only has to change nine
 * strings, and every utility class follows.
 */

const DENSITY_SCALE: Record<Density, number> = {
  compact: 0.78,
  normal: 1,
  spacious: 1.28,
};

/**
 * Final guard before a config value is interpolated into a stylesheet.
 * normalizeConfig() already validates colors against a character allowlist;
 * this repeats the essential part at the point of use, so a theme object that
 * reached us some other way still cannot terminate its own declaration and
 * append new CSS rules.
 */
const cssValue = (value: string): string =>
  value.replace(/[;{}<>\\]/g, "").slice(0, 72);

const fontStack = (family: string, fallback: string): string => {
  const clean = family.replace(/[^a-z0-9 _-]/gi, "").slice(0, 40);
  return clean ? `"${clean}", ${fallback}` : fallback;
};

export function themeVars(theme: ThemeConfig): Record<string, string> {
  const t = theme.tokens;
  const scale = DENSITY_SCALE[theme.density] ?? 1;
  const radius = Math.round(theme.radius);

  return {
    "--x-bg": cssValue(t.bg),
    "--x-surface": cssValue(t.surface),
    "--x-surface-2": cssValue(t.surface2),
    "--x-fg": cssValue(t.fg),
    "--x-muted": cssValue(t.muted),
    "--x-line": cssValue(t.line),
    "--x-primary": cssValue(t.primary),
    "--x-secondary": cssValue(t.secondary),
    "--x-accent": cssValue(t.accent),

    "--x-font-heading": fontStack(
      theme.fonts.heading,
      "system-ui, -apple-system, Segoe UI, sans-serif",
    ),
    "--x-font-body": fontStack(
      theme.fonts.body,
      "system-ui, -apple-system, Segoe UI, sans-serif",
    ),
    "--x-font-mono": fontStack(
      theme.fonts.mono,
      "ui-monospace, SFMono-Regular, Menlo, monospace",
    ),

    "--x-radius": `${radius}px`,
    "--x-radius-sm": `${Math.max(2, Math.round(radius * 0.5))}px`,
    "--x-radius-lg": `${Math.round(radius * 1.6)}px`,

    "--x-density": String(scale),
    "--x-section-y": `${(scale * 7).toFixed(2)}rem`,
    "--x-gap": `${(scale * 1.5).toFixed(2)}rem`,

    "--x-grain": String(theme.grain),
    "--x-glow": String(theme.glow),
    "--x-angle": `${Math.round(theme.gradientAngle)}deg`,

    // Derived once here so components never recompute a gradient by hand.
    "--x-gradient": `linear-gradient(var(--x-angle), var(--x-primary), var(--x-secondary))`,
    "--x-gradient-soft": `linear-gradient(var(--x-angle), color-mix(in oklab, var(--x-primary) 22%, transparent), color-mix(in oklab, var(--x-secondary) 22%, transparent))`,
    "--x-ring": `color-mix(in oklab, var(--x-primary) 45%, transparent)`,
    "--x-glow-shadow": `0 0 ${Math.round(theme.glow * 48)}px color-mix(in oklab, var(--x-primary) ${Math.round(
      theme.glow * 55,
    )}%, transparent)`,
  };
}

/** Serialises the variables into a `:root { ... }` rule. */
export function themeStyleSheet(theme: ThemeConfig): string {
  const vars = themeVars(theme);
  const body = Object.entries(vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
  return `:root{${body};color-scheme:${theme.mode === "light" ? "light" : "dark"}}`;
}

/**
 * Builds the Google Fonts stylesheet URL for the three configured families.
 * Family names are validated in normalizeConfig and encoded again here.
 */
export function googleFontsHref(theme: ThemeConfig): string | null {
  const families = Array.from(
    new Set(
      [theme.fonts.heading, theme.fonts.body, theme.fonts.mono]
        .map((f) => f.trim())
        .filter((f) => /^[a-z0-9][a-z0-9 _-]{0,40}$/i.test(f)),
    ),
  );
  if (families.length === 0) return null;

  const query = families
    .map(
      (family) =>
        `family=${encodeURIComponent(family.replace(/ /g, "+")).replace(
          /%2B/g,
          "+",
        )}:wght@300;400;500;600;700;800`,
    )
    .join("&");

  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
