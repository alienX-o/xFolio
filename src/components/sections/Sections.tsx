"use client";

import { useConfig } from "@/components/ConfigProvider";
import { SectionHeader } from "@/components/ui/bits";
import type { SectionConfig } from "@/config/schema";

import { About } from "./About";
import { Contact } from "./Contact";
import { Custom } from "./Custom";
import { Education } from "./Education";
import { Experience } from "./Experience";
import { Hero } from "./Hero";
import { Projects } from "./Projects";
import { Skills } from "./Skills";

/**
 * Renders the page from `config.sections`, in order.
 *
 * The array is the page: reordering it in the admin reorders the site, and
 * `enabled: false` removes a section from both the page and the nav. Each kind
 * maps to a component here; anything unknown falls through to Custom, so a
 * config written by a newer build still renders something sensible.
 */

function Body({ section }: { section: SectionConfig }) {
  switch (section.kind) {
    case "hero":
      return <Hero id={section.id} />;
    case "about":
      return <About />;
    case "experience":
      return <Experience />;
    case "skills":
      return <Skills />;
    case "projects":
      return <Projects />;
    case "education":
      return <Education />;
    case "contact":
      return <Contact />;
    default:
      return <Custom section={section} />;
  }
}

export function Sections() {
  const { sections } = useConfig();
  const visible = sections.filter((s) => s.enabled);

  /*
   * Numbering is computed up front rather than incremented inside the map, so
   * nothing is mutated during render. Only content sections are counted, which
   * is why the hero does not consume "01".
   */
  const ordinals = new Map(
    visible
      .filter((section) => section.kind !== "hero")
      .map((section, index) => [
        section.id,
        String(index + 1).padStart(2, "0"),
      ]),
  );

  return (
    <>
      {visible.map((section) => {
        // The hero owns its own full-bleed layout and heading.
        if (section.kind === "hero") {
          return (
            <section key={section.id} id={section.id} aria-label="Introduction">
              <Body section={section} />
            </section>
          );
        }

        return (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={section.title ? `${section.id}-title` : undefined}
            className="scroll-mt-24 py-section"
          >
            <div className="mx-auto max-w-6xl px-6">
              {section.title || section.subtitle ? (
                <div id={`${section.id}-title`}>
                  <SectionHeader
                    title={section.title}
                    subtitle={section.subtitle}
                    index={ordinals.get(section.id)}
                  />
                </div>
              ) : null}
              <Body section={section} />
            </div>
          </section>
        );
      })}
    </>
  );
}
