import { promises as fs } from "node:fs";
import path from "node:path";

import { DEFAULT_CONFIG } from "@/config/defaults";
import { looksLikeConfig, normalizeConfig } from "@/config/normalize";

/**
 * Dev-only endpoint that writes the config file back to disk.
 *
 * This exists purely so that editing in the admin center while running
 * `npm run dev` feels immediate: press Save and the committed file changes, so
 * the next reload — and the next git diff — reflects your edits. In a
 * production build it does not function at all, and the admin falls back to
 * downloading the JSON for you to commit yourself. That is what keeps the
 * deployed site backend-free.
 *
 * It is unauthenticated, which is only acceptable because of how tightly it is
 * fenced in:
 *
 *  - returns 404 unless NODE_ENV is development, so it is inert once built;
 *  - `npm run dev` binds to 127.0.0.1, so it is not exposed to the network;
 *  - requires a same-origin Origin header, blocking drive-by requests from
 *    another site in the developer's browser;
 *  - requires a JSON content type, which a simple HTML form cannot send, so
 *    it cannot be driven by a cross-site form post;
 *  - caps the body size, and rebuilds the payload through normalizeConfig
 *    before writing, so only known fields with valid values reach the file;
 *  - writes one hard-coded path. No part of the request influences the
 *    destination, so there is no traversal surface.
 *
 * If a real database or hosted admin is ever added here, none of the above is
 * sufficient any more and the route needs genuine authentication.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One megabyte is far more than a config; anything larger is not one. */
const MAX_BYTES = 1_000_000;

/** Forward slashes: this string is shown to the user, not used to open. */
const RELATIVE_TARGET = "data/portfolio.config.json";

const isDev = () => process.env.NODE_ENV === "development";

/** Short id so a client-visible error can be matched to a server log line. */
const correlationId = () => Math.random().toString(36).slice(2, 10);

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const notFound = () =>
  new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });

export async function POST(request: Request) {
  if (!isDev()) return notFound();

  const cid = correlationId();

  // Same-origin only. A cross-site fetch cannot forge Origin, and requests
  // without one (curl, a REST client on the machine itself) are allowed
  // through since they are not the browser-driven case this protects against.
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("host");
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    if (!originHost || !host || originHost !== host) {
      console.warn(`[admin/save ${cid}] rejected cross-origin request`);
      return json({ error: "Cross-origin requests are not allowed." }, 403);
    }
  }

  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    return json({ error: "Expected a JSON body." }, 415);
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    return json({ error: "That payload is too large to be a config." }, 413);
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return json({ error: "Could not read the request body." }, 400);
  }

  // Re-check after reading, in case content-length was absent or lying.
  if (raw.length > MAX_BYTES) {
    return json({ error: "That payload is too large to be a config." }, 413);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return json({ error: "The body was not valid JSON." }, 400);
  }

  if (!looksLikeConfig(parsed)) {
    return json({ error: "That does not look like a portfolio config." }, 422);
  }

  // The file is only ever written from a normalised object, so a hand-crafted
  // request cannot smuggle unknown keys or invalid values into the repo.
  const config = normalizeConfig(parsed, DEFAULT_CONFIG);
  const target = path.join(process.cwd(), "data", "portfolio.config.json");
  const temp = `${target}.${process.pid}.tmp`;

  try {
    await fs.mkdir(path.dirname(target), { recursive: true });
    // Write-then-rename, so an interrupted save cannot leave a half-written
    // config that the next build would fail to parse.
    await fs.writeFile(temp, `${JSON.stringify(config, null, 2)}\n`, "utf8");
    await fs.rename(temp, target);
  } catch (error) {
    // Details stay on the server; the client gets the id to quote.
    console.error(`[admin/save ${cid}] write failed:`, error);
    await fs.rm(temp, { force: true }).catch(() => {});
    return json(
      { error: `Could not write the config file. Reference ${cid}.` },
      500,
    );
  }

  console.log(
    `[admin/save ${cid}] wrote ${RELATIVE_TARGET} at ${new Date().toISOString()}`,
  );

  return json({ ok: true, path: RELATIVE_TARGET, id: cid }, 200);
}

/** Anything other than POST, in any environment, is simply not here. */
export async function GET() {
  return notFound();
}
