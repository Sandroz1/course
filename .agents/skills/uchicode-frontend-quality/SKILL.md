---
name: uchicode-frontend-quality
description: Apply Uchicode React, TypeScript, UI-system, accessibility, responsive, task-page, code-editor, and checker-UX rules. Use for frontend components, styles, task/course/auth pages, code editor work, mobile layout, themes, or visual QA.
---

# Uchicode Frontend Quality

Read `docs/architecture/ARCHITECTURE.md` and `docs/frontend/frontend-ui-standards.md`, then inspect the affected components and existing shared patterns.

## Implementation Rules

- Keep React components focused, state minimal, and derived values out of state.
- Avoid unnecessary effects, memoization, broad casts, `any`, `ts-ignore`, and `eslint-disable`.
- Reuse established components only when it reduces real duplication or protects a UI contract.
- Avoid heavy dependencies unless the benefit is clear and the project has no adequate existing solution.
- Preserve stable typography metrics across light, dark, and deep-dark themes.

## Responsive And Accessible UI

- At about 390px, prevent horizontal overflow, overlapping fixed UI, clipped controls, and desktop-only grids.
- Keep code scrolling inside code/editor surfaces; long text and inline code must wrap safely.
- Use semantic controls, visible focus, clear labels/errors, keyboard access, adequate contrast, and practical touch targets.
- Keep hover, focus, loading, success, error, and disabled states from shifting layout.

## Checker And Editor UX

- The C++ editor must remain usable in all themes and on mobile.
- Preserve draft state and show clear guest/auth, saving, saved, error, and unavailable states.
- When runner execution is unavailable, say so honestly. Do not show fake `queued`, `compiling`, `running`, or result states.

## Verification

Run `npm run typecheck`, `npm run lint`, and `npm run build` from `site`. For important visual changes, perform targeted browser smoke checks when practical and requested.
