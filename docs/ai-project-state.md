# AI Project State

This document records only the current project state, release line and near-term backlog. Stable rules live in [../AGENTS.md](../AGENTS.md), [README.md](README.md) and the focused docs linked from [README.md](README.md).

## Project Map

- Project: Uchicode.
- Stack: React + TypeScript + Vite frontend, Django backend.
- Main frontend area: `site/src`.
- Course content: `site/src/content/course`.
- Course sections: `site/src/data/courseSections.ts`.
- Course order: `site/src/data/courses.ts`.
- Tasks: `site/src/data/tasks.ts`.
- Practice files: `practice`.
- Deploy docs: [../DEPLOY.md](../DEPLOY.md) and [../deploy/docs/README.md](../deploy/docs/README.md).
- Presentation materials: [presentation/README.md](presentation/README.md).
- Next platform design: [learning-loop-checker-design.md](learning-loop-checker-design.md).

## Current Production State

- Production deployed app hash: `cc8d75d Merge visual UI cleanup`.
- Current runtime includes project finalization, production npm lockfile fix, route loading/practice UX fixes, route loading UI hotfix, responsive layout hardening, mobile visual cleanup and visual UI cleanup.
- Latest docs/state commit: this Learning Loop + C++ Checker design update; no production redeploy is required for it.
- Senior project finalization is complete for the current release line.
- Vite build tooling is deployed on Vite 8: `vite@8.0.16`, `@vitejs/plugin-react@6.0.2`.
- Low-level `esbuild` advisory is closed by the Vite 8 toolchain update; `npm audit --audit-level=low` is clean in `site`.
- Previous Vite chunk-size warning is resolved. The large Shiki C++ grammar remains an intentional lazy chunk, not an initial app chunk.
- Production browser QA confirmed that direct routes, lazy chunks, CodeBlock pages, AI assistant guest fallback and unknown route fallback work after deploy.
- Route loading regression is fixed: app-shell routes keep the shell visible while lazy route content loads.
- Route-level loading UI is removed from normal page refresh/navigation. Regular app routes no longer render a visible "loading page" card.
- Responsive hardening is deployed. The app shell, public HomePage, course/task pages, auth/profile pages, CodeBlock, inline code, filters, cards and AI assistant layout were hardened for 320-430px mobile widths, tablet and desktop by code/static audit and build checks.
- Mobile visual cleanup is deployed. Mobile pages were checked in browser at 360, 390, 430, 768 and 1280px across light/dark/deep-dark themes; 320px is kept only as an overflow guardrail, not as the primary visual target.
- Visual UI cleanup is deployed. Nested panel noise, bulky mobile cards, oversized mobile controls, app topbar wrapping and AI assistant obstruction were reduced without changing course/task content.
- `practice/` remains an internal source for starter files. Task UI no longer presents `practice/...` paths as required user-facing steps.
- Local first-run setup is documented in [../LOCAL_RUNBOOK.md](../LOCAL_RUNBOOK.md).
- Backend/session/build stability checks passed; no runtime backend change was required in finalization.
- Docker dev/prod compose configs are valid.
- Project tree cleanup removed only empty untracked directories that had no files or references.
- Presentation materials are available in `docs/presentation`.
- Learning Loop + C++ Checker MVP is documented. This is a docs-only design decision; runtime and the production deployed app hash are unchanged.

## Course State

- OOP C++ sections 0-10 are closed without a gap.
- Not ready: 11 "Инкапсуляция", 12 "Исключения".
- Future parts 9.2, 10.1 and 10.2 already exist, but do not continue them until 11-12 are closed.
- Content backlog for sections 11-12 is not a production blocker.
- Sections 11-12 have not started. Do not add them until the platform learning-loop/checker foundation is implemented and stabilized.

## Stabilized Recently

- Public `/` is outside `AppLayout`: no sidebar, app search, app topbar or AI assistant on the public HomePage.
- App routes remain inside `AppLayout`: `/courses`, `/courses/base-cpp`, `/courses/oop-cpp`, `/tasks`, `/guide`, `/common-errors`, auth/profile/course/task pages.
- Unknown routes show app-shell `NotFoundPage`, not public HomePage.
- BrandLogo, header/auth slot, core typography, CodeBlock readability, course/task layout and AI assistant presentation have been stabilized.
- Guest auth refresh noise is fixed for clean guest contexts.
- Route/data lookup helpers and route constants are in use where they reduce route string drift.
- Vite tooling was migrated and production lockfile compatibility with npm 10 was fixed.
- Task detail pages now show starter code and file labels without exposing internal `practice/...` paths as ordinary user instructions.

## Recent Important Commits

- `cc8d75d` - `Merge visual UI cleanup`.
- `ef53cf4` - `Improve visual UI layout`.
- `89699a5` - `Merge mobile visual cleanup`.
- `f6a9d69` - `Improve mobile visual layout`.
- `bf43494` - `Merge responsive layout improvements`.
- `3f4cd3d` - `Improve responsive layout`.
- `92b52c5` - `Update project state after route loading UI hotfix`.
- `4b5592d` - `Merge route loading UI hotfix`.
- `5d1eb86` - `Remove route loading UI`.
- `1bd4769` - `Update project state after route loading and practice UX`.
- `f9ad10e` - `Merge route loading and practice UX fixes`.
- `1a24159` - `Document local setup and practice usage`.
- `bad2680` - `Hide practice internals from task UI`.
- `c96cfd4` - `Fix route loading regression`.
- `dfce90e` - `Update project state after finalization`.
- `9624f63` - `Fix production npm lockfile`.
- `50b8c55` - `Merge project finalization`.
- `20c1e36` - `Finalize project documentation`.
- `56c7923` - `Add presentation materials`.
- `51c3a93` - `Migrate Vite build tooling`.
- `d15d319` - `Merge Vite build tooling stabilization`.
- `fa8ad5e` - `Merge frontend final stabilization`.
- `0475b21` - `Merge frontend quality hardening`.
- `cdf62d8` - `Merge AI assistant refactor`.
- `a2c4b29` - `Merge frontend foundation hardening`.

