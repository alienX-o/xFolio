/**
 * The entire portfolio is a pure function of this one object.
 *
 * Anything the admin center can change lives here, and nothing else does.
 * `data/portfolio.config.json` holds the committed value; the admin edits a
 * draft copy of it in the browser and publishes by writing that file back.
 *
 * Every field is optional on the wire (see DeepPartial) — incoming JSON is
 * always run through normalizeConfig(), which merges it onto the defaults and
 * coerces types field by field. That keeps hand-edited and imported files safe
 * without shipping a schema-validation library.
 */

export const CONFIG_VERSION = 2;

/* ------------------------------------------------------------------ theme */

export type ThemeTokens = {
  bg: string;
  surface: string;
  surface2: string;
  fg: string;
  muted: string;
  line: string;
  primary: string;
  secondary: string;
  accent: string;
};

export type Density = "compact" | "normal" | "spacious";

export type ThemeConfig = {
  preset: string;
  mode: "dark" | "light";
  tokens: ThemeTokens;
  fonts: { heading: string; body: string; mono: string };
  radius: number;
  density: Density;
  grain: number;
  glow: number;
  gradientAngle: number;
};

/* ---------------------------------------------------------------- effects */

/**
 * Hero background scenes, ordered from most restrained to loudest. The first
 * few are the minimal defaults; the rest are there for anyone who wants the
 * page to shout.
 */
export const HERO_SCENES = [
  "none",
  "dots",
  "grid",
  "particles",
  "waves",
  "rings",
  "blob",
  "tunnel",
] as const;
export type HeroScene = (typeof HERO_SCENES)[number];

export const CURSOR_KINDS = ["none", "dot", "trail", "glow"] as const;
export type CursorKind = (typeof CURSOR_KINDS)[number];

export type EffectsConfig = {
  /** Master switch for every WebGL surface. Off => DOM/CSS fallbacks. */
  webgl: boolean;
  heroScene: HeroScene;
  /** 0..1 — scales particle counts, amplitudes and speeds everywhere. */
  intensity: number;
  /** Canvas-texture + shader treatment on the hero name. */
  shaderText: boolean;
  cursor: CursorKind;
  tilt: boolean;
  parallax: boolean;
  scrollProgress: boolean;
  revealAnimations: boolean;
  marquee: boolean;
};

/* ----------------------------------------------------------------- pieces */

export type Identity = {
  name: string;
  shortName: string;
  initials: string;
  roles: string[];
  tagline: string;
  bio: string;
  location: string;
  avatar: string;
  available: boolean;
  availabilityText: string;
};

export type MetaConfig = {
  title: string;
  titleTemplate: string;
  description: string;
  siteUrl: string;
  ogImage: string;
  keywords: string[];
  locale: string;
};

export type SocialLink = {
  id: string;
  platform: string;
  label: string;
  url: string;
  enabled: boolean;
};

export type LinksConfig = {
  email: string;
  phone: string;
  resume: string;
  resumeLabel: string;
  calendar: string;
  socials: SocialLink[];
};

export type NavConfig = {
  style: "pill" | "bar" | "minimal";
  showLogo: boolean;
  logoText: string;
  showResume: boolean;
  blur: boolean;
};

export type FooterConfig = {
  note: string;
  credit: string;
  showSocials: boolean;
  showBackToTop: boolean;
};

export type Stat = { id: string; label: string; value: string };

export type AboutConfig = {
  body: string;
  highlights: string[];
  stats: Stat[];
  image: string;
};

export type ExperienceItem = {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  current: boolean;
  summary: string;
  bullets: string[];
  tags: string[];
  url: string;
};

export type SkillCategory = { id: string; name: string; emoji: string };

export type Skill = {
  id: string;
  name: string;
  category: string;
  level: number;
  /** Key into the icon registry (src/lib/icons.tsx). */
  icon: string;
};

export type SkillsConfig = {
  display: "bars" | "chips" | "grid" | "cloud";
  showLevels: boolean;
  categories: SkillCategory[];
  items: Skill[];
};

export type Project = {
  id: string;
  title: string;
  blurb: string;
  description: string;
  year: string;
  role: string;
  tags: string[];
  image: string;
  featured: boolean;
  links: { demo: string; code: string; more: string };
};

export type ProjectsConfig = {
  layout: "showcase" | "grid" | "list";
  projects: Project[];
};

export type Degree = {
  id: string;
  degree: string;
  institution: string;
  period: string;
  grade: string;
  detail: string;
};

export type Certification = {
  id: string;
  name: string;
  issuer: string;
  year: string;
  url: string;
};

export type EducationConfig = {
  degrees: Degree[];
  certifications: Certification[];
  achievements: string[];
};

export type ContactConfig = {
  body: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

/* --------------------------------------------------------------- sections */

export const SECTION_KINDS = [
  "hero",
  "about",
  "experience",
  "skills",
  "projects",
  "education",
  "contact",
  "custom",
] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

export type CustomItem = {
  id: string;
  title: string;
  body: string;
  icon: string;
  meta: string;
};

/**
 * Order and visibility of the page. `sections` is an array, so dragging a row
 * in the admin reorders the real page. Custom sections carry their own content.
 */
export type SectionConfig = {
  id: string;
  kind: SectionKind;
  label: string;
  enabled: boolean;
  title: string;
  subtitle: string;
  /** custom sections only */
  body: string;
  layout: "prose" | "cards" | "stats";
  items: CustomItem[];
};

/* ----------------------------------------------------------------- config */

export type PortfolioConfig = {
  version: number;
  meta: MetaConfig;
  identity: Identity;
  theme: ThemeConfig;
  effects: EffectsConfig;
  nav: NavConfig;
  footer: FooterConfig;
  links: LinksConfig;
  sections: SectionConfig[];
  about: AboutConfig;
  experience: ExperienceItem[];
  skills: SkillsConfig;
  projects: ProjectsConfig;
  education: EducationConfig;
  contact: ContactConfig;
};

export type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type PortfolioConfigInput = DeepPartial<PortfolioConfig>;
