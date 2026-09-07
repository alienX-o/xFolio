/**
 * URL sanitisation for config-supplied links.
 *
 * Every href and src on the site originates in the config file, which can be
 * hand-edited or imported from someone else's export. That makes it untrusted
 * input crossing into an attribute where `javascript:` would execute, so all
 * of it is funnelled through safeUrl() at render time and dropped if it does
 * not match the scheme allowlist. Callers render nothing when they get null,
 * which is also how empty fields hide their own buttons.
 */

const LINK_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Raster data URIs only. `image/svg+xml` is deliberately excluded: an SVG can
 * carry script, and while it stays inert inside <img>, allowing it invites
 * the same string to be reused somewhere it would not be.
 */
const DATA_IMAGE =
  /^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i;

/**
 * Rejects C0/C1 control characters and whitespace. Injecting one into the
 * middle of a scheme name (a tab or NUL inside "javascript:") is a classic way
 * to slip past a scheme check, since browsers strip them before navigating.
 * Written as a loop rather than a regex character class so that no literal
 * control bytes need to appear in this source file.
 */
function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x20 || (code >= 0x7f && code <= 0x9f)) return true;
  }
  return false;
}

export type SafeUrlKind = "link" | "image";

/**
 * Returns the URL if it is safe to put in an attribute, otherwise null.
 * Relative paths, fragments and query-only links are passed through.
 */
export function safeUrl(
  raw: string | undefined | null,
  kind: SafeUrlKind = "link",
): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  if (hasControlChars(value)) return null;

  // Same-document and same-origin relative references.
  if (value.startsWith("#") || value.startsWith("?")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (value.startsWith("./") || value.startsWith("../")) return value;

  if (kind === "image" && value.toLowerCase().startsWith("data:")) {
    return DATA_IMAGE.test(value) ? value : null;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    // Not absolute and not one of the relative forms above. A bare token like
    // "example.com" is ambiguous, so upgrade it rather than guessing.
    return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/.*)?$/i.test(value)
      ? `https://${value}`
      : null;
  }

  if (!LINK_SCHEMES.has(parsed.protocol)) return null;
  if (kind === "image" && !/^https?:$/.test(parsed.protocol)) return null;

  return parsed.toString();
}

/** True when the link leaves the site, so it needs target and rel. */
export function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Props for an anchor built from a config URL. External links always get
 * noopener and noreferrer so the opened page cannot reach back through
 * window.opener.
 */
export function linkProps(
  raw: string | undefined | null,
): { href: string; target?: "_blank"; rel?: string } | null {
  const href = safeUrl(raw);
  if (!href) return null;
  return isExternal(href)
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { href };
}

/** mailto:/tel: helpers that accept either a bare address or a full URL. */
export function mailto(email: string | undefined | null): string | null {
  if (!email) return null;
  const value = email.trim();
  if (!value) return null;
  const url = value.toLowerCase().startsWith("mailto:")
    ? value
    : `mailto:${value}`;
  return safeUrl(url);
}

export function tel(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const value = phone.trim();
  if (!value) return null;
  const url = value.toLowerCase().startsWith("tel:") ? value : `tel:${value}`;
  return safeUrl(url);
}
