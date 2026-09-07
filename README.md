# xFolio

A portfolio that is entirely defined by one JSON file, with an admin center at
`/admin` for editing it — content, layout, theme and 3D effects — and no
backend in production.

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · three.js

```bash
npm install
npm run dev      # http://127.0.0.1:3000
```

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Dev server, bound to localhost                |
| `npm run build`     | Production build                              |
| `npm start`         | Serve the production build                    |
| `npm run typecheck` | `tsc --noEmit`                                |
| `npm run lint`      | ESLint                                        |

## How it works

`data/portfolio.config.json` **is** the site. It is imported statically, so
there is no I/O or fetching at request time and the whole thing can deploy as
static output.

```
data/portfolio.config.json
  → normalizeConfig()            allowlist validation + version migration
  → <SiteConfigProvider>         puts it in context, writes theme CSS vars
  → <Sections>                   renders config.sections in order
```

Two consequences worth knowing:

- **`config.sections` is the page.** Reorder that array and the site reorders,
  nav included. `enabled: false` removes a section from both.
- **The theme is CSS custom properties.** Tailwind's tokens are mapped onto
  them with `@theme inline`, so `bg-surface` and `text-primary` resolve to
  whatever the config currently says. Restyling needs no rebuild.

### Editing

Open `/admin`. Tabs down the left cover identity, theme, effects, layout,
each content section, metadata, and a raw JSON editor. The right pane is a live
preview — a real iframe of `/?draft=1`, updated over postMessage as you type,
so it is the actual site rather than an approximation.

Edits go to a **draft in `localStorage`**, autosaved. Nothing reaches visitors
until you publish. Undo/redo is `Ctrl+Z` / `Ctrl+Shift+Z`; `Ctrl+S` publishes.

### Publishing

**In development** — press **Save to file**. A dev-only route rewrites
`data/portfolio.config.json`, so your edits show up in `git diff`. Commit it.

**In production** — press **Export JSON**, drop the file at
`data/portfolio.config.json`, commit, redeploy. The save route returns 404 in a
production build, which is what keeps the deployed site backend-free.

`Revert` discards the draft and returns to the committed file. `Reset to
template` empties everything back to the blank starting config.

## Deploying

Works as-is on Vercel, Netlify, Cloudflare or any Node host — no environment
variables, no database.

For a fully static export (GitHub Pages, S3), add `output: "export"` to
`next.config.mjs` and delete `src/app/api/` — it is development-only, and route
handlers are not supported in static export.

## On storage, and SQLite

Drafts live in `localStorage` and the published config lives in git. That is a
deliberate trade rather than a limitation to work around:

- SQLite is a filesystem database. On serverless hosts the filesystem is
  read-only and ephemeral, so writes disappear between requests. It only works
  with a persistent volume — which is a backend, and then `/admin` needs real
  authentication.
- SQLite compiled to WASM does run in the browser, but it is still per-browser
  storage. Visitors would not see your edits — the same guarantee
  `localStorage` already gives, plus a megabyte of WASM.
- Committed JSON is versioned, diffable, reviewable and deployable anywhere.

If you later want drafts to follow you across devices, everything storage
touches sits behind the `DraftStore` interface in `src/lib/storage.ts`.
Implement it against a hosted database — **libSQL/Turso** is the natural fit,
since it speaks SQLite over HTTP and needs no server of your own — and swap the
export. Nothing else in the app reads storage directly.

## Security notes

- **Every config URL is sanitised at render time** (`src/lib/url.ts`) against a
  scheme allowlist (http, https, mailto, tel, relative). A `javascript:` URL is
  dropped and its link simply does not render. The admin warns you while typing.
- **All config is rebuilt field by field** by `normalizeConfig`, which drops
  unknown keys, clamps numbers and length-caps strings. Colours and font names
  are additionally validated against character allowlists because they are
  interpolated into a stylesheet.
- **No `dangerouslySetInnerHTML` for content.** Config prose supports
  `**bold**`, `*italic*`, `` `code` `` and `[text](url)`, rendered as React
  elements (`src/lib/text.tsx`), so there is no HTML injection surface.
- **The dev save route** is fenced by: development-only, localhost binding,
  same-origin `Origin` check, JSON content type, a 1 MB body cap, schema
  normalisation before writing, and one hard-coded destination path.
- **`/admin` is unauthenticated on purpose.** In production it only reads and
  writes the visitor's own `localStorage`; there is no shared state and no
  server write path, so a stranger opening it can only edit a private copy.
  **Add real authn/authz the moment a backend appears here.**

## Accessibility and performance

- `prefers-reduced-motion` disables every animation and skips WebGL entirely.
- three.js is a lazy chunk, only fetched when config allows it, the browser
  supports it, and motion is not reduced. The render loop stops when the canvas
  scrolls out of view or the tab is hidden; DPR is clamped.
- Pointer tracking, scroll progress and card tilt write to refs and CSS
  variables inside animation frames, so none of them cause React renders.
- The hero `<h1>` stays in the document even when the WebGL title is drawn over
  it, so semantics and SEO are unaffected. The 3D canvas is `aria-hidden`, and
  the skill cloud exposes an equivalent list to assistive tech.

## Layout

```
data/portfolio.config.json     the entire site
src/config/                    schema, defaults, theme presets, normalisation
src/lib/                       theme vars, URL allowlist, store, hooks, icons
src/components/sections/       hero, about, experience, skills, projects, …
src/components/three/          scenes, canvas-texture shader text, skill cloud
src/components/admin/          the editor, its fields and the live preview
src/app/api/admin/save/        dev-only config writer
```
