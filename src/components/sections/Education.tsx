"use client";

import { useConfig } from "@/components/ConfigProvider";
import { Reveal } from "@/components/ui/Reveal";
import { linkProps } from "@/lib/url";

/**
 * Education, achievements and certifications as three plain lists.
 *
 * The previous version wrapped each of these in a filled card with blurred
 * colour blooms behind it. Here the structure comes from hairline rules and
 * label/value alignment instead, which is both quieter and easier to scan.
 */
export function Education() {
  const { education } = useConfig();

  const hasAnything =
    education.degrees.length > 0 ||
    education.certifications.length > 0 ||
    education.achievements.length > 0;

  if (!hasAnything) return null;

  return (
    <div className="max-w-3xl space-y-16">
      {education.degrees.length > 0 ? (
        <div className="space-y-8">
          {education.degrees.map((degree, index) => (
            <Reveal key={degree.id} delay={index * 80}>
              <article className="border-t border-line pt-6">
                <div className="eyebrow flex flex-wrap items-center gap-x-3">
                  {degree.period ? <span>{degree.period}</span> : null}
                  {degree.grade ? (
                    <>
                      <span aria-hidden="true">/</span>
                      <span>{degree.grade}</span>
                    </>
                  ) : null}
                </div>

                <h3 className="mt-3 text-lg font-medium tracking-tight">
                  {degree.degree}
                </h3>

                {degree.institution ? (
                  <p className="mt-1 text-sm text-muted">
                    {degree.institution}
                  </p>
                ) : null}

                {degree.detail ? (
                  <p className="mt-3 text-sm text-muted">{degree.detail}</p>
                ) : null}
              </article>
            </Reveal>
          ))}
        </div>
      ) : null}

      {education.achievements.length > 0 ? (
        <Reveal delay={100}>
          <div>
            <h3 className="eyebrow">Achievements</h3>
            <ul className="mt-5 space-y-3">
              {education.achievements.map((achievement, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span
                    className="mt-[9px] h-px w-3 shrink-0 bg-line"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-muted">{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      ) : null}

      {education.certifications.length > 0 ? (
        <Reveal delay={140}>
          <div>
            <h3 className="eyebrow">Certifications</h3>
            <ul className="mt-5">
              {education.certifications.map((cert) => {
                const link = linkProps(cert.url);
                const label = (
                  <>
                    <span className="text-sm text-fg">{cert.name}</span>
                    <span className="font-mono text-[11px] text-muted">
                      {[cert.issuer, cert.year].filter(Boolean).join(" / ")}
                    </span>
                  </>
                );

                return (
                  <li
                    key={cert.id}
                    className="border-b border-line py-3.5 first:border-t"
                  >
                    {link ? (
                      <a
                        {...link}
                        className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 transition-opacity hover:opacity-70"
                      >
                        {label}
                      </a>
                    ) : (
                      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                        {label}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      ) : null}
    </div>
  );
}
