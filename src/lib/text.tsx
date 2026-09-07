import type { ReactNode } from "react";

import { linkProps } from "./url";

/**
 * A tiny inline-markup renderer for config prose.
 *
 * Bios, project write-ups and custom sections benefit from a little emphasis
 * and the odd link, but the text comes from a JSON file that may have been
 * imported from elsewhere. Rather than reach for dangerouslySetInnerHTML and
 * then have to sanitise HTML, this builds React elements directly: the only
 * markup that can ever exist is the four elements below, and link targets go
 * through the same URL allowlist as everything else. React escapes the text
 * nodes, so there is no injection surface at all.
 *
 * Supported: **bold**, *italic*, `code`, [label](url). Blank lines split
 * paragraphs; single newlines become line breaks.
 */

const INLINE =
  /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\))/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const parts = text.split(INLINE);

  parts.forEach((part, index) => {
    if (!part) return;
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      nodes.push(
        <strong key={key} className="font-semibold text-fg">
          {part.slice(2, -2)}
        </strong>,
      );
      return;
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[0.9em] text-fg"
        >
          {part.slice(1, -1)}
        </code>,
      );
      return;
    }

    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const [, label = "", href = ""] = link;
      const props = linkProps(href);
      if (props) {
        nodes.push(
          <a
            key={key}
            {...props}
            className="text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary"
          >
            {label}
          </a>,
        );
      } else {
        // Unsafe or unparseable target: keep the words, drop the link.
        nodes.push(label);
      }
      return;
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      nodes.push(<em key={key}>{part.slice(1, -1)}</em>);
      return;
    }

    nodes.push(part);
  });

  return nodes;
}

/** Renders a multi-paragraph string. */
export function RichText({
  value,
  className,
  paragraphClassName,
}: {
  value: string;
  className?: string;
  paragraphClassName?: string;
}) {
  const blocks = value
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) return null;

  return (
    <div className={className}>
      {blocks.map((block, blockIndex) => (
        <p key={blockIndex} className={paragraphClassName}>
          {block.split("\n").map((line, lineIndex) => (
            <span key={lineIndex}>
              {lineIndex > 0 ? <br /> : null}
              {renderInline(line, `${blockIndex}-${lineIndex}`)}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

/** Single-line variant, for list items and captions. */
export function InlineText({ value }: { value: string }) {
  return <>{renderInline(value, "i")}</>;
}
