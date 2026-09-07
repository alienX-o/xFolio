"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------ environment */

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/**
 * Honours the OS "reduce motion" setting. Every animated surface checks this
 * and drops to a static rendering, which is also the cheap path on weak
 * hardware. Starts false so server and first client render agree.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * Feature-detects WebGL once. A null return means "still checking", so
 * callers can hold off rendering a canvas until we know it will work rather
 * than mounting three.js and having it throw.
 */
export function useWebGLSupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let ok = false;
    try {
      const canvas = document.createElement("canvas");
      ok = Boolean(
        canvas.getContext("webgl2") ??
          canvas.getContext("webgl") ??
          canvas.getContext("experimental-webgl"),
      );
    } catch {
      ok = false;
    }
    setSupported(ok);
  }, []);

  return supported;
}

/** True after the first client render. Guards anything non-deterministic. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/* ---------------------------------------------------------------- pointer */

export type Pointer = {
  /** Viewport pixels. */
  x: number;
  y: number;
  /** Normalised to -1..1 from the viewport centre. */
  nx: number;
  ny: number;
  active: boolean;
};

/**
 * Pointer position in a ref rather than state.
 *
 * The previous version of this site kept the cursor position in React state,
 * so every mousemove re-rendered all five sections. Readers here poll the ref
 * inside their own animation frame instead, which keeps pointer tracking at
 * zero renders no matter how many effects consume it.
 */
export function usePointer(enabled = true): React.RefObject<Pointer> {
  const pointer = useRef<Pointer>({ x: 0, y: 0, nx: 0, ny: 0, active: false });

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: PointerEvent) => {
      const p = pointer.current;
      p.x = e.clientX;
      p.y = e.clientY;
      p.nx = (e.clientX / window.innerWidth) * 2 - 1;
      p.ny = -((e.clientY / window.innerHeight) * 2 - 1);
      p.active = true;
    };
    const onLeave = () => {
      pointer.current.active = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  return pointer;
}

/* ----------------------------------------------------------------- scroll */

/**
 * Scroll progress 0..1, written straight to a CSS variable on an element so
 * the progress bar animates without a React render per frame.
 */
export function useScrollProgressVar(
  target: React.RefObject<HTMLElement | null>,
  varName = "--x-progress",
): void {
  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const el = target.current;
      if (!el) return;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      // Guard the divide: a page shorter than the viewport has no progress,
      // and the old code produced NaN here and blanked the bar.
      const progress =
        scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      el.style.setProperty(varName, String(progress));
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [target, varName]);
}

/**
 * Tracks which section owns the viewport, for nav highlighting. Uses one
 * observer over all sections and only sets state when the answer changes.
 */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");
  const key = ids.join("|");

  useEffect(() => {
    const sectionIds = key ? key.split("|") : [];
    if (sectionIds.length === 0) return;

    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) visible.set(id, entry.intersectionRatio);
          else visible.delete(id);
        }
        // Pick the most-visible section, falling back to document order.
        let best = "";
        let bestRatio = -1;
        for (const id of sectionIds) {
          const ratio = visible.get(id);
          if (ratio !== undefined && ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        }
        if (best) setActive((prev) => (prev === best ? prev : best));
      },
      { threshold: [0.1, 0.3, 0.5, 0.75], rootMargin: "-15% 0px -35% 0px" },
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key]);

  return active;
}

/**
 * One-shot reveal trigger. Unobserves immediately on first intersection, so
 * unlike the old implementation it cannot re-fire and re-set state in a loop.
 */
export function useInView<T extends HTMLElement>(
  options?: { threshold?: number; rootMargin?: string; once?: boolean },
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  const threshold = options?.threshold ?? 0.15;
  const rootMargin = options?.rootMargin ?? "0px 0px -10% 0px";
  const once = options?.once ?? true;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}

/* ------------------------------------------------------------------ misc */

/** Cycles a typewriter through phrases. Pure timers, no layout reads. */
export function useTypewriter(
  phrases: string[],
  opts?: { type?: number; erase?: number; hold?: number; enabled?: boolean },
): string {
  const type = opts?.type ?? 55;
  const erase = opts?.erase ?? 28;
  const hold = opts?.hold ?? 1600;
  const enabled = opts?.enabled ?? true;

  const key = phrases.join("|");
  const list = useMemo(() => (key ? key.split("|") : []), [key]);

  const [text, setText] = useState(list[0] ?? "");

  useEffect(() => {
    if (!enabled || list.length === 0) {
      setText(list[0] ?? "");
      return;
    }
    if (list.length === 1) {
      setText(list[0] ?? "");
      return;
    }

    let phrase = 0;
    let chars = 0;
    let erasing = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = list[phrase] ?? "";

      if (!erasing && chars < current.length) {
        chars += 1;
        setText(current.slice(0, chars));
        timer = setTimeout(tick, type);
        return;
      }
      if (!erasing) {
        erasing = true;
        timer = setTimeout(tick, hold);
        return;
      }
      if (chars > 0) {
        chars -= 1;
        setText(current.slice(0, chars));
        timer = setTimeout(tick, erase);
        return;
      }
      erasing = false;
      phrase = (phrase + 1) % list.length;
      timer = setTimeout(tick, type);
    };

    timer = setTimeout(tick, hold);
    return () => clearTimeout(timer);
  }, [list, type, erase, hold, enabled]);

  return text;
}

/** Smooth-scrolls to a section id, respecting reduced motion. */
export function useScrollTo() {
  const reduced = useReducedMotion();

  return useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
    },
    [reduced],
  );
}
