"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useConfig } from "@/components/ConfigProvider";
import { useReducedMotion, useScrollProgressVar } from "@/lib/hooks";

/**
 * Reading-progress bar.
 *
 * The width comes from a CSS custom property that the scroll handler writes
 * directly, so scrolling never triggers a React render. The old version kept
 * progress in state and also divided by zero on pages shorter than the
 * viewport, which left the bar stuck at NaN.
 */
export function ScrollProgress() {
  const { effects } = useConfig();
  const ref = useRef<HTMLDivElement>(null);
  useScrollProgressVar(ref);

  if (!effects.scrollProgress) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-px"
    >
      <div
        className="h-full origin-left bg-fg"
        style={{ transform: "scaleX(var(--x-progress, 0))" }}
      />
    </div>
  );
}

export function BackToTop() {
  const { footer } = useConfig();
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!footer.showBackToTop) return null;

  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })
      }
      aria-label="Back to top"
      // Kept out of the tab order and off-screen until it is usable, rather
      // than being permanently visible over the hero.
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed bottom-6 right-6 z-50 rounded-token border border-line bg-bg p-2.5 text-muted transition-all duration-300 hover:border-fg hover:text-fg ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp size={16} />
    </button>
  );
}
