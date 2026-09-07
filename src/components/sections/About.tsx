"use client";

import { useConfig } from "@/components/ConfigProvider";
import { Reveal } from "@/components/ui/Reveal";
import { RichText } from "@/lib/text";
import { safeUrl } from "@/lib/url";

export function About() {
  const { about, identity } = useConfig();

  const body = about.body || identity.bio;
  const image = safeUrl(about.image, "image");
  const hasStats = about.stats.length > 0;

  if (!body && about.highlights.length === 0 && !hasStats && !image) {
    return null;
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
      <div>
        {body ? (
          <Reveal>
            <RichText
              value={body}
              className="space-y-4 text-base leading-relaxed text-muted sm:text-lg"
            />
          </Reveal>
        ) : null}

        {about.highlights.length > 0 ? (
          <ul className="mt-8 space-y-3">
            {about.highlights.map((highlight, index) => (
              <Reveal key={index} delay={index * 90}>
                <li className="flex items-start gap-3">
                  <span className="mt-[7px] h-px w-4 shrink-0 bg-muted" aria-hidden="true" />
                  <span className="text-sm text-muted sm:text-base">
                    {highlight}
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="space-y-8">
        {image ? (
          <Reveal delay={120}>
            <div className="overflow-hidden rounded-token border border-line">
              {/* A config-supplied remote URL, so this stays a plain <img>
                  rather than next/image with a host allowlist to maintain. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={identity.name}
                loading="lazy"
                decoding="async"
                className="aspect-4/5 w-full object-cover"
              />
            </div>
          </Reveal>
        ) : null}

        {hasStats ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2">
            {about.stats.map((stat, index) => (
              <Reveal key={stat.id} delay={index * 90}>
                <div className="border-t border-line pt-4">
                  <p className="text-2xl font-medium tracking-tight">
                    {stat.value}
                  </p>
                  <p className="eyebrow mt-1 block">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
