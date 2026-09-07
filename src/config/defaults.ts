import { THEME_PRESETS } from "./presets";
import {
  CONFIG_VERSION,
  type Certification,
  type CustomItem,
  type Degree,
  type ExperienceItem,
  type PortfolioConfig,
  type Project,
  type SectionConfig,
  type SectionKind,
  type Skill,
  type SocialLink,
  type Stat,
} from "./schema";

const base = THEME_PRESETS[0]!;

/**
 * The template config. Everything the site renders falls back to a field in
 * here, so this object doubles as the "reset to factory" state and as the
 * merge base for `data/portfolio.config.json`.
 */
export const DEFAULT_CONFIG: PortfolioConfig = {
  version: CONFIG_VERSION,

  meta: {
    title: "Your Name",
    titleTemplate: "%s — Portfolio",
    description:
      "Portfolio of a developer who builds fast, considered interfaces.",
    siteUrl: "",
    ogImage: "",
    keywords: ["developer", "portfolio", "engineer"],
    locale: "en",
  },

  identity: {
    name: "Your Name",
    shortName: "You",
    initials: "YN",
    roles: ["Software Developer", "Interface Engineer"],
    tagline: "I build things for the web.",
    bio: "Short paragraph about what you build, what you care about, and what you want to be hired for.",
    location: "Earth",
    avatar: "",
    available: true,
    availabilityText: "Open to opportunities",
  },

  theme: {
    preset: base.id,
    mode: base.mode,
    tokens: { ...base.tokens },
    fonts: { ...base.fonts },
    radius: base.radius,
    density: "spacious",
    grain: base.grain,
    glow: base.glow,
    gradientAngle: base.gradientAngle,
  },

  /*
   * Minimal by default. The 3D layer stays on, but as the faint `dots` field
   * at low intensity; the attention-grabbing effects (distorted display text,
   * custom cursor, card tilt, scrolling marquee) all start off. Every one of
   * them is a switch in the admin center for anyone who wants them back.
   */
  effects: {
    webgl: true,
    heroScene: "dots",
    intensity: 0.35,
    shaderText: false,
    cursor: "none",
    tilt: false,
    parallax: true,
    scrollProgress: true,
    revealAnimations: true,
    marquee: false,
  },

  nav: {
    style: "minimal",
    showLogo: true,
    logoText: "",
    showResume: true,
    blur: true,
  },

  footer: {
    note: "",
    credit: "",
    showSocials: true,
    showBackToTop: true,
  },

  links: {
    email: "",
    phone: "",
    resume: "",
    resumeLabel: "Resume",
    calendar: "",
    socials: [
      {
        id: "github",
        platform: "github",
        label: "GitHub",
        url: "",
        enabled: true,
      },
      {
        id: "linkedin",
        platform: "linkedin",
        label: "LinkedIn",
        url: "",
        enabled: true,
      },
    ],
  },

  sections: [
    {
      id: "home",
      kind: "hero",
      label: "Home",
      enabled: true,
      title: "",
      subtitle: "",
      body: "",
      layout: "prose",
      items: [],
    },
    {
      id: "about",
      kind: "about",
      label: "About",
      enabled: true,
      title: "About",
      subtitle: "The short version",
      body: "",
      layout: "prose",
      items: [],
    },
    {
      id: "experience",
      kind: "experience",
      label: "Experience",
      enabled: true,
      title: "Experience",
      subtitle: "Where I have worked",
      body: "",
      layout: "prose",
      items: [],
    },
    {
      id: "skills",
      kind: "skills",
      label: "Skills",
      enabled: true,
      title: "Skills",
      subtitle: "Tools I reach for",
      body: "",
      layout: "prose",
      items: [],
    },
    {
      id: "projects",
      kind: "projects",
      label: "Projects",
      enabled: true,
      title: "Projects",
      subtitle: "Things I have shipped",
      body: "",
      layout: "prose",
      items: [],
    },
    {
      id: "education",
      kind: "education",
      label: "Education",
      enabled: true,
      title: "Education",
      subtitle: "Study and certifications",
      body: "",
      layout: "prose",
      items: [],
    },
    {
      id: "contact",
      kind: "contact",
      label: "Contact",
      enabled: true,
      title: "Get in touch",
      subtitle: "",
      body: "",
      layout: "prose",
      items: [],
    },
  ],

  about: {
    body: "",
    highlights: [],
    stats: [],
    image: "",
  },

  experience: [],

  skills: {
    display: "bars",
    showLevels: true,
    categories: [
      { id: "languages", name: "Languages", emoji: "" },
      { id: "frontend", name: "Frontend", emoji: "" },
      { id: "backend", name: "Backend", emoji: "" },
      { id: "mobile", name: "Mobile", emoji: "" },
      { id: "database", name: "Database", emoji: "" },
      { id: "tools", name: "Tools", emoji: "" },
    ],
    items: [],
  },

  projects: {
    layout: "showcase",
    projects: [],
  },

  education: {
    degrees: [],
    certifications: [],
    achievements: [],
  },

  contact: {
    body: "Interested in working together? I am always open to a conversation.",
    ctaLabel: "Send an email",
    ctaHref: "",
    secondaryLabel: "",
    secondaryHref: "",
  },
};

/* ---------------------------------------------------- factories for admin */

const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export const newProject = (): Project => ({
  id: uid("project"),
  title: "New project",
  blurb: "One line on what it does.",
  description: "",
  year: String(new Date().getFullYear()),
  role: "",
  tags: [],
  image: "",
  featured: false,
  links: { demo: "", code: "", more: "" },
});

export const newExperience = (): ExperienceItem => ({
  id: uid("role"),
  role: "New role",
  company: "",
  location: "",
  period: "",
  current: false,
  summary: "",
  bullets: [],
  tags: [],
  url: "",
});

export const newSkill = (category: string): Skill => ({
  id: uid("skill"),
  name: "New skill",
  category,
  level: 70,
  icon: "code",
});

export const newDegree = (): Degree => ({
  id: uid("degree"),
  degree: "New qualification",
  institution: "",
  period: "",
  grade: "",
  detail: "",
});

export const newCertification = (): Certification => ({
  id: uid("cert"),
  name: "New certification",
  issuer: "",
  year: String(new Date().getFullYear()),
  url: "",
});

export const newSocial = (): SocialLink => ({
  id: uid("social"),
  platform: "link",
  label: "New link",
  url: "",
  enabled: true,
});

export const newStat = (): Stat => ({
  id: uid("stat"),
  label: "Label",
  value: "0",
});

export const newCustomItem = (): CustomItem => ({
  id: uid("item"),
  title: "New item",
  body: "",
  icon: "sparkles",
  meta: "",
});

export const newSection = (kind: SectionKind = "custom"): SectionConfig => ({
  id: uid(kind),
  kind,
  label: kind === "custom" ? "New section" : kind,
  enabled: true,
  title: kind === "custom" ? "New section" : "",
  subtitle: "",
  body: "",
  layout: "prose",
  items: [],
});
