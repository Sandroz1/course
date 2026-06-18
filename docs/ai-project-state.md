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

- Production deployed app hash: `1cd2cc5 Merge header and homepage typography hotfix`.
- Latest project-state docs commit: `Update project state after header hotfix deploy` on `main`.
- The docs-only commit does not require a production redeploy.
- Production deploy после HomePage/header hotfix прошёл успешно.
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

Следующий этап: полный frontend/code audit без изменений.

Цель аудита: проверить стабильность frontend после HomePage/header stabilization, найти оставшиеся UX/code risks и не смешивать диагностику с feature-правками.

## Backlog After Audit

1. Course card clickability consistency.
2. AI assistant typography pass.
3. Auth/Profile typography pass.
4. Решить судьбу `codex/app-logo-course-start`: merge, cherry-pick точечной идеи или discard.
5. Complete OOP section 11 "Инкапсуляция".
6. Complete OOP section 12 "Исключения".
7. Audit OOP sections 0-12 readiness.

## Checks Snapshot

- Last production deployed app hash: `1cd2cc5`.
- Latest docs-only state on `main`: `Update project state after header hotfix deploy`.
- Last frontend checks for the header/HomePage hotfix passed: `npm run typecheck`, `npm run lint`, `npm run build`.
- Production smoke passed for `/`, app routes, health checks and unknown route fallback.
- Browser QA covered public `/`, mobile around 390px, header refresh stability, app-shell logo destinations, horizontal overflow and console errors.
- Vite chunk-size warning is known and is not a build failure.
- Docs-only changes should run only repository checks unless code changes accidentally appear.

## Known Issues

- Course card clickability consistency still needs a dedicated pass.
- AI assistant typography still needs a dedicated pass.
- Auth/Profile typography still needs a dedicated pass.
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
