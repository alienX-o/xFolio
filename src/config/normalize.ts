/**
 * Allowlist normalisation for portfolio config.
 *
 * Config reaches us from three places we do not fully control: a hand-edited
 * JSON file, an "Import" in the admin center, and a localStorage draft that may
 * have been written by an older build. All three go through normalizeConfig(),
 * which walks the schema and rebuilds a known-good object field by field.
 * Unknown keys are dropped, wrong types fall back to the default, numbers are
 * clamped and strings are length-capped. That doubles as version migration.
 *
 * Values that end up inside CSS (colors, font names) are validated against
 * strict character allowlists here, because they are interpolated into a
 * <style> element at runtime. Values that end up in href/src attributes are
 * only length-checked here and sanitised at render time by safeUrl().
 */

import {
  CONFIG_VERSION,
  CURSOR_KINDS,
  HERO_SCENES,
  SECTION_KINDS,
  type AboutConfig,
  type Certification,
  type ContactConfig,
  type CustomItem,
  type Degree,
  type EducationConfig,
  type EffectsConfig,
  type ExperienceItem,
  type FooterConfig,
  type Identity,
  type LinksConfig,
  type MetaConfig,
  type NavConfig,
  type PortfolioConfig,
  type Project,
  type ProjectsConfig,
  type SectionConfig,
  type Skill,
  type SkillCategory,
  type SkillsConfig,
  type SocialLink,
  type Stat,
  type ThemeConfig,
  type ThemeTokens,
} from "./schema";

/* ------------------------------------------------------------- primitives */

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const rec = (v: unknown): Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};

const str = (v: unknown, fb: string, max = 2000): string =>
  typeof v === "string" ? v.slice(0, max) : fb;

const num = (v: unknown, fb: number, min: number, max: number): number =>
  typeof v === "number" && Number.isFinite(v) ? clamp(v, min, max) : fb;

const bool = (v: unknown, fb: boolean): boolean =>
  typeof v === "boolean" ? v : fb;

const oneOf = <T extends string>(
  v: unknown,
  options: readonly T[],
  fb: T,
): T => (typeof v === "string" && options.includes(v as T) ? (v as T) : fb);

const strList = (
  v: unknown,
  fb: string[],
  maxItems = 64,
  maxLen = 600,
): string[] =>
  Array.isArray(v)
    ? v
        .filter((x): x is string => typeof x === "string")
        .slice(0, maxItems)
        .map((s) => s.slice(0, maxLen))
    : fb;

/**
 * Maps an incoming array through a per-item normaliser, falling back to the
 * default list when the value is not an array at all. An explicit empty array
 * is respected, which is how you delete every project.
 */
const list = <T>(
  v: unknown,
  fb: T[],
  each: (raw: Record<string, unknown>, index: number) => T,
  maxItems = 100,
): T[] =>
  Array.isArray(v) ? v.slice(0, maxItems).map((r, i) => each(rec(r), i)) : fb;

/** DOM ids and anchor targets: keep them boring. */
const slug = (v: unknown, fb: string): string => {
  const raw = typeof v === "string" ? v : "";
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9\-_]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 48);
  return cleaned || fb;
};

/**
 * Strict CSS color allowlist: hex, a handful of functional notations with a
 * punctuation-free argument list, or a bare keyword. Anything containing a
 * semicolon, brace, url( or backslash fails, which is what stops a crafted
 * config from breaking out of the custom-property declaration it lands in.
 */
const CSS_COLOR =
  /^(#[0-9a-f]{3,8}|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\([0-9a-z.,%/\s+-]{1,64}\)|[a-z]{3,24})$/i;

const color = (v: unknown, fb: string): string => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length <= 72 && CSS_COLOR.test(s) ? s : fb;
};

/**
 * Font family names are interpolated into both a CSS font-family value and a
 * Google Fonts query, so restrict them to the characters real family names use.
 */
const FONT_NAME = /^[a-z0-9][a-z0-9 _-]{0,40}$/i;

const font = (v: unknown, fb: string): string => {
  const s = typeof v === "string" ? v.trim() : "";
  return FONT_NAME.test(s) ? s : fb;
};

/** URLs are sanitised at render time; here we only bound the length. */
const urlish = (v: unknown, fb: string): string => str(v, fb, 2048);

/* ----------------------------------------------------------------- pieces */

