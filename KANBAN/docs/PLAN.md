# Kanban MVP - Implementation Plan

## Context
Greenfield project (only `AGENTS.md` exists). Build a single-board Kanban MVP in Angular under `Frontend/`: 5 fixed, renamable columns, drag-and-drop cards, add/delete cards, dummy data on load, no persistence, no auth. Priority is a polished, professional UI with minimal features. Environment: Node 24.21, npm 11.19, Angular CLI 22.2.

Assumption: the navy color `3032147` in AGENTS.md is a typo for `#032147`.

## Stack (latest, idiomatic)
- Angular 22: standalone components, signals, zoneless change detection, new control flow (`@for`, `@if`), SCSS
- `@angular/cdk` drag-drop (`cdkDropListGroup`, `cdkDropList`, `cdkDrag`) - the standard library for this
- Unit tests: Angular CLI default runner (Vitest) via `ng test`
- E2E: `@playwright/test`, with `webServer` pointing at `ng serve`
- Font: Inter via Google Fonts link in `index.html`

## Structure
```
KANBAN/
  .gitignore              # node_modules, dist, .angular, test-results, playwright-report, .DS_Store
  README.md               # minimal: what it is, how to run/test
  docs/PLAN.md            # this plan with checkboxes, ticked off as phases complete
  Frontend/
    src/styles.scss       # CSS variables for the color scheme, base typography
    src/app/
      board.model.ts      # Card { id, title, details }, Column { id, title, cards }
      board.store.ts      # signal-based service: columns signal + renameColumn, addCard, deleteCard, moveCard
      board.data.ts       # dummy data (5 columns: Backlog, To Do, In Progress, Review, Done; ~10 cards)
      app.ts/.html/.scss  # header + board layout, cdkDropListGroup
      column/column.ts    # column header (inline rename), card list (cdkDropList), add-card form
      card/card.ts        # card display, delete button, cdkDrag
    e2e/board.spec.ts
    playwright.config.ts
```
State lives in one `BoardStore` service using a `signal<Column[]>` with immutable updates; `moveCard` uses CDK's `moveItemInArray` / `transferArrayItem` on copies. No extra abstractions.

## UI/UX
- Clean light canvas, navy `#032147` headings, gray `#888888` labels/counts
- Yellow `#ecad0a` accent line under the header and on column top borders
- Blue `#209dd7` for focus rings / key highlights; purple `#753991` for the "Add card" submit button
- Cards: white, soft shadow, rounded, hover lift; drag preview with elevated shadow, placeholder as dashed slot; smooth CDK animations
- Column title: click to edit inline, Enter/blur saves, Escape cancels; card count badge
- Add card: "+ Add card" ghost button expands into title + optional details inputs; Escape cancels
- Delete: subtle icon button on card hover (always visible for keyboard focus)
- Columns flex to fit (all five visible at 1280px+), size to their content, horizontal scroll on narrow screens

## Phases and success criteria

### Phase 1 - Scaffolding
- [x] `ng new Frontend --style=scss --ssr=false --zoneless` (non-interactive, skip git) created
- [x] `@angular/cdk` and `@playwright/test` installed; Playwright chromium installed
- [x] Root `.gitignore`, minimal `README.md`, `docs/PLAN.md` written
- [x] `git init` at root; `ng build` and `ng test` pass on the scaffold

### Phase 2 - Model, store, dummy data (unit tested)
- [x] `BoardStore` exposes `columns` signal seeded with 5 columns of dummy data
- [x] Unit tests: renameColumn (incl. trimming, empty title ignored), addCard (appended, unique id, empty title ignored), deleteCard, moveCard within a column and across columns
- [x] All tests pass

### Phase 3 - Components and UI
- [x] Card, Column, App components implemented with drag-drop, rename, add, delete
- [x] Component unit tests: board renders 5 columns + dummy cards; rename via UI updates header; add-card form adds card; delete removes card
- [x] Styling matches color scheme and the UI/UX notes above; no console errors
- [x] `ng build` passes with no warnings over budget

### Phase 4 - Integration testing (Playwright)
- [x] E2E covers: initial load with dummy data; rename column (Enter saves, Escape cancels); add card; delete card; drag card to another column; reorder within a column
- [x] All E2E tests pass; defects found are fixed and re-tested
- [x] Visual check via screenshot in the browser pane at desktop and narrow widths

### Phase 5 - Handoff
- [x] All `docs/PLAN.md` boxes ticked
- [x] `ng serve` running at http://localhost:4200 for the user

## Verification
- `cd Frontend && npx ng test --watch=false` - all unit tests green
- `cd Frontend && npx playwright test` - all E2E green
- `npx ng serve` and open http://localhost:4200 in the built-in browser; manually drag, rename, add, delete
