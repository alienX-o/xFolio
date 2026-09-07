"use client";

import { useState } from "react";

import { useConfig } from "@/components/ConfigProvider";
import { Poster } from "@/components/ui/Poster";
import { Tilt } from "@/components/ui/Tilt";
import { ActionLink, Chip } from "@/components/ui/bits";
import { Reveal } from "@/components/ui/Reveal";
import type { Project } from "@/config/schema";
import { RichText } from "@/lib/text";
import { safeUrl } from "@/lib/url";

/**
 * Three layouts, all flat: `list` (the default — an index of work, type only),
 * `grid` (bordered cards) and `showcase` (a tab list beside a detail panel).
 */

function Artwork({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  const image = safeUrl(project.image, "image");

  if (!image) {
    return (
      <Poster seed={project.id} title={project.title} className={className} />
    );
  }

  return (
    /* Config-supplied remote URL, so a plain <img> rather than next/image
       with a per-host allowlist to keep in sync. */
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={image}
      alt={project.title}
      loading="lazy"
      decoding="async"
      className={`object-cover ${className ?? ""}`}
    />
  );
}

function ProjectLinks({ project }: { project: Project }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <ActionLink href={project.links.demo} variant="link">
        Live
      </ActionLink>
      <ActionLink href={project.links.code} variant="link">
        Source
      </ActionLink>
      <ActionLink href={project.links.more} variant="link">
        Write-up
      </ActionLink>
    </div>
  );
}

/* ------------------------------------------------------------------- list */

/**
 * The default: a numbered index. No imagery, generous vertical space, and the
 * description present rather than hidden behind an interaction.
 */
function List({ projects }: { projects: Project[] }) {
  return (
    <ol className="max-w-3xl">
      {projects.map((project, index) => (
        <li key={project.id} className="border-t border-line last:border-b">
          <Reveal delay={index * 70}>
            <article className="py-8">
              <div className="flex items-baseline justify-between gap-6">
                <div className="eyebrow flex items-center gap-3">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {project.year ? (
                    <>
                      <span aria-hidden="true">/</span>
                      <span>{project.year}</span>
                    </>
                  ) : null}
                  {project.role ? (
                    <>
                      <span aria-hidden="true">/</span>
                      <span>{project.role}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <h3 className="mt-3 text-xl font-medium tracking-tight sm:text-2xl">
                {project.title}
              </h3>

              {project.description || project.blurb ? (
                <RichText
                  value={project.description || project.blurb}
                  className="mt-3 max-w-2xl space-y-3 text-sm text-muted"
                />
              ) : null}

              {project.tags.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <Chip key={tag}>{tag}</Chip>
                  ))}
                </div>
              ) : null}

              <div className="mt-5">
                <ProjectLinks project={project} />
              </div>
            </article>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------- grid */

function Grid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <Reveal key={project.id} delay={index * 70}>
          <Tilt strength={4} glare={false}>
            <article className="flex h-full flex-col bg-bg p-6">
              <Artwork project={project} className="mb-6 h-32 w-full" />

              <div className="eyebrow flex items-center gap-3">
                {project.year ? <span>{project.year}</span> : null}
              </div>

              <h3 className="mt-2 font-medium tracking-tight">
                {project.title}
              </h3>

              {project.blurb ? (
                <p className="mt-2 flex-1 text-sm text-muted">
                  {project.blurb}
                </p>
              ) : (
                <div className="flex-1" />
              )}

              {project.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.tags.slice(0, 4).map((tag) => (
                    <Chip key={tag}>{tag}</Chip>
                  ))}
                </div>
              ) : null}

              <div className="mt-5">
                <ProjectLinks project={project} />
              </div>
            </article>
          </Tilt>
        </Reveal>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- showcase */

/**
 * Tab list beside a detail panel. Proper tab semantics, so unlike the previous
 * implementation the list is keyboard navigable and assistive tech understands
 * that choosing a project swaps the panel.
 */
function Showcase({ projects }: { projects: Project[] }) {
  // Store only what the user asked for, and derive the rest. Projects are
  // added and removed constantly while editing in the admin preview, and an
  // effect that repaired a stale stored id would render one bad frame first.
  // Falling back to the first project makes an invalid selection impossible.
  const [requestedId, setRequestedId] = useState<string | null>(null);

  const active =
    projects.find((project) => project.id === requestedId) ?? projects[0];
  if (!active) return null;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:gap-16">
      <div
        role="tablist"
        aria-label="Projects"
        aria-orientation="vertical"
        className="lg:sticky lg:top-28 lg:self-start"
      >
        {projects.map((project) => {
          const isActive = project.id === active.id;
          return (
            <button
              key={project.id}
              type="button"
              role="tab"
              id={`project-tab-${project.id}`}
              aria-selected={isActive}
              aria-controls={`project-panel-${project.id}`}
              onClick={() => setRequestedId(project.id)}
              className={`block w-full border-t border-line py-3 text-left text-sm transition-colors last:border-b ${
                isActive ? "text-fg" : "text-muted hover:text-fg"
              }`}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span>{project.title}</span>
                {isActive ? (
                  <span className="h-px w-4 shrink-0 self-center bg-fg" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`project-panel-${active.id}`}
        aria-labelledby={`project-tab-${active.id}`}
        // Remounts on change so the entrance transition replays.
        key={active.id}
      >
        <Reveal>
          <article>
            <div className="eyebrow flex flex-wrap items-center gap-x-3">
              {active.year ? <span>{active.year}</span> : null}
              {active.role ? (
                <>
                  <span aria-hidden="true">/</span>
                  <span>{active.role}</span>
                </>
              ) : null}
            </div>

            <h3 className="mt-3 text-2xl font-medium tracking-tight">
              {active.title}
            </h3>

            {active.description || active.blurb ? (
              <RichText
                value={active.description || active.blurb}
                className="mt-4 max-w-2xl space-y-3 text-sm text-muted"
              />
            ) : null}

            <Artwork
              project={active}
              className="mt-8 h-56 w-full rounded-token sm:h-72"
            />

            {active.tags.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-1.5">
                {active.tags.map((tag) => (
                  <Chip key={tag}>{tag}</Chip>
                ))}
              </div>
            ) : null}

            <div className="mt-6">
              <ProjectLinks project={active} />
            </div>
          </article>
        </Reveal>
      </div>
    </div>
  );
}

export function Projects() {
  const { projects } = useConfig();
  const items = projects.projects;

  if (items.length === 0) return null;

  if (projects.layout === "grid") return <Grid projects={items} />;
  if (projects.layout === "showcase") return <Showcase projects={items} />;
  return <List projects={items} />;
}
