# AI Project State

Документ фиксирует только текущее состояние проекта и ближайшие задачи. Постоянные правила лежат в [../AGENTS.md](../AGENTS.md) и [../README.md](../README.md).

## Project Map

- Проект: Uchicode.
- Стек: React + TypeScript + Vite, Django backend.
- Основная зона frontend: `site/src`.
- Контент курса: `site/src/content/course`.
- Разделы курса: `site/src/data/courseSections.ts`.
- Порядок курса: `site/src/data/courses.ts`.
- Задачи: `site/src/data/tasks.ts`.
- Практические файлы: `practice`.

## Current Status

- Текущая рабочая ветка: `codex/homepage-clarity-cta-pass`.
- Release line содержит актуальные stabilization docs commits: `26038d0 Update project stabilization docs` и `4259a22 Clarify release documentation freshness`.
- Перед merge/deploy фактический HEAD проверять через `git log`; не считать эту строку единственным источником истины.
- Последний HomePage implementation commit: `8486698 Polish homepage clarity and CTA hierarchy`.
- Последний production deploy/main baseline: `fd9ef74 Merge public homepage stabilization`.
- `/` — публичная HomePage без `AppLayout`.
- На `/` не должно быть sidebar, app topbar, global search и AI assistant.
- Остальные routes остаются внутри app-shell: `/courses`, `/courses/base-cpp`, `/courses/oop-cpp`, `/tasks`, `/guide`, `/common-errors`, auth/profile/course/task pages.
- Unknown routes показывают app-shell fallback `NotFoundPage`, а не public HomePage.
- ООП C++ разделы 0-10 закрыты без пробела.
- Не готовы: 11 "Инкапсуляция", 12 "Исключения".
- Будущие части 9.2, 10.1, 10.2 уже существуют, но продолжать их нельзя, пока не закрыты 11-12.

## Stabilized Recently

- Public HomePage вынесена из app-shell.
- HomePage переведена от code-dashboard к learning map.
- Route cards получили явную action footer; info cards отделены от clickable cards.
- Hero/route map/lesson/routes copy сокращены после clarity pass, чтобы секции не повторяли одну мысль.
- `BrandLogo` унифицирован между public HomePage и sidebar.
- Core typography частично выровнена в hotspot-зонах.
- Project quality bar добавлен в docs.

## Recent Important Commits

- `8486698` - `Polish homepage clarity and CTA hierarchy`.
- `4259a22` - `Clarify release documentation freshness`.
- `26038d0` - `Update project stabilization docs`.
- `fd9ef74` - `Merge public homepage stabilization`.
- `255bbcb` - `Polish homepage clarity and CTA hierarchy`.
- `e96fdee` - `Document project quality bar`.
- `647cd2a` - `Unify brand and core typography`.
- `0072800` - `Polish public homepage clarity`.
- `24ba5a9` - `Rebuild homepage as public learning map`.

## Deploy Readiness

- P1 blockers were not found in the stabilization audit.
- Current HomePage clarity pass is deploy-ready after merge to `main`, push, VPS backup and standard production health checks.
- Course content gaps are content backlog, not a blocker for site stability.
- Do not deploy from an unmerged feature branch.

## Post-Deploy Backlog

1. Course card clickability consistency.
2. AI assistant typography pass.
3. Auth/Profile typography pass.
4. Merge or discard small app-shell logo UX branch: `codex/app-logo-course-start`.
5. Complete OOP section 11 "Инкапсуляция".
6. Complete OOP section 12 "Исключения".
7. Audit OOP sections 0-12 readiness.

## Safe-Pass Rules

- Treat old HomePage redesign branches as reference-only.
- Do not merge old HomePage branches wholesale.
- Do not cherry-pick large HomePage commits blindly.
- Do not bring back rejected SaaS/dashboard/code-demo patterns.
- For "доработай", "обработай" and "доведи до ума", do a self-review before commit: remove repetition, weak copy, empty promises, chaotic CSS/TSX and UX regressions.
- Prefer small safe-pass commits over broad frontend polish.

## Checks Snapshot

- Last frontend checks for the current HomePage pass: `npm run typecheck`, `npm run lint`, `npm run build`.
- Browser QA for `/`: desktop, mobile, light/dark/deep-dark, links, horizontal overflow and console errors.
- Vite chunk-size warning is known and is not a build failure.
- Docs-only changes should run only repository checks unless code changes accidentally appear.

## Known Issues

- `docs/course-content-plan.md` may contain old wording for early sections 6-7; update only in a dedicated course-plan pass.
- База C++ sections 0-4 remain `needs-theory`; CoursePage shows placeholder pages for them.
- If real production secrets were pushed or shared before the security pass, manual rotation and history cleanup are still required.
- Page-level lazy loading, auth reset event cleanup and a unit test runner remain future frontend tasks.

## Do Not Do Now

- Do not push or deploy unless explicitly requested.
- Do not continue 9.2, 10.1, 10.2 before 11-12 are closed.
- Do not add section 12 before section 11.
- Do not mix content work with Docker/nginx/security changes.
