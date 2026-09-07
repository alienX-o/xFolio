"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useConfig } from "@/components/ConfigProvider";
import type { TextBox } from "@/components/three/ShaderText";
import { ActionLink } from "@/components/ui/bits";
import { useThemeColors } from "@/lib/color";
import {
  useReducedMotion,
  useTypewriter,
  useWebGLSupport,
} from "@/lib/hooks";
import { getSocialIcon } from "@/lib/social";
import { linkProps, mailto } from "@/lib/url";

/**
 * three.js is a large dependency for something decorative, so the WebGL layer
 * is a separate chunk fetched only once we know it is wanted: config allows
 * it, the browser supports it, and the visitor has not asked for reduced
 * motion. Everyone else never downloads it.
 */
const HeroCanvas = dynamic(() => import("@/components/three/HeroCanvas"), {
  ssr: false,
});

/**
 * The hero.
 *
 * Left-aligned, one column, no centred stack and no decorative chrome. The
 * name is set large and plain; everything else is small. The only colour is
 * the availability dot and the accent on links. If the 3D layer is off or
 * unavailable, nothing about the layout changes — there is no fallback
 * ornament, because the design does not depend on one.
 */
export function Hero({ id }: { id: string }) {
  const { identity, links, effects, theme } = useConfig();
  const webgl = useWebGLSupport();
  const reduced = useReducedMotion();

  const colors = useThemeColors(JSON.stringify(theme.tokens));

  const use3D = effects.webgl && webgl === true && !reduced;
  const use3DTitle = use3D && effects.shaderText;

  const role = useTypewriter(identity.roles, {
    enabled: !reduced && identity.roles.length > 1,
  });

  /*
   * The <h1> always exists — it carries semantics, layout and SEO. When the
   * WebGL title is enabled the heading is made invisible and its measured box
   * is handed to the canvas, which draws the distorted version in exactly the
   * same place. Off by default in this design.
   */
  const titleRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [titleBox, setTitleBox] = useState<TextBox | null>(null);

  useLayoutEffect(() => {
    if (!use3DTitle) {
      setTitleBox(null);
      return;
    }

    const measure = () => {
      const title = titleRef.current;
      const section = sectionRef.current;
      if (!title || !section) return;

      const t = title.getBoundingClientRect();
      const s = section.getBoundingClientRect();
      const next = {
        x: t.left - s.left,
        y: t.top - s.top,
        width: t.width,
        height: t.height,
      };

      setTitleBox((prev) =>
        prev &&
        Math.abs(prev.x - next.x) < 0.5 &&
        Math.abs(prev.y - next.y) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.height - next.height) < 0.5
          ? prev
          : next,
      );
    };

    measure();
    // Fonts land after first paint and change the heading width.
    void document.fonts?.ready.then(measure).catch(() => {});

    const observer = new ResizeObserver(measure);
    if (titleRef.current) observer.observe(titleRef.current);
    if (sectionRef.current) observer.observe(sectionRef.current);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [use3DTitle, identity.name]);

  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 40);
    return () => clearTimeout(timer);
  }, []);

  const socials = links.socials
    .filter((s) => s.enabled)
    .map((s) => ({ ...s, props: linkProps(s.url) }))
    .filter((s) => s.props);

  const emailHref = mailto(links.email);

  const step = (index: number) =>
    ({
      opacity: entered ? 1 : 0,
      transform: entered ? "none" : "translateY(8px)",
      transition:
        "opacity .55s cubic-bezier(.16,1,.3,1), transform .55s cubic-bezier(.16,1,.3,1)",
      transitionDelay: `${index * 70}ms`,
    }) as const;

  return (
    <div
      ref={sectionRef}
      className="relative flex min-h-[92svh] items-center overflow-hidden"
    >
      {use3D ? (
        <HeroCanvas
          className="absolute inset-0"
          scene={effects.heroScene}
          intensity={effects.intensity}
          colors={colors}
          title={identity.name}
          showTitle={use3DTitle}
          titleBox={titleBox}
        />
      ) : null}

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 pt-32">
        <div className="max-w-3xl">
          {identity.available && identity.availabilityText ? (
            <p
              className="mb-10 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted"
              style={step(0)}
            >
              <span
                className="h-1.5 w-1.5 rounded-full bg-accent"
                aria-hidden="true"
              />
              {identity.availabilityText}
            </p>
          ) : null}

          <h1
            ref={titleRef}
            className="text-[clamp(2.75rem,7.5vw,5.5rem)] font-medium leading-[1.02] tracking-[-0.04em]"
            style={{
              ...step(1),
              ...(use3DTitle && titleBox
                ? { visibility: "hidden" as const }
                : {}),
            }}
          >
            {identity.name}
          </h1>

          {identity.roles.length > 0 ? (
            <p
              className="mt-6 font-mono text-sm text-muted"
              style={step(2)}
            >
              <span aria-live="polite">{role}</span>
              {!reduced && identity.roles.length > 1 ? (
                <span className="animate-blink ml-0.5">_</span>
              ) : null}
            </p>
          ) : null}

          {identity.bio ? (
            <p
              className="mt-8 max-w-xl text-base leading-relaxed text-muted"
              style={step(3)}
            >
              {identity.bio}
            </p>
          ) : null}

          <div
            className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4"
            style={step(4)}
          >
            <ActionLink href={emailHref} variant="primary" external={false}>
              {identity.available ? "Get in touch" : "Email me"}
            </ActionLink>
            <ActionLink href={links.resume} variant="link">
              {links.resumeLabel || "Resume"}
            </ActionLink>
          </div>

          {socials.length > 0 ? (
            <ul
              className="mt-14 flex items-center gap-5"
              style={step(5)}
            >
              {socials.map((social) => {
                const Icon = getSocialIcon(social.platform);
                return (
                  <li key={social.id}>
                    <a
                      {...social.props!}
                      aria-label={social.label || social.platform}
                      className="block text-muted transition-colors duration-300 hover:text-fg"
                    >
                      <Icon className="h-[17px] w-[17px]" />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>

      {/* Location and a hairline, pinned to the bottom edge of the viewport. */}
      {identity.location ? (
        <div
          className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-6xl px-6"
          style={step(6)}
        >
          <div className="hairline h-px w-full opacity-60" />
          <p className="py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {identity.location}
          </p>
        </div>
      ) : null}
    </div>
  );
}
