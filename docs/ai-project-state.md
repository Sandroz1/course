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

## Current Production State

- Production deployed app hash: `ec347d8 Merge frontend audit P2 fixes`.
- Current main state: contains production app commit `ec347d8` plus docs-only state commits. Use `git rev-parse --short HEAD` for the exact current `main` hash.
- Latest docs/state commit: `Update project state after P2 deploy` on `main` (docs-only; no production redeploy required).
- Production deploy после P2 frontend fixes прошёл успешно.
- Главная `/` стабилизирована и задеплоена.
- `/` остаётся public HomePage без `AppLayout`, sidebar, search, app topbar и AI assistant.
- App routes остаются внутри `AppLayout`: `/courses`, `/courses/base-cpp`, `/courses/oop-cpp`, `/tasks`, `/guide`, `/common-errors`, auth/profile/course/task pages.
- Unknown routes показывают app-shell fallback `NotFoundPage`, а не public HomePage.
- ООП C++ разделы 0-10 закрыты без пробела.
- Не готовы: 11 "Инкапсуляция", 12 "Исключения".
- Будущие части 9.2, 10.1, 10.2 уже существуют, но продолжать их нельзя, пока не закрыты 11-12.
- Content backlog по sections 11-12 не блокирует production deploy.

## Stabilized Recently

- Public HomePage вынесена из app-shell и больше не показывает sidebar/search/app topbar/AI.
- `BrandLogo` и core typography унифицированы для public и app-shell зон.
- Project quality bar зафиксирован в docs.
- HomePage CTA hierarchy и повторяющиеся секции сокращены.
- Mobile route map исправлена: подписи не слипаются на узких экранах.
- Добавлен `NotFoundPage` для unknown routes.
- Main page visual regressions исправлены после release stabilization.
- Header/auth shift исправлен: `ThemeSwitcher` и auth action не прыгают при refresh.
- HomePage typography, hover/focus и CTA стали мягче и стабильнее.
- App-shell logo destination исправлен: public logo ведёт на `/`; app-shell logo остаётся в учебной зоне; course pages ведут к course root или `/courses`.
- P2 frontend fixes deployed: course cards click as full cards, `task5-2-worker` is linked from `delegating-constructors`, AI assistant typography and Profile typography are lighter.

## Header Quality Bar

- Расположение кнопок в public header входит в UI quality bar.
- `ThemeSwitcher` и auth action должны занимать стабильные слоты и не прыгать при refresh.
- `Войти` и `Профиль` должны занимать один согласованный auth slot.
- Правая группа header должна быть визуально ровной.
- Размеры кнопок и селекта темы должны быть согласованы.
- Hover/focus/active не должны менять layout.
- Mobile header не должен ломаться или давать horizontal overflow.

## Recent Important Commits

- `1cd2cc5` - `Merge header and homepage typography hotfix`.
- `ec347d8` - `Merge frontend audit P2 fixes`.
- `e383342` - `Document Codex state update workflow`.
- `aa5ca59` - `Fix frontend audit P2 issues`.
- `e882030` - `Fix header auth shift and homepage typography`.
- `d103c83` - `Merge main page visual hotfix`.
- `698211b` - `Fix main page visual regressions`.
- `fb26678` - `Merge homepage stabilization release`.
- `31f6991` - `Add not found route fallback`.
- `21f7382` - `Fix homepage mobile route map`.
- `be464ee` - `Clarify release documentation state`.
- `26038d0` - `Update project stabilization docs`.
- `e96fdee` - `Document project quality bar`.

## Next Stage

Next planned work: section 11 "Инкапсуляция", unless `codex/app-logo-course-start` must be resolved first as a dedicated branch-decision task.

## Backlog After Audit

1. Complete OOP section 11 "Инкапсуляция".
2. Complete OOP section 12 "Исключения".
3. Решить судьбу `codex/app-logo-course-start`: merge, cherry-pick точечной идеи или discard.
4. Audit OOP sections 0-12 readiness.

## Checks Snapshot

- Last production deployed app hash: `ec347d8`.
- Latest docs-only state on `main`: `Update project state after P2 deploy`.
- Last frontend checks for P2 deploy passed: `npm run typecheck`, `npm run lint`, `npm run build`.
- Production smoke passed for `/`, `/courses`, `/tasks`, `/login`, `/courses/oop-cpp/delegating-constructors`, `/tasks/task5-2-worker` and health checks.
- Browser QA covered `/courses`, `/courses/oop-cpp/delegating-constructors`, `/tasks/task5-2-worker`, AI assistant and profile/login redirect; no console errors or horizontal overflow.
- Vite chunk-size warning is known and is not a build failure.
- Docs-only changes should run only repository checks unless code changes accidentally appear.

## Known Issues

- `docs/course-content-plan.md` may contain old wording for early sections 6-7; update only in a dedicated course-plan pass.
- База C++ sections 0-4 remain `needs-theory`; CoursePage shows placeholder pages for them.
- If real production secrets were pushed or shared before the security pass, manual rotation and history cleanup are still required.
- Page-level lazy loading, auth reset event cleanup and a unit test runner remain future frontend tasks.

## Do Not Do Now

- Do not push or deploy unless explicitly requested.
- Do not continue section 11 before the frontend/code audit.
- Do not continue 9.2, 10.1, 10.2 before 11-12 are closed.
- Do not add section 12 before section 11.
- Do not mix content work with Docker/nginx/security changes.