const normalizeTokens = (v: unknown, fb: ThemeTokens): ThemeTokens => {
  const r = rec(v);
  return {
    bg: color(r.bg, fb.bg),
    surface: color(r.surface, fb.surface),
    surface2: color(r.surface2, fb.surface2),
    fg: color(r.fg, fb.fg),
    muted: color(r.muted, fb.muted),
    line: color(r.line, fb.line),
    primary: color(r.primary, fb.primary),
    secondary: color(r.secondary, fb.secondary),
    accent: color(r.accent, fb.accent),
  };
};

const normalizeTheme = (v: unknown, fb: ThemeConfig): ThemeConfig => {
  const r = rec(v);
  const f = rec(r.fonts);
  return {
    preset: slug(r.preset, fb.preset),
    mode: oneOf(r.mode, ["dark", "light"] as const, fb.mode),
    tokens: normalizeTokens(r.tokens, fb.tokens),
    fonts: {
      heading: font(f.heading, fb.fonts.heading),
      body: font(f.body, fb.fonts.body),
      mono: font(f.mono, fb.fonts.mono),
    },
    radius: num(r.radius, fb.radius, 0, 40),
    density: oneOf(
      r.density,
      ["compact", "normal", "spacious"] as const,
      fb.density,
    ),
    grain: num(r.grain, fb.grain, 0, 1),
    glow: num(r.glow, fb.glow, 0, 1),
    gradientAngle: num(r.gradientAngle, fb.gradientAngle, 0, 360),
  };
};

const normalizeEffects = (v: unknown, fb: EffectsConfig): EffectsConfig => {
  const r = rec(v);
  return {
    webgl: bool(r.webgl, fb.webgl),
    heroScene: oneOf(r.heroScene, HERO_SCENES, fb.heroScene),
    intensity: num(r.intensity, fb.intensity, 0, 1),
    shaderText: bool(r.shaderText, fb.shaderText),
    cursor: oneOf(r.cursor, CURSOR_KINDS, fb.cursor),
    tilt: bool(r.tilt, fb.tilt),
    parallax: bool(r.parallax, fb.parallax),
    scrollProgress: bool(r.scrollProgress, fb.scrollProgress),
    revealAnimations: bool(r.revealAnimations, fb.revealAnimations),
    marquee: bool(r.marquee, fb.marquee),
  };
};

const normalizeIdentity = (v: unknown, fb: Identity): Identity => {
  const r = rec(v);
  return {
    name: str(r.name, fb.name, 80),
    shortName: str(r.shortName, fb.shortName, 40),
    initials: str(r.initials, fb.initials, 4),
    roles: strList(r.roles, fb.roles, 12, 60),
    tagline: str(r.tagline, fb.tagline, 200),
    bio: str(r.bio, fb.bio, 1200),
    location: str(r.location, fb.location, 80),
    avatar: urlish(r.avatar, fb.avatar),
    available: bool(r.available, fb.available),
    availabilityText: str(r.availabilityText, fb.availabilityText, 80),
  };
};

const normalizeMeta = (v: unknown, fb: MetaConfig): MetaConfig => {
  const r = rec(v);
  return {
    title: str(r.title, fb.title, 120),
    titleTemplate: str(r.titleTemplate, fb.titleTemplate, 120),
    description: str(r.description, fb.description, 320),
    siteUrl: urlish(r.siteUrl, fb.siteUrl),
    ogImage: urlish(r.ogImage, fb.ogImage),
    keywords: strList(r.keywords, fb.keywords, 24, 40),
    locale: str(r.locale, fb.locale, 12),
  };
};

const normalizeSocial = (
  r: Record<string, unknown>,
  i: number,
): SocialLink => ({
  id: slug(r.id, `social-${i + 1}`),
  platform: slug(r.platform, "link"),
  label: str(r.label, "Link", 40),
  url: urlish(r.url, ""),
  enabled: bool(r.enabled, true),
});

const normalizeLinks = (v: unknown, fb: LinksConfig): LinksConfig => {
  const r = rec(v);
  return {
    email: str(r.email, fb.email, 200),
    phone: str(r.phone, fb.phone, 40),
    resume: urlish(r.resume, fb.resume),
    resumeLabel: str(r.resumeLabel, fb.resumeLabel, 40),
    calendar: urlish(r.calendar, fb.calendar),
    socials: list(r.socials, fb.socials, normalizeSocial, 12),
  };
};

