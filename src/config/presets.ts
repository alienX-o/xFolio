import type { HeroScene, ThemeConfig, ThemeTokens } from "./schema";

/**
 * Theme presets, minimal first.
 *
 * The defaults are deliberately quiet: near-monochrome palettes, one accent
 * used sparingly, no gradient as a primary device, and grain and glow at zero.
 * The louder presets further down exist because the whole point of this build
 * is that the look is configurable — but they are opt-in, not the starting
 * point. Picking a preset copies its values into `theme`, after which every
 * field stays individually editable.
 */

export type ThemePreset = {
  id: string;
  name: string;
  blurb: string;
  mode: "dark" | "light";
  tokens: ThemeTokens;
  fonts: { heading: string; body: string; mono: string };
  radius: number;
  grain: number;
  glow: number;
  gradientAngle: number;
  scene: HeroScene;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "ink",
    name: "Ink",
    blurb: "Near-black, one cool accent. Type does the work.",
    mode: "dark",
    tokens: {
      bg: "#0a0a0a",
      surface: "#0f0f0f",
      surface2: "#161616",
      fg: "#ededed",
      muted: "#8a8a8a",
      line: "#232323",
      primary: "#e5e5e5",
      secondary: "#a1a1a1",
      accent: "#5b8cff",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
    radius: 6,
    grain: 0,
    glow: 0,
    gradientAngle: 90,
    scene: "dots",
  },
  {
    id: "paper",
    name: "Paper",
    blurb: "Off-white and near-black. Quiet, editorial, easy to read.",
    mode: "light",
    tokens: {
      bg: "#fbfbfa",
      surface: "#ffffff",
      surface2: "#f4f4f2",
      fg: "#131313",
      muted: "#6f6f6f",
      line: "#e4e4e1",
      primary: "#131313",
      secondary: "#525252",
      accent: "#2b5fd9",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
    radius: 6,
    grain: 0,
    glow: 0,
    gradientAngle: 90,
    scene: "dots",
  },
  {
    id: "slate",
    name: "Slate",
    blurb: "Cool grey with a muted blue. Reads as engineering.",
    mode: "dark",
    tokens: {
      bg: "#0b0d10",
      surface: "#111418",
      surface2: "#171b20",
      fg: "#e7eaee",
      muted: "#828b96",
      line: "#212730",
      primary: "#dfe4ea",
      secondary: "#94a1b2",
      accent: "#4d8bf0",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "IBM Plex Mono" },
    radius: 8,
    grain: 0,
    glow: 0,
    gradientAngle: 90,
    scene: "grid",
  },
  {
    id: "bone",
    name: "Bone",
    blurb: "Warm off-white, charcoal text, rust accent.",
    mode: "light",
    tokens: {
      bg: "#f7f5f1",
      surface: "#fffefb",
      surface2: "#eeebe4",
      fg: "#1b1917",
      muted: "#726c64",
      line: "#e0dbd1",
      primary: "#1b1917",
      secondary: "#57514a",
      accent: "#b4552d",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "IBM Plex Mono" },
    radius: 4,
    grain: 0,
    glow: 0,
    gradientAngle: 90,
    scene: "none",
  },
  {
    id: "mono",
    name: "Mono",
    blurb: "No hue at all, no radius. Brutally plain.",
    mode: "dark",
    tokens: {
      bg: "#000000",
      surface: "#0c0c0c",
      surface2: "#141414",
      fg: "#fafafa",
      muted: "#7d7d7d",
      line: "#242424",
      primary: "#fafafa",
      secondary: "#a3a3a3",
      accent: "#fafafa",
    },
    fonts: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
    radius: 0,
    grain: 0,
    glow: 0,
    gradientAngle: 90,
    scene: "none",
  },
  {
    id: "terminal",
    name: "Terminal",
    blurb: "Monospace everywhere, one green. Restrained but nerdy.",
    mode: "dark",
    tokens: {
      bg: "#050705",
      surface: "#0a0e0a",
      surface2: "#101610",
      fg: "#dfe7df",
      muted: "#7d8c7d",
      line: "#1c261c",
      primary: "#dfe7df",
      secondary: "#8fa38f",
      accent: "#4ade80",
    },
    fonts: {
      heading: "JetBrains Mono",
      body: "JetBrains Mono",
      mono: "JetBrains Mono",
    },
    radius: 2,
    grain: 0,
    glow: 0,
    gradientAngle: 90,
    scene: "grid",
  },

  /* ------- Louder options. Not the default; here if you want them. ------- */

  {
    id: "midnight",
    name: "Midnight",
    blurb: "Blue to violet gradient on black. The loud one.",
    mode: "dark",
    tokens: {
      bg: "#050507",
      surface: "#0d0d12",
      surface2: "#15151d",
      fg: "#f4f4f5",
      muted: "#8b8b98",
      line: "#23232e",
      primary: "#3b82f6",
      secondary: "#a855f7",
      accent: "#22d3ee",
    },
    fonts: { heading: "Sora", body: "Inter", mono: "JetBrains Mono" },
    radius: 16,
    grain: 0.04,
    glow: 0.5,
    gradientAngle: 110,
    scene: "particles",
  },
  {
    id: "neon",
    name: "Neon",
    blurb: "Magenta and cyan. Maximum cyberpunk, zero restraint.",
    mode: "dark",
    tokens: {
      bg: "#04030a",
      surface: "#0c0a18",
      surface2: "#141024",
      fg: "#f5f0ff",
      muted: "#8b82ab",
      line: "#241d3d",
      primary: "#e935c1",
      secondary: "#00e5ff",
      accent: "#a78bfa",
    },
    fonts: { heading: "Syne", body: "Outfit", mono: "JetBrains Mono" },
    radius: 8,
    grain: 0.09,
    glow: 0.85,
    gradientAngle: 120,
    scene: "tunnel",
  },
];

export const getPreset = (id: string): ThemePreset | undefined =>
  THEME_PRESETS.find((p) => p.id === id);

/** Applies a preset over a theme, keeping fields presets do not own. */
export function applyPreset(
  theme: ThemeConfig,
  preset: ThemePreset,
): ThemeConfig {
  return {
    ...theme,
    preset: preset.id,
    mode: preset.mode,
    tokens: { ...preset.tokens },
    fonts: { ...preset.fonts },
    radius: preset.radius,
    grain: preset.grain,
    glow: preset.glow,
    gradientAngle: preset.gradientAngle,
  };
}

/** Curated font list for the admin dropdowns; free text is still allowed. */
export const FONT_OPTIONS = [
  "Inter",
  "Geist",
  "Plus Jakarta Sans",
  "DM Sans",
  "Figtree",
  "Manrope",
  "Sora",
  "Space Grotesk",
  "Outfit",
  "Syne",
  "Bricolage Grotesque",
  "Instrument Serif",
  "Fraunces",
  "Playfair Display",
  "JetBrains Mono",
  "IBM Plex Mono",
  "Fira Code",
  "Space Mono",
];
