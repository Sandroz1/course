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

- Production deployed app hash: `6206dd3 Merge pre-section UI quality pass`.
- Latest deployed main hash before this docs-only state update: `6206dd3 Merge pre-section UI quality pass`.
- Latest docs/state commit: this docs-only post-deploy state update on `main` (no production redeploy required).
- Production deploy после P2 frontend fixes прошёл успешно.
- CodeBlock readability hotfix задеплоен.
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
- Codex docs workflow added: before state-changing work, verify docs against git status/log/current branch/code state and update docs when production/backlog/architecture/workflow state changes.
- `codex/app-logo-course-start` закрыта как obsolete: local branch удалена, remote branch отсутствует, `main` сохраняет актуальную `getAppLogoHref`-логику.
- CodeBlock readability/top actions hotfix deployed: code text contrast is stronger, CodeBlock owns its font sizing on theory/task pages, copy action is compact and selection AI popover no longer looks like a large unrelated pill.
- Pre-section UI quality pass deployed: `/profile` page heading now follows the shared page-title scale, and `CodeBlock` text selection is readable in light, dark and deep-dark themes.
- Frontend foundation hardening prepared: stale global `.code-block*` selectors were removed, `AuthLayout` typography was softened, and touched app-shell/static task routes now use `appRoutes`/`routePrefixes`.

## Header Quality Bar

- Расположение кнопок в public header входит в UI quality bar.
- `ThemeSwitcher` и auth action должны занимать стабильные слоты и не прыгать при refresh.
- `Войти` и `Профиль` должны занимать один согласованный auth slot.
- Правая группа header должна быть визуально ровной.
- Размеры кнопок и селекта темы должны быть согласованы.
- Hover/focus/active не должны менять layout.
- Mobile header не должен ломаться или давать horizontal overflow.

## Recent Important Commits

- `6206dd3` - `Merge pre-section UI quality pass`.
- `8d0014c` - `Polish UI and frontend structure before encapsulation`.
- `698eb0e` - `Merge code block readability hotfix`.
- `0df4f61` - `Fix code block readability`.
- `5d6d7f5` - `Update project quality rules`.
- `1cd2cc5` - `Merge header and homepage typography hotfix`.
- `ec347d8` - `Merge frontend audit P2 fixes`.
- `a23b30e` - `Clarify post-deploy state labels`.
- `442cc74` - `Update project state after P2 deploy`.
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

Next planned work: complete OOP section 11 "Инкапсуляция".

## Backlog

1. AI assistant geometry/token cleanup, if needed.
2. Auth refresh noise cleanup.
3. Vite chunk-size warning / performance split.
4. Complete OOP section 12 "Исключения".
5. Audit OOP sections 0-12 readiness.

## Checks Snapshot

- Last production deployed app hash: `6206dd3`.
- Latest docs-only state on `main`: this docs-only post-deploy state update after pre-section UI quality pass.
- Last frontend checks for pre-section UI quality pass passed: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`.
- Production smoke passed for `nginx-health`, `api/health`, `/profile`, `/tasks/00-01-minimal-program` and `/courses/oop-cpp/delegating-constructors`.
- Browser QA covered `/profile`, CodeBlock pages locally and on production in desktop/mobile, light/dark/deep-dark, copy action and AI selection popover; no horizontal overflow found.
- Last frontend checks for CodeBlock hotfix passed: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`.
- Production smoke passed for `nginx-health`, `api/health`, `/tasks/00-01-minimal-program` and `/courses/oop-cpp/delegating-constructors`.
- Browser QA covered CodeBlock pages locally and on production in desktop/mobile, dark/deep-dark; no horizontal overflow found.
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
- Fresh unauthenticated browser contexts still log a 401 for `/api/auth/token/refresh/`; track this in auth cleanup, not in CodeBlock work.

## Do Not Do Now

- Do not push or deploy unless explicitly requested.
- Do not continue section 11 before the project structure/code cleanliness audit decision.
- Do not continue 9.2, 10.1, 10.2 before 11-12 are closed.
- Do not add section 12 before section 11.
- Do not mix content work with Docker/nginx/security changes.
