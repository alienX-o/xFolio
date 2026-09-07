"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useConfig } from "@/components/ConfigProvider";
import { useActiveSection, useScrollTo } from "@/lib/hooks";
import { linkProps } from "@/lib/url";

/**
 * Site navigation, built from the enabled sections in config order.
 *
 * Reordering or disabling a section in the admin center changes this menu and
 * the page together, because both read the same array.
 *
 * `minimal` is the default style: transparent until you scroll, small
 * monospace labels, and the active section marked by colour alone rather than
 * a pill. `pill` and `bar` are the heavier alternatives.
 */
export function Nav() {
  const { nav, identity, links, sections } = useConfig();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollTo = useScrollTo();

  const items = sections.filter((s) => s.enabled);
  const active = useActiveSection(items.map((s) => s.id));
  const resume = linkProps(links.resume);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on Escape, and stop the page scrolling behind the mobile sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    scrollTo(id);
  };

  const logo = nav.logoText || identity.shortName || identity.name;
  const minimal = nav.style === "minimal";

  const backdrop = scrolled
    ? nav.blur
      ? "glass"
      : "border-b border-line bg-bg"
    : "border-b border-transparent";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${backdrop}`}
    >
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 ${
          minimal ? "py-4" : "py-5"
        }`}
        aria-label="Main"
      >
        {nav.showLogo ? (
          <button
            type="button"
            onClick={() => go(items[0]?.id ?? "home")}
            className="text-sm font-medium tracking-tight transition-opacity hover:opacity-70"
          >
            {logo}
          </button>
        ) : (
          <span />
        )}

        <ul className="hidden items-center gap-7 md:flex">
          {items.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => go(item.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-300 ${
                    isActive ? "text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-4">
          {nav.showResume && resume ? (
            <a
              {...resume}
              className="link-underline hidden font-mono text-[11px] uppercase tracking-[0.12em] text-fg md:inline-block"
            >
              {links.resumeLabel || "Resume"}
            </a>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-1 p-1 text-fg md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-line bg-bg md:hidden"
      >
        <ul className="mx-auto max-w-6xl px-6 py-2">
          {items.map((item) => (
            <li key={item.id} className="border-b border-line last:border-0">
              <button
                type="button"
                onClick={() => go(item.id)}
                aria-current={active === item.id ? "true" : undefined}
                className={`w-full py-3.5 text-left font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                  active === item.id ? "text-fg" : "text-muted"
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        {nav.showResume && resume ? (
          <div className="mx-auto max-w-6xl px-6 pb-5">
            <a
              {...resume}
              className="inline-block rounded-token bg-fg px-4 py-2 text-sm text-bg"
            >
              {links.resumeLabel || "Resume"}
            </a>
          </div>
        ) : null}
      </div>
    </header>
  );
}
