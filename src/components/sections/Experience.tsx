"use client";

import { useConfig } from "@/components/ConfigProvider";
import { Chip } from "@/components/ui/bits";
import { Reveal } from "@/components/ui/Reveal";
import { linkProps } from "@/lib/url";

/**
 * Experience timeline.
 *
 * The rail sits on the left at every breakpoint rather than alternating sides
 * on desktop. The old alternating version put half the cards on the right of
 * the line, which reads as two unrelated columns while you scan dates, and its
 * node markers stacked two conflicting translate utilities so they never
 * landed on the rail at all.
 */
export function Experience() {
  const { experience } = useConfig();

  if (experience.length === 0) return null;

  return (
    <div className="relative max-w-3xl">
      {/* A single hairline rail, no gradient. */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 top-2 w-px bg-line"
      />

      <ol className="space-y-12">
        {experience.map((item, index) => {
          const link = linkProps(item.url);

          return (
            <li key={item.id} className="relative pl-8">
              {/* Node: a small square on the rail, filled when current. */}
              <span
                aria-hidden="true"
                className={`absolute -left-[3px] top-[9px] h-[7px] w-[7px] ${
                  item.current ? "bg-accent" : "bg-line"
                }`}
              />

              <Reveal delay={index * 100}>
                <article className="pb-2">
                  <div className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
                    {item.period ? <span>{item.period}</span> : null}
                    {item.location ? (
                      <>
                        <span aria-hidden="true">/</span>
                        <span>{item.location}</span>
                      </>
                    ) : null}
                    {item.current ? (
                      <>
                        <span aria-hidden="true">/</span>
                        <span className="text-accent">Current</span>
                      </>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-lg font-medium tracking-tight">
                    {item.role}
                    {item.company ? (
                      <span className="text-muted">
                        {" — "}
                        {link ? (
                          <a {...link} className="link-underline">
                            {item.company}
                          </a>
                        ) : (
                          item.company
                        )}
                      </span>
                    ) : null}
                  </h3>

                  {item.summary ? (
                    <p className="mt-3 max-w-2xl text-sm text-muted">
                      {item.summary}
                    </p>
                  ) : null}

                  {item.bullets.length > 0 ? (
                    <ul className="mt-4 max-w-2xl space-y-2">
                      {item.bullets.map((bullet, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-muted"
                        >
                          <span
                            className="mt-[9px] h-px w-3 shrink-0 bg-line"
                            aria-hidden="true"
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {item.tags.length > 0 ? (
                    <>
                      <div className="mt-5 flex flex-wrap gap-1.5">
                        {item.tags.map((tag) => (
                          <Chip key={tag}>{tag}</Chip>
                        ))}
                      </div>
                    </>
                  ) : null}
                </article>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
