"use client";

import type { CSSProperties, ReactNode } from "react";

import { useConfig } from "@/components/ConfigProvider";
import { useInView } from "@/lib/hooks";

/**
 * Scroll-triggered entrance.
 *
 * The transition itself lives in CSS (`[data-reveal]` in globals.css), so the
 * hidden state is correct before any JavaScript runs and there is no flash of
 * fully-styled content. All this component does is flip one attribute when the
 * element first enters the viewport, then stop observing.
 *
 * `effects.revealAnimations: false` in config removes the wrapper behaviour
 * entirely rather than animating to a no-op.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: ReactNode;
  /** Stagger, in milliseconds. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const { effects } = useConfig();
  const [ref, inView] = useInView<HTMLDivElement>();

  if (!effects.revealAnimations) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      data-reveal={inView ? "in" : ""}
      className={className}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
