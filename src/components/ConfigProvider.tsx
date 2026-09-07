"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { DEFAULT_CONFIG } from "@/config/defaults";
import { normalizeConfig } from "@/config/normalize";
import type { PortfolioConfig } from "@/config/schema";
import { DRAFT_MESSAGE, DRAFT_READY } from "@/lib/messages";
import { localDraftStore } from "@/lib/storage";
import { googleFontsHref, themeStyleSheet } from "@/lib/theme";

/**
 * Makes one config available to the whole tree and applies its theme.
 *
 * The public page passes the committed config straight through. The admin
 * preview passes its live draft instead, which is why every section component
 * reads from this context rather than importing the config directly: the exact
 * same components render both, so the preview cannot drift from the real site.
 */

const ConfigContext = createContext<PortfolioConfig | null>(null);

export function useConfig(): PortfolioConfig {
  const config = useContext(ConfigContext);
  if (!config) {
    throw new Error("useConfig must be used inside a ConfigProvider");
  }
  return config;
}

/**
 * Injects theme variables and the webfont link.
 *
 * Rendered as a real <style> element in the tree rather than via a stylesheet
 * so it updates synchronously when the draft changes — dragging a color picker
 * in the admin repaints the preview on the same frame. `scoped` keeps the
 * variables on a wrapper instead of :root, which is how the admin previews a
 * theme without restyling its own chrome.
 */
function ThemeStyles({
  config,
  scopeSelector,
}: {
  config: PortfolioConfig;
  scopeSelector?: string;
}) {
  const css = useMemo(() => {
    const sheet = themeStyleSheet(config.theme);
    return scopeSelector ? sheet.replace(/^:root/, scopeSelector) : sheet;
  }, [config.theme, scopeSelector]);

  const fontHref = useMemo(
    () => googleFontsHref(config.theme),
    [config.theme],
  );

  return (
    <>
      {fontHref ? (
        <link rel="stylesheet" href={fontHref} fetchPriority="low" />
      ) : null}
      <style
        dangerouslySetInnerHTML={{ __html: css }}
      />
    </>
  );
}

export function ConfigProvider({
  config,
  children,
  scopeSelector,
}: {
  config: PortfolioConfig;
  children: ReactNode;
  scopeSelector?: string;
}) {
  return (
    <ConfigContext.Provider value={config}>
      <ThemeStyles config={config} scopeSelector={scopeSelector} />
      {children}
    </ConfigContext.Provider>
  );
}

/**
 * Public-site provider with opt-in draft preview.
 *
 * Visiting /?draft=1 renders the localStorage draft instead of the committed
 * file. That is how both the admin's preview iframe and "open in a new tab"
 * work. The swap happens in an effect after mount, so the server and the first
 * client render always agree on the committed config and hydration stays clean.
 *
 * While in draft mode the page also accepts config over postMessage, which is
 * what makes the admin preview update as you type instead of on reload.
 * Messages are only honoured from this exact origin and are still run through
 * normalizeConfig, so the listener cannot be used to inject anything the
 * config file itself could not contain.
 */
export function SiteConfigProvider({
  config,
  children,
}: {
  config: PortfolioConfig;
  children: ReactNode;
}) {
  const [active, setActive] = useState(config);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("draft") !== "1") return;

    let cancelled = false;
    void localDraftStore.read().then((draft) => {
      if (!cancelled && draft) setActive(draft);
    });

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: unknown; config?: unknown } | null;
      if (!data || data.type !== DRAFT_MESSAGE) return;
      setActive(normalizeConfig(data.config, DEFAULT_CONFIG));
    };

    window.addEventListener("message", onMessage);

    // Tell the opener we are ready for config, since the iframe usually
    // finishes loading after the first change has already been sent.
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: DRAFT_READY },
        window.location.origin,
      );
    }

    return () => {
      cancelled = true;
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return <ConfigProvider config={active}>{children}</ConfigProvider>;
}
