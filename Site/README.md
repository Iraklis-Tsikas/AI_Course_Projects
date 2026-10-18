# Iraklis Tsikas — Personal Site

A personal website built with **Angular 22** (standalone components, signals, zoneless).
Design direction: _enterprise meets edgy_ — a precise grid, data-viz and mono metadata, set against
oversized type, a signal-orange accent and a few playful details.

## Run it locally

```bash
npm install
npm start
```

Then open http://localhost:4200.

Production build (output in `dist/iraklis-tsikas/browser`, deployable to any static host):

```bash
npm run build
```

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

- Terminal-style boot intro (once per session, skipped for reduced motion)
- Interactive career map (Gantt-style) with hover read-out and jump-to-entry
- Command menu — press <kbd>⌘K</kbd> / <kbd>Ctrl K</kbd>
- Dark / light themes, remembered per browser
- Live Athens clock, scroll progress, active-section nav, mobile menu
- Respects `prefers-reduced-motion`; keyboard and screen-reader friendly
- Fonts self-hosted via Fontsource (no external requests)
