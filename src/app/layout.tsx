import type { Metadata, Viewport } from "next";

import { siteConfig } from "@/lib/site-config";
import { googleFontsHref, themeStyleSheet } from "@/lib/theme";
import { safeUrl } from "@/lib/url";

import "./globals.css";

const { meta, identity, theme } = siteConfig;

/**
 * Metadata is derived from the committed config, so editing the JSON updates
 * the document title, description and social cards along with the page.
 */
export function generateMetadata(): Metadata {
  const base = safeUrl(meta.siteUrl);
  const title = meta.title || identity.name || "Portfolio";
  // Next requires a %s placeholder in a title template; fall back if the
  // config has one that would not work.
  const template = meta.titleTemplate.includes("%s")
    ? meta.titleTemplate
    : undefined;
  const ogImage = safeUrl(meta.ogImage, "image");

  return {
    ...(base ? { metadataBase: new URL(base) } : {}),
    title: template ? { default: title, template } : title,
    description: meta.description,
    keywords: meta.keywords.length ? meta.keywords : undefined,
    authors: identity.name ? [{ name: identity.name }] : undefined,
    creator: identity.name || undefined,
    openGraph: {
      type: "website",
      title,
      description: meta.description,
      siteName: title,
      locale: meta.locale || "en",
      ...(base ? { url: base } : {}),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description: meta.description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    icons: {
      // The SVG is preferred where supported and scales cleanly; the original
      // .ico stays as the fallback for older browsers and Windows pinning.
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: "/logo192.png",
    },
    manifest: "/manifest.webmanifest",
  };
}

export const viewport: Viewport = {
  themeColor: theme.tokens.bg,
  colorScheme: theme.mode === "light" ? "light" : "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const fontHref = googleFontsHref(theme);

  return (
    <html lang={meta.locale || "en"}>
      <head>
        {/*
          The theme is emitted server-side from the committed config so the
          first paint already has the right colors and fonts. ConfigProvider
          re-emits the same variables on the client, which is what lets the
          admin preview a different theme without a reload.
        */}
        <style
          dangerouslySetInnerHTML={{ __html: themeStyleSheet(theme) }}
        />
        {fontHref ? (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin=""
            />
            <link rel="stylesheet" href={fontHref} />
          </>
        ) : null}
      </head>
      <body className="grain-overlay antialiased">{children}</body>
    </html>
  );
}
