import type { ComponentType, SVGProps } from "react";
import { FaAws, FaJava } from "react-icons/fa";
import {
  SiAndroid,
  SiAngular,
  SiApple,
  SiBootstrap,
  SiCplusplus,
  SiCss,
  SiDart,
  SiDjango,
  SiDocker,
  SiDotnet,
  SiExpress,
  SiFigma,
  SiFirebase,
  SiFlask,
  SiFlutter,
  SiGit,
  SiGithub,
  SiGitlab,
  SiGo,
  SiGooglecloud,
  SiGraphql,
  SiHtml5,
  SiJavascript,
  SiJenkins,
  SiJest,
  SiJira,
  SiKotlin,
  SiKubernetes,
  SiLaravel,
  SiLinux,
  SiMongodb,
  SiMui,
  SiMysql,
  SiNestjs,
  SiNetlify,
  SiNextdotjs,
  SiNodedotjs,
  SiPhp,
  SiPostgresql,
  SiPostman,
  SiPrisma,
  SiPython,
  SiPytorch,
  SiReact,
  SiRedis,
  SiRedux,
  SiRuby,
  SiRust,
  SiSass,
  SiSocketdotio,
  SiSpringboot,
  SiSqlite,
  SiSupabase,
  SiSvelte,
  SiSwift,
  SiTailwindcss,
  SiTensorflow,
  SiThreedotjs,
  SiTypescript,
  SiVercel,
  SiVite,
  SiVuedotjs,
  SiWebpack,
} from "react-icons/si";
import { TbBrandAzure, TbBrandCSharp, TbBrandReactNative } from "react-icons/tb";
import { VscVscode } from "react-icons/vsc";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Skill icons, addressed by the string key stored in config.
 *
 * Every name here was checked against the installed react-icons build rather
 * than assumed: simple-icons drops brands over time (Java, VS Code and Azure
 * are all gone from the `si` set), so those pull from `fa`, `vsc` and `tb`.
 */
export const TECH_ICONS: Record<string, IconComponent> = {
  // languages
  javascript: SiJavascript,
  typescript: SiTypescript,
  java: FaJava,
  python: SiPython,
  cpp: SiCplusplus,
  csharp: TbBrandCSharp,
  go: SiGo,
  rust: SiRust,
  php: SiPhp,
  ruby: SiRuby,
  kotlin: SiKotlin,
  swift: SiSwift,
  dart: SiDart,

  // frontend
  html5: SiHtml5,
  css3: SiCss,
  sass: SiSass,
  tailwind: SiTailwindcss,
  react: SiReact,
  vue: SiVuedotjs,
  angular: SiAngular,
  svelte: SiSvelte,
  nextjs: SiNextdotjs,
  redux: SiRedux,
  materialui: SiMui,
  bootstrap: SiBootstrap,
  threejs: SiThreedotjs,

  // backend
  nodejs: SiNodedotjs,
  express: SiExpress,
  nestjs: SiNestjs,
  springboot: SiSpringboot,
  django: SiDjango,
  flask: SiFlask,
  laravel: SiLaravel,
  dotnet: SiDotnet,
  graphql: SiGraphql,
  socketio: SiSocketdotio,

  // mobile
  reactnative: TbBrandReactNative,
  flutter: SiFlutter,
  android: SiAndroid,
  apple: SiApple,

  // data
  mysql: SiMysql,
  postgresql: SiPostgresql,
  mongodb: SiMongodb,
  redis: SiRedis,
  sqlite: SiSqlite,
  firebase: SiFirebase,
  supabase: SiSupabase,
  prisma: SiPrisma,

  // platform and tools
  aws: FaAws,
  azure: TbBrandAzure,
  gcp: SiGooglecloud,
  docker: SiDocker,
  kubernetes: SiKubernetes,
  vercel: SiVercel,
  netlify: SiNetlify,
  git: SiGit,
  github: SiGithub,
  gitlab: SiGitlab,
  vscode: VscVscode,
  postman: SiPostman,
  figma: SiFigma,
  linux: SiLinux,
  jira: SiJira,
  jenkins: SiJenkins,
  webpack: SiWebpack,
  vite: SiVite,
  jest: SiJest,
  tensorflow: SiTensorflow,
  pytorch: SiPytorch,
};

/** Sorted keys, for the admin icon picker. */
export const TECH_ICON_KEYS = Object.keys(TECH_ICONS).sort();

export function getTechIcon(key: string): IconComponent | null {
  return TECH_ICONS[key] ?? null;
}

/**
 * Best-effort guess from a skill name, used when adding a skill in the admin
 * so the icon is usually already right.
 */
export function guessTechIcon(name: string): string {
  const k = name.toLowerCase().replace(/[^a-z0-9+]/g, "");
  const direct: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    reactjs: "react",
    react: "react",
    reactnative: "reactnative",
    nextjs: "nextjs",
    next: "nextjs",
    nodejs: "nodejs",
    node: "nodejs",
    expressjs: "express",
    springboot: "springboot",
    spring: "springboot",
    materialui: "materialui",
    mui: "materialui",
    tailwindcss: "tailwind",
    html: "html5",
    css: "css3",
    cpp: "cpp",
    "c++": "cpp",
    csharp: "csharp",
    "c#": "csharp",
    golang: "go",
    postgres: "postgresql",
    mongo: "mongodb",
    restapis: "graphql",
    threejs: "threejs",
  };
  if (direct[k]) return direct[k]!;
  if (TECH_ICONS[k]) return k;
  const partial = TECH_ICON_KEYS.find((key) => k.includes(key));
  return partial ?? "code";
}
