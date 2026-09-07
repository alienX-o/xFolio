"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { useConfig } from "@/components/ConfigProvider";
import { Reveal } from "@/components/ui/Reveal";
import { useThemeColors } from "@/lib/color";
import { useInView, useReducedMotion, useWebGLSupport } from "@/lib/hooks";
import { getTechIcon } from "@/lib/icons";
import type { Skill } from "@/config/schema";

const SkillCloudCanvas = dynamic(
  () => import("@/components/three/SkillCloudCanvas"),
  { ssr: false },
);

const ALL = "all";

/** One skill row with a level bar that fills when it scrolls into view. */
function SkillBar({ skill, index }: { skill: Skill; index: number }) {
  const { skills } = useConfig();
  const [ref, inView] = useInView<HTMLDivElement>();
  const Icon = getTechIcon(skill.icon);

  return (
    <div
      ref={ref}
      className="group border-t border-line pt-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 text-sm font-normal">
          {Icon ? (
            <Icon className="h-4 w-4 shrink-0 text-muted transition-colors duration-300 group-hover:text-fg" />
          ) : null}
          <span>{skill.name}</span>
        </h3>
        {skills.showLevels ? (
          <span className="font-mono text-xs text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {skill.level}%
          </span>
        ) : null}
      </div>

      {skills.showLevels ? (
        <div className="mt-4 h-px overflow-hidden bg-line">
          <div
            className="h-full bg-fg"
            style={{
              width: inView ? `${skill.level}%` : "0%",
              transition: "width 1.1s cubic-bezier(.16,1,.3,1)",
              transitionDelay: `${index * 60}ms`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function SkillTile({ skill, index }: { skill: Skill; index: number }) {
  const Icon = getTechIcon(skill.icon);

  return (
    <Reveal delay={index * 40}>
      <div className="group flex flex-col items-center gap-3 border border-line bg-bg p-5 text-center transition-colors duration-300 hover:border-fg">
        {Icon ? (
          <Icon className="h-6 w-6 text-muted transition-colors duration-300 group-hover:text-fg" />
        ) : null}
        <span className="text-sm font-medium">{skill.name}</span>
      </div>
    </Reveal>
  );
}

export function Skills() {
  const { skills, effects, theme } = useConfig();
  const [active, setActive] = useState(ALL);
  const webgl = useWebGLSupport();
  const reduced = useReducedMotion();
  const colors = useThemeColors(JSON.stringify(theme.tokens));

  // Only offer categories that actually contain something.
  const categories = useMemo(
    () =>
      skills.categories.filter((category) =>
        skills.items.some((item) => item.category === category.id),
      ),
    [skills.categories, skills.items],
  );

  const filtered = useMemo(
    () =>
      active === ALL
        ? skills.items
        : skills.items.filter((item) => item.category === active),
    [skills.items, active],
  );

  if (skills.items.length === 0) return null;

  const cloudReady =
    skills.display === "cloud" && effects.webgl && webgl === true && !reduced;

  return (
    <div>
      {categories.length > 1 ? (
        <Reveal>
          <div
            className="mb-10 flex flex-wrap gap-x-6 gap-y-2"
            role="tablist"
            aria-label="Skill categories"
          >
            {[{ id: ALL, name: "All", emoji: "" }, ...categories].map(
              (category) => {
                const isActive = active === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(category.id)}
                    className={`font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-300 ${
                      isActive ? "text-fg" : "text-muted hover:text-fg"
                    }`}
                  >
                    {category.emoji ? (
                      <span className="mr-1.5" aria-hidden="true">
                        {category.emoji}
                      </span>
                    ) : null}
                    {category.name}
                  </button>
                );
              },
            )}
          </div>
        </Reveal>
      ) : null}

      {cloudReady ? (
        <div className="relative">
          <SkillCloudCanvas
            className="h-[420px] w-full sm:h-[520px]"
            labels={filtered.map((s) => s.name)}
            intensity={effects.intensity}
            colors={colors}
          />
          {/* The canvas is aria-hidden, so the same list is exposed here for
              assistive tech and for anyone without WebGL. */}
          <ul className="sr-only">
            {filtered.map((skill) => (
              <li key={skill.id}>
                {skill.name} — {skill.level}%
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {skills.display === "bars" ? (
        <div className="grid max-w-3xl gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((skill, index) => (
            <Reveal key={skill.id} delay={Math.min(index, 12) * 50}>
              <SkillBar skill={skill} index={index} />
            </Reveal>
          ))}
        </div>
      ) : null}

      {skills.display === "grid" ? (
        <div className="grid max-w-4xl grid-cols-2 gap-px bg-line sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((skill, index) => (
            <SkillTile key={skill.id} skill={skill} index={index} />
          ))}
        </div>
      ) : null}

      {skills.display === "chips" || (skills.display === "cloud" && !cloudReady) ? (
        <Reveal>
          <div className="flex max-w-3xl flex-wrap gap-2">
            {filtered.map((skill) => {
              const Icon = getTechIcon(skill.icon);
              return (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-2 rounded-token-sm border border-line px-3 py-1.5 text-sm text-muted transition-colors duration-300 hover:border-fg hover:text-fg"
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  {skill.name}
                </span>
              );
            })}
          </div>
        </Reveal>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted">
          Nothing in this category yet.
        </p>
      ) : null}
    </div>
  );
}
