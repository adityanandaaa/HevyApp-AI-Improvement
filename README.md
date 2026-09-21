# AI Training Coach (prototype)

Independent design-for-one concept. Not affiliated with Hevy. Owner: Aditya Nanda Tri Prakoso.

A clickable, phone-sized prototype of a coaching feature inside the Hevy workout
tracker, built for one person (Aditya) using mock data only. See `HANDOFF.md` for
the full brief, `docs/AI_Training_Coach_PRD.docx` for the build spec, and
`docs/AI_Training_Coach_Product_Discovery_v2.md` for the reasoning behind it.

## Run it

No build step. The app is plain HTML, CSS and JavaScript, served as-is by a small
static dev server so it can also be opened from a phone on the same local network.

```
npm install
npm run dev
```

Then open the printed `http://localhost:5173` URL (or `http://<your-computer's-LAN-IP>:5173`
from a phone on the same network).

## Checks

```
npm run lint        # ESLint
npm run typecheck    # tsc, checking JSDoc types in the .js source
npm test             # Vitest
```

## Project structure

```
index.html            phone frame + dev toolbar shell, entry point
src/
  ui/
    tokens.css         design tokens (section 10 of HANDOFF.md)
    layout.css          phone frame and dev toolbar layout
    components/         (added from M1)
    screens/             (added from M1)
    devtoolbar/           (added from M1)
  domain/                pure JS, no DOM, unit tested (added from M2)
  reasoning/               scripted reasoning provider (added from M2)
  data/                     mock data, all marked MOCK (added from M2)
  state/                     store (added from M3)
scripts/
  dev-server.js          zero-dependency static file server for local dev
tests/
  unit/                    domain and token tests
  component/                DOM-level checks
  e2e/                       Playwright + axe (added in M7)
```

## Interpretations

Flagging deviations from `HANDOFF.md` section 4's stack proposal, per working
agreement 9. Section 4 called itself "a proposal, change if you prefer."

- **No React, no bundler.** Decided with Aditya during M0: the prototype is
  plain HTML/CSS/vanilla JS (ES modules), not a React app, and has no build step.
  There is no Vite/webpack/esbuild bundling the app for either dev or prod; files
  are served as written.
- **`npm run dev` is a small zero-dependency Node static server**
  (`scripts/dev-server.js`), not the Vite dev server, since Vite is no longer part
  of the stack. It still supports opening the prototype from a phone on the local
  network (HANDOFF section 1, step 2).
- **`npm run typecheck` runs `tsc --checkJs`** against plain `.js` files with
  JSDoc type annotations, rather than compiling TypeScript. This keeps the
  "typecheck" gate in HANDOFF's milestone table (section 11) meaningful without
  reintroducing a build step: `tsc` here only checks types, it never emits files
  the app depends on.
- **Vitest** (unit/component tests) and, from M7, **Playwright** stay as
  proposed in section 4 — both are framework-agnostic and work the same way
  against plain HTML/CSS/JS as they would against a React app.
- **ESLint and Prettier** stay as proposed, configured for plain JS instead of
  TypeScript/JSX.

## Milestones

Tracking `HANDOFF.md` section 11. Each milestone is reviewed before starting the
next.

- [x] M0 — Scaffold
- [ ] M1 — Hevy shell
- [ ] M2 — Rules engine
- [ ] M3 — Today's Focus and direction line
- [ ] M4 — Signals
- [ ] M5 — Pain
- [ ] M6 — Recap
- [ ] M7 — Accessibility and QA
- [ ] M8 — Live model (optional)
