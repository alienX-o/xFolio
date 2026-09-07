import {
  FaBehance,
  FaDiscord,
  FaDribbble,
  FaEnvelope,
  FaFileLines,
  FaGithub,
  FaGitlab,
  FaGlobe,
  FaInstagram,
  FaLink,
  FaLinkedin,
  FaMedium,
  FaPhone,
  FaStackOverflow,
  FaTelegram,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

import type { IconComponent } from "./icons";

/**
 * Social platform icons.
 *
 * lucide dropped brand icons in v1, so these come from react-icons instead —
 * the platform string in config is matched against this table, and anything
 * unrecognised falls back to a generic link glyph rather than rendering
 * nothing.
 */
const SOCIAL_ICONS: Record<string, IconComponent> = {
  github: FaGithub,
  gitlab: FaGitlab,
  linkedin: FaLinkedin,
  twitter: FaXTwitter,
  x: FaXTwitter,
  instagram: FaInstagram,
  youtube: FaYoutube,
  dribbble: FaDribbble,
  behance: FaBehance,
  medium: FaMedium,
  stackoverflow: FaStackOverflow,
  telegram: FaTelegram,
  discord: FaDiscord,
  email: FaEnvelope,
  mail: FaEnvelope,
  phone: FaPhone,
  resume: FaFileLines,
  website: FaGlobe,
  globe: FaGlobe,
  link: FaLink,
};

export const SOCIAL_PLATFORMS = Object.keys(SOCIAL_ICONS).sort();

export function getSocialIcon(platform: string): IconComponent {
  return SOCIAL_ICONS[platform.toLowerCase()] ?? FaLink;
}

/** Guesses the platform from a URL, so adding a link usually picks its icon. */
export function guessPlatform(url: string): string {
  const value = url.toLowerCase();
  if (value.startsWith("mailto:")) return "email";
  if (value.startsWith("tel:")) return "phone";

  const match = SOCIAL_PLATFORMS.find(
    (platform) =>
      platform.length > 2 && value.includes(`${platform}.com`),
  );
  if (match) return match;
  if (value.includes("x.com")) return "x";
  return "link";
}
