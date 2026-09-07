"use client";

import { Check } from "lucide-react";

import {
  newCertification,
  newCustomItem,
  newDegree,
  newExperience,
  newProject,
  newSection,
  newSkill,
  newSocial,
  newStat,
} from "@/config/defaults";
import { applyPreset, FONT_OPTIONS, THEME_PRESETS } from "@/config/presets";
import {
  CURSOR_KINDS,
  HERO_SCENES,
  SECTION_KINDS,
  type SectionKind,
} from "@/config/schema";
import { TECH_ICON_KEYS } from "@/lib/icons";
import { SOCIAL_PLATFORMS } from "@/lib/social";
import { useAdminStore } from "@/lib/store";

import {
  ColorField,
  LinesField,
  ListEditor,
  Panel,
  Row,
  SelectField,
  SliderField,
  TagsField,
  TextAreaField,
  TextField,
  ToggleField,
  UrlField,
} from "./fields";

/* --------------------------------------------------------------- identity */

export function IdentityPanel() {
  return (
    <>
      <Panel
        title="Identity"
        description="Who the site is about. The name is the hero heading and the document title."
      >
        <Row>
          <TextField path="identity.name" label="Full name" />
          <TextField
            path="identity.shortName"
            label="Short name"
            hint="nav logo"
          />
        </Row>
        <TextField
          path="identity.tagline"
          label="Tagline"
          placeholder="One line above the name"
        />
        <TagsField
          path="identity.roles"
          label="Roles"
          hint="cycled by the typewriter"
        />
        <TextAreaField path="identity.bio" label="Bio" rows={4} />
        <Row>
          <TextField path="identity.location" label="Location" />
          <TextField
            path="identity.availabilityText"
            label="Availability label"
          />
        </Row>
        <ToggleField
          path="identity.available"
          label="Show availability"
          hint="Displays the dot and label above the name."
        />
        <UrlField
          path="identity.avatar"
          label="Avatar image URL"
          hint="optional"
        />
      </Panel>

      <Panel title="Contact details" description="Used across the hero, contact section and footer.">
        <Row>
          <TextField path="links.email" label="Email" />
          <TextField path="links.phone" label="Phone" />
        </Row>
        <Row>
          <UrlField path="links.resume" label="Resume link" />
          <TextField path="links.resumeLabel" label="Resume button label" />
        </Row>
        <UrlField path="links.calendar" label="Booking link" hint="optional" />
      </Panel>

      <SocialsPanel />
    </>
  );
}

function SocialsPanel() {
  const socials = useAdminStore((s) => s.config.links.socials);

  return (
    <Panel title="Social links" description="Empty or invalid links hide themselves on the site.">
      <ListEditor
        path="links.socials"
        label="Links"
        items={socials}
        factory={newSocial}
        addLabel="Add link"
        itemTitle={(item) => item.label || item.platform}
        renderItem={(item, index) => (
          <>
            <Row>
              <TextField path={`links.socials.${index}.label`} label="Label" />
              <SelectField
                path={`links.socials.${index}.platform`}
                label="Icon"
                options={SOCIAL_PLATFORMS}
              />
            </Row>
            <UrlField path={`links.socials.${index}.url`} label="URL" />
            <ToggleField
              path={`links.socials.${index}.enabled`}
              label="Show this link"
            />
          </>
        )}
      />
    </Panel>
  );
}

/* ------------------------------------------------------------------ theme */

