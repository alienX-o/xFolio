/**
 * Placeholder artwork for projects with no image.
 *
 * The old build pointed every project at `/api/placeholder/600/350`, a route
 * that never existed, so all four cards rendered a broken image. This draws a
 * plain bordered tile with a faint monogram instead: no gradients, no colour,
 * nothing that pretends to be a screenshot. It is a deliberate blank, and it
 * gets out of the way the moment a real image is set.
 */

/** FNV-1a. Stable across runs, so the rotation never jitters between loads. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function monogram(title: string): string {
  const words = title
    .split(/[\s\-_/]+/)
    .map((w) => w.replace(/[^a-z0-9]/gi, ""))
    .filter(Boolean);

  if (words.length === 0) return "—";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0]!}${words[1]![0]!}`.toUpperCase();
}

export function Poster({
  seed,
  title,
  className,
}: {
  seed: string;
  title: string;
  className?: string;
}) {
  const h = hash(seed);
  // A degree or two of rotation, seeded, so a grid of them is not a stencil.
  const tilt = ((h >>> 4) % 5) - 2;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-line bg-surface ${
        className ?? ""
      }`}
      aria-hidden="true"
    >
      <span
        className="select-none font-mono text-2xl tracking-tight text-muted opacity-25"
        style={{ transform: `rotate(${tilt}deg)` }}
      >
        {monogram(title)}
      </span>
    </div>
  );
}