const normalizeNav = (v: unknown, fb: NavConfig): NavConfig => {
  const r = rec(v);
  return {
    style: oneOf(r.style, ["pill", "bar", "minimal"] as const, fb.style),
    showLogo: bool(r.showLogo, fb.showLogo),
    logoText: str(r.logoText, fb.logoText, 40),
    showResume: bool(r.showResume, fb.showResume),
    blur: bool(r.blur, fb.blur),
  };
};

const normalizeFooter = (v: unknown, fb: FooterConfig): FooterConfig => {
  const r = rec(v);
  return {
    note: str(r.note, fb.note, 300),
    credit: str(r.credit, fb.credit, 120),
    showSocials: bool(r.showSocials, fb.showSocials),
    showBackToTop: bool(r.showBackToTop, fb.showBackToTop),
  };
};

const normalizeStat = (r: Record<string, unknown>, i: number): Stat => ({
  id: slug(r.id, `stat-${i + 1}`),
  label: str(r.label, "", 48),
  value: str(r.value, "", 16),
});

const normalizeAbout = (v: unknown, fb: AboutConfig): AboutConfig => {
  const r = rec(v);
  return {
    body: str(r.body, fb.body, 2000),
    highlights: strList(r.highlights, fb.highlights, 12, 240),
    stats: list(r.stats, fb.stats, normalizeStat, 8),
    image: urlish(r.image, fb.image),
  };
};

const normalizeExperience = (
  r: Record<string, unknown>,
  i: number,
): ExperienceItem => ({
  id: slug(r.id, `role-${i + 1}`),
  role: str(r.role, "", 100),
  company: str(r.company, "", 100),
  location: str(r.location, "", 80),
  period: str(r.period, "", 60),
  current: bool(r.current, false),
  summary: str(r.summary, "", 400),
  bullets: strList(r.bullets, [], 12, 600),
  tags: strList(r.tags, [], 16, 40),
  url: urlish(r.url, ""),
});

const normalizeSkillCategory = (
  r: Record<string, unknown>,
  i: number,
): SkillCategory => ({
  id: slug(r.id, `cat-${i + 1}`),
  name: str(r.name, "Category", 40),
  emoji: str(r.emoji, "", 8),
});

const normalizeSkill = (r: Record<string, unknown>, i: number): Skill => ({
  id: slug(r.id, `skill-${i + 1}`),
  name: str(r.name, "", 48),
  category: slug(r.category, "other"),
  level: num(r.level, 70, 0, 100),
  icon: slug(r.icon, "code"),
});

const normalizeSkills = (v: unknown, fb: SkillsConfig): SkillsConfig => {
  const r = rec(v);
  return {
    display: oneOf(
      r.display,
      ["bars", "chips", "grid", "cloud"] as const,
      fb.display,
    ),
    showLevels: bool(r.showLevels, fb.showLevels),
    categories: list(r.categories, fb.categories, normalizeSkillCategory, 16),
    items: list(r.items, fb.items, normalizeSkill, 120),
  };
};

const normalizeProject = (r: Record<string, unknown>, i: number): Project => {
  const links = rec(r.links);
  return {
    id: slug(r.id, `project-${i + 1}`),
    title: str(r.title, "", 100),
    blurb: str(r.blurb, "", 240),
    description: str(r.description, "", 2000),
    year: str(r.year, "", 24),
    role: str(r.role, "", 80),
    tags: strList(r.tags, [], 16, 40),
    image: urlish(r.image, ""),
    featured: bool(r.featured, false),
    links: {
      demo: urlish(links.demo, ""),
      code: urlish(links.code, ""),
      more: urlish(links.more, ""),
    },
  };
};

const normalizeProjects = (v: unknown, fb: ProjectsConfig): ProjectsConfig => {
  const r = rec(v);
  return {
    layout: oneOf(r.layout, ["showcase", "grid", "list"] as const, fb.layout),
    projects: list(r.projects, fb.projects, normalizeProject, 60),
  };
};

const normalizeDegree = (r: Record<string, unknown>, i: number): Degree => ({
  id: slug(r.id, `degree-${i + 1}`),
  degree: str(r.degree, "", 140),
  institution: str(r.institution, "", 140),
  period: str(r.period, "", 60),
  grade: str(r.grade, "", 40),
  detail: str(r.detail, "", 600),
});

