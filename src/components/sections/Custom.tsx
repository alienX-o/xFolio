"use client";

import { Sparkles } from "lucide-react";

import { Reveal } from "@/components/ui/Reveal";
import type { SectionConfig } from "@/config/schema";
import { getTechIcon } from "@/lib/icons";
import { RichText } from "@/lib/text";

/**
 * A section the config invented.
 *
 * This is what makes "add anything" real: the admin can create a section that
 * was never designed for, give it a heading, prose and a list of items, and
 * choose one of three layouts. It renders as a first-class part of the page and
 * appears in the nav like any other section.
 */
export function Custom({ section }: { section: SectionConfig }) {
  const hasItems = section.items.length > 0;

  if (!section.body && !hasItems) return null;

  return (
    <div className="mx-auto max-w-4xl">
      {section.body ? (
        <Reveal>
          <RichText
            value={section.body}
            className={`space-y-4 text-base text-muted sm:text-lg ${
              section.layout === "prose" ? "mx-auto max-w-2xl" : ""
            }`}
          />
        </Reveal>
      ) : null}

      {hasItems && section.layout === "stats" ? (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {section.items.map((item, index) => (
            <Reveal key={item.id} delay={index * 80}>
              <div className="border-t border-line pt-4">
                <p className="text-2xl font-medium tracking-tight">
                  {item.meta || "—"}
                </p>
                <p className="eyebrow mt-1 block">{item.title}</p>
              </div>
            </Reveal>
          ))}
        </div>
      ) : null}

      {hasItems && section.layout === "cards" ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {section.items.map((item, index) => {
            const Icon = getTechIcon(item.icon);
            return (
              <Reveal key={item.id} delay={index * 80}>
                <article className="h-full border border-line p-6 transition-colors duration-300 hover:border-fg">
                  <span className="block text-muted">
                    {Icon ? (
                      <Icon className="h-5 w-5" />
                    ) : (
                      <Sparkles size={17} />
                    )}
                  </span>
                  <h3 className="mt-4 font-medium tracking-tight">
                    {item.title}
                  </h3>
                  {item.meta ? (
                    <p className="eyebrow mt-1 block">{item.meta}</p>
                  ) : null}
                  {item.body ? (
                    <RichText
                      value={item.body}
                      className="mt-3 space-y-2 text-sm text-muted"
                    />
                  ) : null}
                </article>
              </Reveal>
            );
          })}
        </div>
      ) : null}

      {hasItems && section.layout === "prose" ? (
        <ul className="mt-10 space-y-6">
          {section.items.map((item, index) => (
            <Reveal key={item.id} delay={index * 70}>
              <li className="border-l border-line pl-5 transition-colors hover:border-fg">
                <div className="flex flex-wrap items-baseline gap-3">
                  <h3 className="font-medium tracking-tight">{item.title}</h3>
                  {item.meta ? (
                    <span className="font-mono text-xs text-muted">
                      {item.meta}
                    </span>
                  ) : null}
                </div>
                {item.body ? (
                  <RichText
                    value={item.body}
                    className="mt-2 space-y-2 text-sm text-muted"
                  />
                ) : null}
              </li>
            </Reveal>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