## Checks Snapshot

- Visual UI cleanup checks passed: `npm run typecheck`, `npm run lint`, `npm run build`, `npm audit --audit-level=low`, `git diff --check`.
- Visual UI browser QA passed locally for `/`, `/courses`, `/courses/oop-cpp`, `/tasks`, `/tasks/00-01-minimal-program`, `/courses/oop-cpp/delegating-constructors`, `/guide`, `/common-errors`, `/login`, `/register` and unknown route at 360, 390, 430, 768 and 1280px across light/dark/deep-dark themes. A 320px check remains a basic overflow guardrail only.
- Production deployed app hash after visual UI cleanup: `cc8d75d`.
- Mobile visual cleanup checks passed: `npm run typecheck`, `npm run lint`, `npm run build`, `npm audit --audit-level=low`, `git diff --check`.
- Mobile browser QA passed locally for `/`, `/courses`, `/courses/oop-cpp`, `/tasks`, `/tasks/00-01-minimal-program`, `/courses/oop-cpp/delegating-constructors`, `/guide`, `/common-errors`, `/login`, `/register` and unknown route at 320, 360, 390, 430, 768 and 1280px across light/dark/deep-dark themes.
- Production browser QA passed after mobile visual cleanup deploy with cache-bust `?v=89699a5`: direct routes, lazy chunks, CodeBlock pages, AI assistant guest fallback, unknown route, mobile overflow and route loading regression were checked.
- Responsive hardening checks passed: `npm run typecheck`, `npm run lint`, `npm run build`, `npm audit --audit-level=low`, `git diff --check`.
- Responsive static audit checked app shell, sidebar/topbar, public HomePage, courses, course detail, task list, task detail, guide, common errors, login/register/profile, NotFound, CodeBlock, inline code, filters, cards, forms, dropdowns and AI assistant. Browser QA was intentionally not run for this pass by task constraint.
- Frontend checks passed after Vite 8 migration: `npm run typecheck`, `npm run lint`, `npm run build`, `npm audit --audit-level=low`.
- Backend checks passed: `manage.py check`, `makemigrations --check --dry-run`, `manage.py test` with 77 tests, backend `pip check`.
- Docker/config checks passed: `docker compose -f docker-compose.dev.yml config --quiet`, `docker compose -f docker-compose.prod.yml config --quiet`.
- Root checks passed during finalization: `git diff --check`, `git diff --cached --check`, clean status before commits.
- Production backup succeeded before finalization deploy: `/opt/uchicode/app/backups/20260622T001340Z`.
- Production backup succeeded before route loading/practice UX hotfix deploy: `/opt/uchicode/app/backups/20260622T075618Z`.
- Production backup succeeded before route loading UI hotfix deploy: `/opt/uchicode/app/backups/20260622T082255Z`.
- Production backup succeeded before responsive hardening deploy: `/opt/uchicode/app/backups/20260623T112442Z`.
- Production backup succeeded before mobile visual cleanup deploy: `/opt/uchicode/app/backups/20260624T163402Z`.
- Production backup succeeded before visual UI cleanup deploy: `/opt/uchicode/app/backups/20260624T190845Z`.
- Production health checks passed after deploy: `nginx-health`, `api/health`.
- Production curl checks returned `200 OK` for `/`, `/courses`, `/tasks`, `/tasks/00-01-minimal-program`, `/courses/oop-cpp/delegating-constructors`, `/guide`, `/common-errors`, `/login`, `/register`.
- Production curl checks also returned `200 OK` for `/courses/oop-cpp` after responsive hardening deploy.

## Known Follow-ups

1. Review and approve [Learning Loop + C++ Checker MVP](learning-loop-checker-design.md).
2. Implement versioned checker task data and attempt/submission APIs without enabling code execution.
3. Add draft saving, then provision a separate isolated runner and enable the checker for the reviewed basic tasks.
4. Add sanitized AI result explanation, learning-loop analytics and profile/next-step improvements after deterministic checks are stable.
5. Complete OOP C++ sections 11 and 12 only after the platform foundation is stable, then audit sections 0-12.
6. Run the backend/auth/payment/security pass before monetization.
7. Monitor Rolldown/Vite CSS plugin timing only if build time becomes a practical problem; it is not a current blocker.

## Do Not Do Now

- Do not push or deploy unless explicitly requested.
- Do not redeploy for docs-only state commits.
- Do not implement a runner in the backend container or on the production app host.
- Do not start sections 11/12 before the platform learning loop is stable.
- Do not continue 9.2, 10.1 or 10.2 before 11-12 are closed.
- Do not add section 12 before section 11.
- Do not mix content work with Docker/nginx/security changes.

## Next Stage

Review and approve the Learning Loop + C++ Checker MVP design. After approval, the first implementation pass is backend versioned checker data plus attempt/submission models and API contracts, without a runner. Sections 11/12 remain paused.