const normalizeCert = (
  r: Record<string, unknown>,
  i: number,
): Certification => ({
  id: slug(r.id, `cert-${i + 1}`),
  name: str(r.name, "", 140),
  issuer: str(r.issuer, "", 100),
  year: str(r.year, "", 24),
  url: urlish(r.url, ""),
});

const normalizeEducation = (
  v: unknown,
  fb: EducationConfig,
): EducationConfig => {
  const r = rec(v);
  return {
    degrees: list(r.degrees, fb.degrees, normalizeDegree, 10),
    certifications: list(r.certifications, fb.certifications, normalizeCert, 40),
    achievements: strList(r.achievements, fb.achievements, 20, 400),
  };
};

const normalizeContact = (v: unknown, fb: ContactConfig): ContactConfig => {
  const r = rec(v);
  return {
    body: str(r.body, fb.body, 800),
    ctaLabel: str(r.ctaLabel, fb.ctaLabel, 40),
    ctaHref: urlish(r.ctaHref, fb.ctaHref),
    secondaryLabel: str(r.secondaryLabel, fb.secondaryLabel, 40),
    secondaryHref: urlish(r.secondaryHref, fb.secondaryHref),
  };
};

const normalizeCustomItem = (
  r: Record<string, unknown>,
  i: number,
): CustomItem => ({
  id: slug(r.id, `item-${i + 1}`),
  title: str(r.title, "", 120),
  body: str(r.body, "", 1200),
  icon: slug(r.icon, "sparkles"),
  meta: str(r.meta, "", 60),
});

const normalizeSection = (
  r: Record<string, unknown>,
  i: number,
): SectionConfig => {
  const kind = oneOf(r.kind, SECTION_KINDS, "custom");
  return {
    id: slug(r.id, `${kind}-${i + 1}`),
    kind,
    label: str(r.label, kind, 32),
    enabled: bool(r.enabled, true),
    title: str(r.title, "", 120),
    subtitle: str(r.subtitle, "", 240),
    body: str(r.body, "", 4000),
    layout: oneOf(r.layout, ["prose", "cards", "stats"] as const, "prose"),
    items: list(r.items, [], normalizeCustomItem, 24),
  };
};

/* -------------------------------------------------------------- normalize */

/**
 * Rebuilds a full, safe config from arbitrary input by merging onto `fallback`.
 * Never throws, never returns a partial object.
 */
export function normalizeConfig(
  input: unknown,
  fallback: PortfolioConfig,
): PortfolioConfig {
  const r = rec(input);

  const sections = list(r.sections, fallback.sections, normalizeSection, 24);
  // A page with no sections at all is almost certainly a broken import, and it
  // would render a blank site with no obvious way back. Keep the defaults.
  const safeSections = sections.length > 0 ? sections : fallback.sections;

  // Section ids double as nav anchors, so they have to be unique.
  const seen = new Set<string>();
  const uniqueSections = safeSections.map((s, i) => {
    let id = s.id;
    while (seen.has(id)) id = `${s.id}-${i}`;
    seen.add(id);
    return id === s.id ? s : { ...s, id };
  });

  return {
    version: CONFIG_VERSION,
    meta: normalizeMeta(r.meta, fallback.meta),
    identity: normalizeIdentity(r.identity, fallback.identity),
    theme: normalizeTheme(r.theme, fallback.theme),
    effects: normalizeEffects(r.effects, fallback.effects),
    nav: normalizeNav(r.nav, fallback.nav),
    footer: normalizeFooter(r.footer, fallback.footer),
    links: normalizeLinks(r.links, fallback.links),
    sections: uniqueSections,
    about: normalizeAbout(r.about, fallback.about),
    experience: list(r.experience, fallback.experience, normalizeExperience, 40),
    skills: normalizeSkills(r.skills, fallback.skills),
    projects: normalizeProjects(r.projects, fallback.projects),
    education: normalizeEducation(r.education, fallback.education),
    contact: normalizeContact(r.contact, fallback.contact),
  };
}

/** Cheap structural gate used by the dev-only save route before writing. */
export function looksLikeConfig(input: unknown): boolean {
  const r = rec(input);
  return (
    Object.keys(r).length > 0 &&
    (typeof r.identity === "object" || typeof r.theme === "object")
  );
}
