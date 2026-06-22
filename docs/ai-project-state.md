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

## Current Production State

- Production deployed app hash: `9624f63 Fix production npm lockfile`.
- Current runtime includes `50b8c55 Merge project finalization`.
- Latest docs/state commit: this docs-only finalization update on `main` after deploy; no production redeploy is required for it.
- Senior project finalization is complete for the current release line.
- Vite build tooling is deployed on Vite 8: `vite@8.0.16`, `@vitejs/plugin-react@6.0.2`.
- Low-level `esbuild` advisory is closed by the Vite 8 toolchain update; `npm audit --audit-level=low` is clean in `site`.
- Previous Vite chunk-size warning is resolved. The large Shiki C++ grammar remains an intentional lazy chunk, not an initial app chunk.
- Production browser QA confirmed that direct routes, lazy chunks, CodeBlock pages, AI assistant guest fallback and unknown route fallback work after deploy.
- Backend/session/build stability checks passed; no runtime backend change was required in finalization.
- Docker dev/prod compose configs are valid.
- Project tree cleanup removed only empty untracked directories that had no files or references.
- Presentation materials are available in `docs/presentation`.

## Course State

- OOP C++ sections 0-10 are closed without a gap.
- Not ready: 11 "Инкапсуляция", 12 "Исключения".
- Future parts 9.2, 10.1 and 10.2 already exist, but do not continue them until 11-12 are closed.
- Content backlog for sections 11-12 is not a production blocker.
- Do not start section 11 inside infrastructure/finalization tasks.

## Stabilized Recently

- Public `/` is outside `AppLayout`: no sidebar, app search, app topbar or AI assistant on the public HomePage.
- App routes remain inside `AppLayout`: `/courses`, `/courses/base-cpp`, `/courses/oop-cpp`, `/tasks`, `/guide`, `/common-errors`, auth/profile/course/task pages.
- Unknown routes show app-shell `NotFoundPage`, not public HomePage.
- BrandLogo, header/auth slot, core typography, CodeBlock readability, course/task layout and AI assistant presentation have been stabilized.
- Guest auth refresh noise is fixed for clean guest contexts.
- Route/data lookup helpers and route constants are in use where they reduce route string drift.
- Vite tooling was migrated and production lockfile compatibility with npm 10 was fixed.

## Recent Important Commits

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

- Frontend checks passed after Vite 8 migration: `npm run typecheck`, `npm run lint`, `npm run build`, `npm audit --audit-level=low`.
- Backend checks passed: `manage.py check`, `makemigrations --check --dry-run`, `manage.py test` with 77 tests, backend `pip check`.
- Docker/config checks passed: `docker compose -f docker-compose.dev.yml config --quiet`, `docker compose -f docker-compose.prod.yml config --quiet`.
- Root checks passed during finalization: `git diff --check`, `git diff --cached --check`, clean status before commits.
- Production backup succeeded before deploy: `/opt/uchicode/app/backups/20260622T001340Z`.
- Production health checks passed after deploy: `nginx-health`, `api/health`.
- Production curl checks returned `200 OK` for `/`, `/courses`, `/tasks`, `/tasks/00-01-minimal-program`, `/courses/oop-cpp/delegating-constructors`, `/guide`, `/common-errors`, `/login`, `/register`.
- Production browser QA with cache-bust `v=9624f63` covered desktop and mobile routes, CodeBlock, AI assistant guest fallback, unknown route fallback, console errors and horizontal overflow.

## Known Follow-ups

1. OOP C++ section 11 "Инкапсуляция".
2. OOP C++ section 12 "Исключения".
3. Audit OOP sections 0-12 readiness after content backlog is closed.
4. Backend/auth/payment/security pass before monetization.
5. Product analytics/progress improvements after content backlog is stable.
6. Monitor Rolldown/Vite CSS plugin timing if build time becomes a practical problem. It is not a current production blocker.

## Do Not Do Now

- Do not push or deploy unless explicitly requested.
- Do not redeploy for docs-only state commits.
- Do not continue 9.2, 10.1 or 10.2 before 11-12 are closed.
- Do not add section 12 before section 11.
- Do not mix content work with Docker/nginx/security changes.

## Next Stage

The project is ready for review, presentation and further development on the current release line. The next product/content task can be planned as OOP C++ section 11, but start it only in a separate scoped prompt/branch.
