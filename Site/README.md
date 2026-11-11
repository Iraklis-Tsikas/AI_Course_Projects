# Iraklis Tsikas — Personal Site

A personal website built with **Angular 22** (standalone components, signals, zoneless).
Design direction: _enterprise meets edgy_ — a precise grid, data-viz and mono metadata, set against
oversized type, a signal-orange accent and a few playful details.

## Run it locally

```bash
npm install
npm start
```

Then open http://localhost:4200. `npm start` runs two processes side by side:

- **web** — the Angular dev server on port 4200
- **twin** — the Digital Twin API on port 4300 (Angular proxies `/api` to it; see `proxy.conf.json`)

Production — one Node process serving the built site and the API (honours `PORT`, default 4300):

```bash
npm run serve:prod
```

`npm run build` alone produces static files in `dist/iraklis-tsikas/browser`. They work on any
static host, but the Digital Twin chat needs the Node server (`server/`) running alongside.

## Digital Twin (AI chat)

Visitors can chat with an AI version of you that answers questions about your career, powered by
**Google Gemini** (free tier).

1. Get a free key at https://aistudio.google.com/apikey
2. Put it in `.env` in the project root (see `.env.example`):

   ```
   GEMINI_API_KEY=AIza...
   GEMINI_MODEL=gemini-2.5-flash
   ```

3. Run `npm start`. The twin server restarts by itself when `.env` changes.

How it works:

- The key stays on the server. The browser calls `/api/twin/chat`, and `server/main.ts` forwards the
  conversation to Gemini and streams the reply back (server-sent events).
- The twin only knows what's in `src/app/core/content.ts`. `server/persona.ts` builds its
  instructions from `PROFILE`, `ROLES`, `EDUCATION`, `CERTIFICATIONS`, `CHAPTERS` and the `TWIN`
  block. To teach it something new, add a line to `TWIN.facts` or `TWIN.story`.
- It is told to answer in the first person, stay on career topics, never invent facts, and point
  people to your email for anything it doesn't know.
- Guard rails protect the free quota: 20 messages per visitor per 10 minutes, 12 requests per minute
  overall, and limits on message length and history.
- `GET /api/twin/health` reports whether a key is configured (never the key itself).

## Editing content

Almost everything the site says lives in **`src/app/core/content.ts`**:

| What                    | Where in `content.ts` |
| ----------------------- | --------------------- |
| Name, role, links, email | `PROFILE`            |
| Career roles            | `ROLES`               |
| Degrees                 | `EDUCATION`           |
| Certifications          | `CERTIFICATIONS`      |
| Journey chapter copy    | `CHAPTERS`            |
| Portfolio projects      | `PROJECTS`            |

Durations ("4 yrs 5 mos"), the career map and the stats update automatically from the dates.

### Publishing a portfolio project

Projects that aren't `live` render as "redacted" placeholder cards. To publish one, edit its entry in
`PROJECTS`:

```ts
{
  id: 'p01',
  index: '01',
  title: 'Payments Dashboard',
  category: 'Full-stack · Web',
  summary: 'What it is, what you did, and the outcome.',
  status: 'live',
  tags: ['Angular', 'C#', '.NET'],
  image: 'work/payments.jpg',          // optional — put the file in /public/work
  year: '2026',                        // optional
  links: { live: 'https://…', repo: 'https://github.com/…' },
}
```

Add as many entries as you like; the grid adapts.

### Other files worth knowing

- `public/iraklis-tsikas-cv.pdf` — the downloadable résumé (currently the LinkedIn export).
- `src/styles.scss` — design tokens (colours, fonts, spacing) for dark and light themes.
- `src/app/sections/*` — one folder per page section (hero, about, journey, toolbox, work, contact).

## Features

- AI Digital Twin chat (Gemini), streaming replies, suggested questions, remembers the
  conversation for the browser session
- Terminal-style boot intro (once per session, skipped for reduced motion)
- Interactive career map (Gantt-style) with hover read-out and jump-to-entry
- Command menu — press <kbd>⌘K</kbd> / <kbd>Ctrl K</kbd>
- Dark / light themes, remembered per browser
- Live Athens clock, scroll progress, active-section nav, mobile menu
- Respects `prefers-reduced-motion`; keyboard and screen-reader friendly
- Fonts self-hosted via Fontsource (no external requests)
