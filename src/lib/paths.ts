/**
 * Immutable get/set by dotted path, e.g. "theme.tokens.primary" or
 * "projects.projects.2.links.demo".
 *
 * The admin center has a few hundred editable fields. Giving every one of them
 * a bespoke action would be a lot of near-identical code, so inputs address
 * their slice of the config by path and share one setter. Numeric segments
 * index arrays and keep them arrays.
 */

export function getAtPath(source: unknown, path: string): unknown {
  if (!path) return source;
  let current: unknown = source;
  for (const segment of path.split(".")) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

function setIn(target: unknown, segments: string[], value: unknown): unknown {
  const [head, ...rest] = segments;
  if (head === undefined) return value;

  const index = Number(head);
  const isIndex = Number.isInteger(index) && index >= 0;

  if (Array.isArray(target)) {
    if (!isIndex) return target;
    const next = target.slice();
    next[index] = rest.length ? setIn(target[index], rest, value) : value;
    return next;
  }

  const base =
    typeof target === "object" && target !== null
      ? (target as Record<string, unknown>)
      : {};
  const child = base[head];
  return {
    ...base,
    [head]: rest.length ? setIn(child, rest, value) : value,
  };
}

export function setAtPath<T>(source: T, path: string, value: unknown): T {
  if (!path) return value as T;
  return setIn(source, path.split("."), value) as T;
}

/** Moves an array item, used by the drag-to-reorder rows. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to) return list;
  if (from < 0 || from >= list.length) return list;
  const target = Math.max(0, Math.min(list.length - 1, to));
  const next = list.slice();
  const [item] = next.splice(from, 1);
  if (item === undefined) return list;
  next.splice(target, 0, item);
  return next;
}
