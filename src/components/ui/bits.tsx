"use client";

import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

import { useConfig } from "@/components/ConfigProvider";
import { linkProps } from "@/lib/url";
import { Reveal } from "./Reveal";

/**
 * Section heading.
 *
 * A small monospace index label above a plain heading, with a hairline rule
 * running to the edge. Hierarchy comes from size, weight and space rather than
 * from colour — no gradient fill, which is what made the previous version read
 * as a template.
 */
export function SectionHeader({
  title,
  subtitle,
  index,
}: {
  title: string;
  subtitle?: string;
  /** Optional ordinal, rendered as the eyebrow label. */
  index?: string;
}) {
  if (!title && !subtitle) return null;

  return (
    <Reveal className="mb-14">
      <div className="flex items-baseline gap-4">
        {index ? <span className="eyebrow shrink-0">{index}</span> : null}
        <div className="hairline h-px flex-1 opacity-60" />
      </div>
      {title ? (
        <h2 className="mt-5 text-2xl font-medium tracking-tight sm:text-3xl">
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p className="mt-2 max-w-xl text-sm text-muted">{subtitle}</p>
      ) : null}
    </Reveal>
  );
}

/** Tech tag. Flat, bordered, no fill. */
export function Chip({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "primary";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-token-sm border px-2.5 py-1 font-mono text-[11px] transition-colors ${
        tone === "primary"
          ? "border-accent/40 text-accent"
          : "border-line text-muted"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * Link built from a config URL. Renders nothing when the URL is missing or
 * unsafe, so an empty field hides its own button rather than shipping a dead
 * `href="#"` the way the previous version did.
 *
 * `primary` is a solid button, used once or twice per page at most. Everything
 * else is a text link with a rule that draws in on hover.
 */
export function ActionLink({
  href,
  children,
  variant = "link",
  icon,
  external,
}: {
  href: string | undefined | null;
  children: ReactNode;
  variant?: "primary" | "outline" | "link";
  icon?: ReactNode;
  external?: boolean;
}) {
  const props = linkProps(href);
  if (!props) return null;

  const showArrow = external ?? props.target === "_blank";

  if (variant === "link") {
    return (
      <a
        {...props}
        className="link-underline group inline-flex items-center gap-1.5 text-sm text-fg"
      >
        {icon}
        <span>{children}</span>
        {showArrow ? (
          <ArrowUpRight
            size={13}
            className="text-muted transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px"
          />
        ) : null}
      </a>
    );
  }

  const styles =
    variant === "primary"
      ? "bg-fg text-bg hover:opacity-85"
      : "border border-line text-fg hover:border-fg";

  return (
    <a
      {...props}
      className={`inline-flex items-center gap-2 rounded-token px-4 py-2 text-sm transition-all duration-300 ${styles}`}
    >
      {icon}
      <span>{children}</span>
      {showArrow ? <ArrowUpRight size={13} className="opacity-60" /> : null}
    </a>
  );
}

/**
 * Infinite tag strip. Off by default in the minimal design; the list is
 * rendered twice and translated by half its width so the loop is seamless.
 */
export function Marquee({
  items,
  speed = 40,
}: {
  items: string[];
  speed?: number;
}) {
  const { effects } = useConfig();
  if (items.length === 0) return null;

  if (!effects.marquee) {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Chip key={item}>{item}</Chip>
        ))}
      </div>
    );
  }

  const doubled = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden py-2"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div
        className="animate-marquee flex w-max gap-2.5"
        style={{ ["--marquee-duration" as string]: `${speed}s` }}
      >
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="whitespace-nowrap rounded-token-sm border border-line px-3 py-1 font-mono text-[11px] text-muted"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Hairline({ className }: { className?: string }) {
  return <div className={`hairline h-px w-full ${className ?? ""}`} />;
}
