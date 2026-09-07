"use client";

import { useEffect, useState } from "react";

/**
 * Bridges CSS theme colors into three.js.
 *
 * The 3D scenes need numeric sRGB values, but the theme lives in CSS custom
 * properties that may hold any notation the browser understands. Rather than
 * reimplement color parsing, we hand the string to a canvas 2D context and
 * read back what it normalised to. That keeps the WebGL scenes exactly in
 * sync with the CSS, including notations we never anticipated.
 */

let probe: CanvasRenderingContext2D | null | undefined;

function getProbe(): CanvasRenderingContext2D | null {
  if (probe !== undefined) return probe;
  try {
    probe = document.createElement("canvas").getContext("2d");
  } catch {
    probe = null;
  }
  return probe;
}

/** Parses any CSS color string to a 0xRRGGBB number. */
export function resolveCssColor(value: string, fallback = 0x808080): number {
  const input = value.trim();
  if (!input) return fallback;

  const ctx = getProbe();
  if (!ctx) return fallback;

  // An unparseable assignment is ignored by the canvas, so seed with a
  // sentinel and treat "unchanged" as failure.
  const sentinel = "#010203";
  ctx.fillStyle = sentinel;
  try {
    ctx.fillStyle = input;
  } catch {
    return fallback;
  }
  const normalised = String(ctx.fillStyle);
  if (normalised === sentinel && input.toLowerCase() !== sentinel) {
    return fallback;
  }

  const hex = /^#([0-9a-f]{6})$/i.exec(normalised);
  if (hex?.[1]) return parseInt(hex[1], 16);

  const short = /^#([0-9a-f]{3})$/i.exec(normalised);
  if (short?.[1]) {
    const [r, g, b] = short[1].split("");
    return parseInt(`${r}${r}${g}${g}${b}${b}`, 16);
  }

  const rgb = /^rgba?\(([^)]+)\)$/i.exec(normalised);
  if (rgb?.[1]) {
    const parts = rgb[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    const [r = 0, g = 0, b = 0] = parts;
    return ((r & 255) << 16) | ((g & 255) << 8) | (b & 255);
  }

  // color(srgb 0.1 0.2 0.3) — emitted for wide-gamut inputs.
  const srgb = /^color\(srgb\s+([^)]+)\)$/i.exec(normalised);
  if (srgb?.[1]) {
    const parts = srgb[1]
      .split(/[\s/]+/)
      .filter(Boolean)
      .map(Number);
    const [r = 0, g = 0, b = 0] = parts;
    const to255 = (n: number) =>
      Math.max(0, Math.min(255, Math.round(n * 255)));
    return (to255(r) << 16) | (to255(g) << 8) | to255(b);
  }

  return fallback;
}

const VAR_NAMES = {
  primary: "--x-primary",
  secondary: "--x-secondary",
  accent: "--x-accent",
  bg: "--x-bg",
  fg: "--x-fg",
} as const;

export type ThemeColorSet = Record<keyof typeof VAR_NAMES, number>;

const FALLBACKS: ThemeColorSet = {
  primary: 0x3b82f6,
  secondary: 0xa855f7,
  accent: 0x22d3ee,
  bg: 0x050507,
  fg: 0xf4f4f5,
};

/**
 * Reads the live theme variables off :root. `signature` should change whenever
 * the theme does (pass the serialised tokens) so the scenes re-read colors
 * immediately when someone drags a color picker in the admin center.
 */
export function useThemeColors(signature: string): ThemeColorSet {
  const [colors, setColors] = useState<ThemeColorSet>(FALLBACKS);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const next = {} as ThemeColorSet;
    for (const [key, varName] of Object.entries(VAR_NAMES)) {
      const typed = key as keyof typeof VAR_NAMES;
      next[typed] = resolveCssColor(
        styles.getPropertyValue(varName),
        FALLBACKS[typed],
      );
    }
    setColors((prev) => {
      const same = (Object.keys(next) as (keyof ThemeColorSet)[]).every(
        (k) => prev[k] === next[k],
      );
      return same ? prev : next;
    });
  }, [signature]);

  return colors;
}