export function ThemePanel() {
  const theme = useAdminStore((s) => s.config.theme);
  const mutate = useAdminStore((s) => s.mutate);

  return (
    <>
      <Panel
        title="Presets"
        description="A starting point, not a mode. Every value stays editable afterwards."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {THEME_PRESETS.map((preset) => {
            const active = theme.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  mutate((config) => ({
                    ...config,
                    theme: applyPreset(config.theme, preset),
                  }))
                }
                className={`rounded border p-3 text-left transition-colors ${
                  active
                    ? "border-neutral-500 bg-neutral-900"
                    : "border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-neutral-100">
                    {preset.name}
                  </span>
                  {active ? (
                    <Check size={12} className="text-neutral-300" />
                  ) : null}
                </div>
                <p className="mt-1 text-[11px] leading-snug text-neutral-500">
                  {preset.blurb}
                </p>
                <div className="mt-2.5 flex gap-1">
                  {[
                    preset.tokens.bg,
                    preset.tokens.surface,
                    preset.tokens.fg,
                    preset.tokens.primary,
                    preset.tokens.accent,
                  ].map((color, i) => (
                    <span
                      key={i}
                      className="h-3.5 w-3.5 rounded-sm border border-black/40"
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Colours" description="Any CSS colour notation works.">
        <Row>
          <ColorField path="theme.tokens.bg" label="Background" />
          <ColorField path="theme.tokens.fg" label="Text" />
        </Row>
        <Row>
          <ColorField path="theme.tokens.surface" label="Surface" />
          <ColorField path="theme.tokens.surface2" label="Surface (raised)" />
        </Row>
        <Row>
          <ColorField path="theme.tokens.muted" label="Muted text" />
          <ColorField path="theme.tokens.line" label="Borders" />
        </Row>
        <Row>
          <ColorField path="theme.tokens.primary" label="Primary" />
          <ColorField path="theme.tokens.secondary" label="Secondary" />
        </Row>
        <ColorField path="theme.tokens.accent" label="Accent" />
        <SelectField
          path="theme.mode"
          label="Colour scheme"
          options={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
          ]}
          hint="drives form controls"
        />
      </Panel>

      <Panel title="Type" description="Any Google Font family name works.">
        <SelectField
          path="theme.fonts.heading"
          label="Headings"
          options={FONT_OPTIONS}
        />
        <SelectField path="theme.fonts.body" label="Body" options={FONT_OPTIONS} />
        <SelectField
          path="theme.fonts.mono"
          label="Monospace"
          options={FONT_OPTIONS}
          hint="labels and metadata"
        />
      </Panel>

      <Panel title="Shape and density">
        <SliderField
          path="theme.radius"
          label="Corner radius"
          min={0}
          max={40}
          format={(v) => `${v}px`}
        />
        <SelectField
          path="theme.density"
          label="Spacing"
          options={[
            { value: "compact", label: "Compact" },
            { value: "normal", label: "Normal" },
            { value: "spacious", label: "Spacious" },
          ]}
        />
        <SliderField
          path="theme.grain"
          label="Film grain"
          min={0}
          max={1}
          step={0.01}
          format={(v) => (v === 0 ? "off" : v.toFixed(2))}
        />
        <SliderField
          path="theme.glow"
          label="Glow"
          min={0}
          max={1}
          step={0.01}
          format={(v) => (v === 0 ? "off" : v.toFixed(2))}
        />
        <SliderField
          path="theme.gradientAngle"
          label="Gradient angle"
          min={0}
          max={360}
          format={(v) => `${v}°`}
        />
      </Panel>
    </>
  );
}

/* ---------------------------------------------------------------- effects */

export function EffectsPanel() {
  return (
    <>
      <Panel
        title="3D"
        description="The WebGL layer is skipped entirely when it is off, when the browser cannot do WebGL, or when the visitor asks for reduced motion."
      >
        <ToggleField
          path="effects.webgl"
          label="Enable WebGL"
          hint="Turning this off means three.js is never even downloaded."
        />
        <SelectField
          path="effects.heroScene"
          label="Hero scene"
          options={HERO_SCENES}
          hint="dots and grid are the quiet ones"
        />
        <SliderField
          path="effects.intensity"
          label="Intensity"
          min={0}
          max={1}
          step={0.05}
          format={(v) => v.toFixed(2)}
        />
        <ToggleField
          path="effects.shaderText"
          label="Distorted 3D name"
          hint="Draws the hero name on a canvas and warps it on the GPU. Loud."
        />
      </Panel>

      <Panel title="Motion and interaction">
        <SelectField
          path="effects.cursor"
          label="Custom cursor"
          options={CURSOR_KINDS}
          hint="ignored on touch"
        />
        <ToggleField path="effects.tilt" label="Card tilt on hover" />
        <ToggleField path="effects.parallax" label="Pointer parallax" />
        <ToggleField path="effects.revealAnimations" label="Reveal on scroll" />
        <ToggleField path="effects.scrollProgress" label="Scroll progress bar" />
        <ToggleField path="effects.marquee" label="Scrolling tag strip" />
      </Panel>
    </>
  );
}

/* ----------------------------------------------------------------- layout */

const SECTION_KIND_LABELS: Record<SectionKind, string> = {
  hero: "Hero",
  about: "About",
  experience: "Experience",
  skills: "Skills",
  projects: "Projects",
  education: "Education",
  contact: "Contact",
  custom: "Custom",
};

export function LayoutPanel() {
  const sections = useAdminStore((s) => s.config.sections);

  return (
    <>
      <Panel
        title="Sections"
        description="This list is the page. Reorder it to reorder the site; the nav follows automatically."
      >
        <ListEditor
          path="sections"
          label="Page order"
          items={sections}
          factory={() => newSection("custom")}
          addLabel="Add section"
          itemTitle={(item) =>
            `${item.label || item.title || item.kind}${
              item.enabled ? "" : "  (hidden)"
            }`
          }
          renderItem={(item, index) => (
            <>
              <Row>
                <TextField
                  path={`sections.${index}.label`}
                  label="Nav label"
                />
                <SelectField
                  path={`sections.${index}.kind`}
                  label="Type"
                  options={SECTION_KINDS.map((kind) => ({
                    value: kind,
                    label: SECTION_KIND_LABELS[kind],
                  }))}
                />
              </Row>
              <TextField path={`sections.${index}.title`} label="Heading" />
              <TextField
                path={`sections.${index}.subtitle`}
                label="Sub-heading"
              />
              <TextField
                path={`sections.${index}.id`}
                label="Anchor id"
                mono
                hint="used in the URL"
              />
              <ToggleField
                path={`sections.${index}.enabled`}
                label="Show this section"
              />

              {item.kind === "custom" ? (
                <div className="space-y-3 rounded border border-neutral-800 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-neutral-500">
                    Custom content
                  </p>
                  <SelectField
                    path={`sections.${index}.layout`}
                    label="Layout"
                    options={[
                      { value: "prose", label: "Prose list" },
                      { value: "cards", label: "Cards" },
                      { value: "stats", label: "Stats" },
                    ]}
                  />
                  <TextAreaField
                    path={`sections.${index}.body`}
                    label="Body"
                    rows={4}
                  />
                  <ListEditor
                    path={`sections.${index}.items`}
                    label="Items"
                    items={item.items}
                    factory={newCustomItem}
                    addLabel="Add item"
                    itemTitle={(entry) => entry.title}
                    renderItem={(entry, entryIndex) => (
                      <>
                        <TextField
                          path={`sections.${index}.items.${entryIndex}.title`}
                          label="Title"
                        />
                        <Row>
                          <TextField
                            path={`sections.${index}.items.${entryIndex}.meta`}
                            label="Meta"
                            hint="stat value"
                          />
                          <SelectField
                            path={`sections.${index}.items.${entryIndex}.icon`}
                            label="Icon"
                            options={TECH_ICON_KEYS}
                          />
                        </Row>
                        <TextAreaField
                          path={`sections.${index}.items.${entryIndex}.body`}
                          label="Body"
                          rows={3}
                        />
                      </>
                    )}
                  />
                </div>
              ) : null}
            </>
          )}
        />
      </Panel>

      <Panel title="Navigation">
        <SelectField
          path="nav.style"
          label="Style"
          options={[
            { value: "minimal", label: "Minimal" },
            { value: "bar", label: "Bar" },
            { value: "pill", label: "Pill" },
          ]}
        />
        <TextField
          path="nav.logoText"
          label="Logo text"
          hint="blank uses the name"
        />
        <ToggleField path="nav.showLogo" label="Show logo" />
        <ToggleField path="nav.showResume" label="Show resume link" />
        <ToggleField path="nav.blur" label="Blur backdrop when scrolled" />
      </Panel>

      <Panel title="Footer">
        <TextAreaField path="footer.note" label="Note" rows={2} />
        <TextField path="footer.credit" label="Credit line" />
        <ToggleField path="footer.showSocials" label="Show social links" />
        <ToggleField path="footer.showBackToTop" label="Show back-to-top" />
      </Panel>
    </>
  );
}

/* ------------------------------------------------------------------ about */

export function AboutPanel() {
  const stats = useAdminStore((s) => s.config.about.stats);

  return (
    <>
      <Panel title="About">
        <TextAreaField
          path="about.body"
          label="Body"
          rows={6}
          placeholder="Falls back to the bio when empty."
        />
        <LinesField path="about.highlights" label="Highlights" rows={5} />
        <UrlField path="about.image" label="Image URL" hint="optional" />
      </Panel>

      <Panel title="Stats">
        <ListEditor
          path="about.stats"
          label="Figures"
          items={stats}
          factory={newStat}
          addLabel="Add stat"
          itemTitle={(item) => `${item.value} ${item.label}`}
          renderItem={(_, index) => (
            <Row>
              <TextField path={`about.stats.${index}.value`} label="Value" />
              <TextField path={`about.stats.${index}.label`} label="Label" />
            </Row>
          )}
        />
      </Panel>
    </>
  );
}

/* ------------------------------------------------------------- experience */

export function ExperiencePanel() {
  const experience = useAdminStore((s) => s.config.experience);

  return (
    <Panel title="Experience" description="Newest first is conventional.">
      <ListEditor
        path="experience"
        label="Roles"
        items={experience}
        factory={newExperience}
        addLabel="Add role"
        itemTitle={(item) =>
          [item.role, item.company].filter(Boolean).join(" — ")
        }
        renderItem={(_, index) => (
          <>
            <Row>
              <TextField path={`experience.${index}.role`} label="Role" />
              <TextField path={`experience.${index}.company`} label="Company" />
            </Row>
            <Row>
              <TextField path={`experience.${index}.period`} label="Period" />
              <TextField
                path={`experience.${index}.location`}
                label="Location"
              />
            </Row>
            <ToggleField
              path={`experience.${index}.current`}
              label="Current role"
            />
            <TextField path={`experience.${index}.summary`} label="Summary" />
            <LinesField
              path={`experience.${index}.bullets`}
              label="Bullets"
              rows={4}
            />
            <TagsField path={`experience.${index}.tags`} label="Tech" />
            <UrlField
              path={`experience.${index}.url`}
              label="Company URL"
              hint="optional"
            />
          </>
        )}
      />
    </Panel>
  );
}

/* ----------------------------------------------------------------- skills */

export function SkillsPanel() {
  const skills = useAdminStore((s) => s.config.skills);

  const categoryOptions = skills.categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  return (
    <>
      <Panel title="Display">
        <SelectField
          path="skills.display"
          label="Layout"
          options={[
            { value: "chips", label: "Chips" },
            { value: "bars", label: "Level bars" },
            { value: "grid", label: "Icon grid" },
            { value: "cloud", label: "3D cloud" },
          ]}
        />
        <ToggleField
          path="skills.showLevels"
          label="Show proficiency levels"
          hint="Only affects the bars layout."
        />
      </Panel>

      <Panel title="Categories" description="Categories with no skills are hidden.">
        <ListEditor
          path="skills.categories"
          label="Categories"
          items={skills.categories}
          factory={() => ({
            id: `cat-${Math.random().toString(36).slice(2, 7)}`,
            name: "New category",
            emoji: "",
          })}
          addLabel="Add category"
          itemTitle={(item) => item.name}
          renderItem={(_, index) => (
            <Row>
              <TextField
                path={`skills.categories.${index}.name`}
                label="Name"
              />
              <TextField
                path={`skills.categories.${index}.id`}
                label="Id"
                mono
              />
            </Row>
          )}
        />
      </Panel>

      <Panel title="Skills">
        <ListEditor
          path="skills.items"
          label="Skills"
          items={skills.items}
          factory={() => newSkill(skills.categories[0]?.id ?? "other")}
          addLabel="Add skill"
          itemTitle={(item) => `${item.name}  ${item.level}%`}
          renderItem={(_, index) => (
            <>
              <Row>
                <TextField path={`skills.items.${index}.name`} label="Name" />
                <SelectField
                  path={`skills.items.${index}.category`}
                  label="Category"
                  options={categoryOptions}
                />
              </Row>
              <SelectField
                path={`skills.items.${index}.icon`}
                label="Icon"
                options={TECH_ICON_KEYS}
              />
              <SliderField
                path={`skills.items.${index}.level`}
                label="Level"
                min={0}
                max={100}
                format={(v) => `${v}%`}
              />
            </>
          )}
        />
      </Panel>
    </>
  );
}

/* --------------------------------------------------------------- projects */

export function ProjectsPanel() {
  const projects = useAdminStore((s) => s.config.projects.projects);

  return (
    <>
      <Panel title="Display">
        <SelectField
          path="projects.layout"
          label="Layout"
          options={[
            { value: "list", label: "Index list" },
            { value: "grid", label: "Card grid" },
            { value: "showcase", label: "Tabs and detail" },
          ]}
        />
      </Panel>

      <Panel
        title="Projects"
        description="Leave a link blank to hide its button. Leave the image blank for a plain placeholder."
      >
        <ListEditor
          path="projects.projects"
          label="Projects"
          items={projects}
          factory={newProject}
          addLabel="Add project"
          itemTitle={(item) => item.title}
          renderItem={(_, index) => (
            <>
              <TextField
                path={`projects.projects.${index}.title`}
                label="Title"
              />
              <TextField
                path={`projects.projects.${index}.blurb`}
                label="One-liner"
              />
              <TextAreaField
                path={`projects.projects.${index}.description`}
                label="Description"
                rows={5}
              />
              <Row>
                <TextField
                  path={`projects.projects.${index}.year`}
                  label="Year"
                />
                <TextField
                  path={`projects.projects.${index}.role`}
                  label="Your role"
                />
              </Row>
              <TagsField
                path={`projects.projects.${index}.tags`}
                label="Tech"
              />
              <UrlField
                path={`projects.projects.${index}.image`}
                label="Image URL"
              />
              <UrlField
                path={`projects.projects.${index}.links.demo`}
                label="Live demo"
              />
              <UrlField
                path={`projects.projects.${index}.links.code`}
                label="Source"
              />
              <UrlField
                path={`projects.projects.${index}.links.more`}
                label="Write-up"
              />
              <ToggleField
                path={`projects.projects.${index}.featured`}
                label="Featured"
              />
            </>
          )}
        />
      </Panel>
    </>
  );
}

/* -------------------------------------------------------------- education */

export function EducationPanel() {
  const education = useAdminStore((s) => s.config.education);

  return (
    <>
      <Panel title="Qualifications">
        <ListEditor
          path="education.degrees"
          label="Degrees"
          items={education.degrees}
          factory={newDegree}
          addLabel="Add qualification"
          itemTitle={(item) => item.degree}
          renderItem={(_, index) => (
            <>
              <TextField
                path={`education.degrees.${index}.degree`}
                label="Qualification"
              />
              <TextField
                path={`education.degrees.${index}.institution`}
                label="Institution"
              />
              <Row>
                <TextField
                  path={`education.degrees.${index}.period`}
                  label="Period"
                />
                <TextField
                  path={`education.degrees.${index}.grade`}
                  label="Grade"
                />
              </Row>
              <TextAreaField
                path={`education.degrees.${index}.detail`}
                label="Detail"
                rows={3}
              />
            </>
          )}
        />
      </Panel>

      <Panel title="Achievements">
        <LinesField
          path="education.achievements"
          label="Achievements"
          rows={5}
        />
      </Panel>

      <Panel title="Certifications">
        <ListEditor
          path="education.certifications"
          label="Certifications"
          items={education.certifications}
          factory={newCertification}
          addLabel="Add certification"
          itemTitle={(item) => item.name}
          renderItem={(_, index) => (
            <>
              <TextField
                path={`education.certifications.${index}.name`}
                label="Name"
              />
              <Row>
                <TextField
                  path={`education.certifications.${index}.issuer`}
                  label="Issuer"
                />
                <TextField
                  path={`education.certifications.${index}.year`}
                  label="Year"
                />
              </Row>
              <UrlField
                path={`education.certifications.${index}.url`}
                label="URL"
                hint="optional"
              />
            </>
          )}
        />
      </Panel>
    </>
  );
}

/* ---------------------------------------------------------- contact + seo */

export function ContactPanel() {
  return (
    <Panel
      title="Contact"
      description="No form: there is no backend to post one to, and direct links convert better."
    >
      <TextAreaField path="contact.body" label="Body" rows={3} />
      <Row>
        <TextField path="contact.ctaLabel" label="Primary label" />
        <UrlField path="contact.ctaHref" label="Primary link" />
      </Row>
      <Row>
        <TextField path="contact.secondaryLabel" label="Secondary label" />
        <UrlField path="contact.secondaryHref" label="Secondary link" />
      </Row>
    </Panel>
  );
}

export function SeoPanel() {
  return (
    <Panel
      title="Metadata"
      description="Document title, search results and social cards."
    >
      <TextField path="meta.title" label="Site title" />
      <TextField
        path="meta.titleTemplate"
        label="Title template"
        mono
        hint="must contain %s"
      />
      <TextAreaField path="meta.description" label="Description" rows={3} />
      <UrlField path="meta.siteUrl" label="Canonical URL" />
      <UrlField path="meta.ogImage" label="Social image URL" />
      <TagsField path="meta.keywords" label="Keywords" />
      <TextField path="meta.locale" label="Language" mono hint="e.g. en" />
    </Panel>
  );
}
