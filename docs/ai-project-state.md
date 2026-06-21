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

- Production deployed app hash: `fa8ad5e Merge frontend final stabilization`.
- Latest deployed runtime hash before this docs-only state update: `fa8ad5e Merge frontend final stabilization`.
- Latest docs/state commit: this post-deploy docs-only state update on `main` (no production redeploy required).
- Frontend final stabilization is deployed.
- Frontend quality hardening is deployed.
- AI assistant refactor is deployed; backend API and AI endpoint contract were not changed.
- Backend/session/build stability pass is complete on the current release line; no runtime backend changes were needed.
- Guest auth refresh guard is deployed: clean guest contexts no longer call `/auth/token/refresh/` on page load.
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
- Frontend foundation hardening deployed: stale global `.code-block*` selectors were removed, `AuthLayout` typography was softened, and touched app-shell/static task routes now use `appRoutes`/`routePrefixes`.
- Frontend quality hardening deployed: route/data lookup helpers are centralized, task search uses a shared search text helper, Vite config type coverage is checked, and guest auth refresh noise is removed for clean guest contexts.
- AI assistant refactor deployed: panel presentation parts were split from feature state/API wiring, while message format and `/api/ai/chat/` contract stayed unchanged.
- Frontend final stabilization deployed: final audit found no P1 frontend blockers, and `/courses` no longer repeats the same `Курсы` label in the eyebrow and H1.
- Backend/session/build stability audit completed: auth/session tests, migrations dry-run, backend dependency check, compose config and frontend build/tooling gate were checked without finding a runtime blocker.
- Vite chunk-size warning is fixed on `fix/vite-build-tooling-pass` by lazy-loading `AppLayout` and route-level pages; production deploy is still pending for this branch.

## Header Quality Bar

- Расположение кнопок в public header входит в UI quality bar.
- `ThemeSwitcher` и auth action должны занимать стабильные слоты и не прыгать при refresh.
- `Войти` и `Профиль` должны занимать один согласованный auth slot.
- Правая группа header должна быть визуально ровной.
- Размеры кнопок и селекта темы должны быть согласованы.
- Hover/focus/active не должны менять layout.
- Mobile header не должен ломаться или давать horizontal overflow.

## Recent Important Commits

- `fa8ad5e` - `Merge frontend final stabilization`.
- `2431bd9` - `Stabilize frontend UI system`.
- `cdf62d8` - `Merge AI assistant refactor`.
- `29875a0` - `Refactor AI assistant`.
- `0475b21` - `Merge frontend quality hardening`.
- `6d190e3` - `Fix known frontend follow-ups`.
- `a63d1ed` - `Complete project foundation hardening`.
- `cdcb4c5` - `Harden frontend quality`.
- `a2c4b29` - `Merge frontend foundation hardening`.
- `afeaf03` - `Harden frontend foundation`.
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

## Latest Release State

- `fix/frontend-final-stabilization` was merged into `main` and deployed as `fa8ad5e`.
- Scope shipped: final frontend readiness audit, `/courses` eyebrow/H1 duplicate wording fix, production browser QA for route shell, course/task flows, NotFound and AI assistant.
- `fix/backend-session-build-stability` completed as a docs-only stability pass. Backend auth/session/build checks passed; no runtime code/config change was required, so production remains on `fa8ad5e`.
- `fix/vite-build-tooling-pass` splits route-level pages and `AppLayout` from the initial bundle. The previous 657 kB `index` chunk warning is gone in local build; production deploy is still pending.
- `fix/ai-assistant-refactor` was merged into `main` and deployed as `cdf62d8`.
- AI assistant scope shipped: presentation split, cleaner panel subcomponents, stable assistant typography/layout, and no backend/API contract changes.
- Previous frontend quality hardening is deployed as `0475b21`: Vite config type coverage, safe npm audit review, small layout-stability fixes, guest auth refresh noise cleanup, route/data lookup helpers, and docs rules that prevent the same frontend quality regressions.
- Guest contexts without an access token or saved user snapshot no longer call `/auth/token/refresh/` on page load. Saved user snapshots still allow the app to attempt cookie-based session restore.
- The remaining `esbuild` npm audit item is low severity and tied to the current Vite 7 toolchain range. Vite 7 cannot safely resolve `esbuild@0.28.1`; do not add overrides. Treat Vite 8 as a separate major tooling migration.

## Next Stage

Next planned work: continue course/content work, starting with OOP C++ section 11, while keeping tooling/performance follow-ups separate.

## Backlog

1. OOP C++ section 11 "Инкапсуляция".
2. OOP C++ section 12 "Исключения".
3. Audit OOP sections 0-12 readiness after content backlog is closed.
4. Vite 8 tooling migration decision for the low-severity `esbuild` dev-server advisory.
5. Docs cleanup if needed.

## Checks Snapshot

- Last production deployed app hash: `fa8ad5e`.
- Latest docs-only state on `main`: this docs-only post-deploy state update after frontend final stabilization deploy.
- Last frontend final stabilization checks passed: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`.
- Frontend audit found no P1 blockers before deploy. The only Fix now change was `/courses` eyebrow text from `Курсы` to `Каталог` to remove a duplicate label/H1 pattern.
- Production smoke passed for `nginx-health`, `api/health`, `/`, `/courses`, `/courses/oop-cpp`, `/tasks`, `/tasks/00-01-minimal-program`, `/courses/oop-cpp/delegating-constructors`, `/guide`, `/common-errors`, `/login` and `/register`.
- Browser QA covered production `/`, `/courses`, `/tasks`, `/tasks/00-01-minimal-program`, `/courses/oop-cpp/delegating-constructors`, `/login`, `/register`, unknown route fallback and AI assistant success/error states with cache-busting hash `fa8ad5e`.
- Backend/session/build stability checks passed: `manage.py check`, `makemigrations --check --dry-run`, `manage.py test` with 77 tests, backend `pip check`, `docker compose` config validation for dev/prod, and `npm run build`.
- Vite build tooling pass checks: route-level lazy split removes the previous chunk-size warning; largest local build chunks are split into course data, Shiki language chunks, React vendor and page chunks instead of one large initial `index` chunk.
- `npm audit --audit-level=low` still reports one low-severity transitive `esbuild` advisory through `vite@7.3.5`. Current Vite 7 range cannot safely resolve `esbuild@0.28.1`; Vite 8 changes the build toolchain and remains a separate tooling migration.
- Last frontend checks for AI assistant refactor passed: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`.
- Production smoke passed for `nginx-health`, `api/health`, `/`, `/tasks/00-01-minimal-program` and `/courses/oop-cpp/delegating-constructors`.
- Browser QA covered production AI assistant on `/courses/oop-cpp/delegating-constructors` in desktop light/dark/deep-dark and `/tasks/00-01-minimal-program` on mobile deep-dark with cache-busting hash `cdf62d8`; submit, loading, error, scroll-to-latest, resize/open/close and horizontal overflow checks passed.
- Last frontend checks for frontend quality hardening passed: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`.
- Production smoke passed for `nginx-health`, `api/health`, `/`, `/tasks`, `/tasks/00-01-minimal-program`, `/courses/oop-cpp/delegating-constructors`, `/login` and `/register`.
- Browser QA covered production `/`, `/tasks`, `/tasks/00-01-minimal-program`, `/courses/oop-cpp/delegating-constructors`, `/login`, `/register` and `/profile` guest redirect with cache-busting hash `0475b21`; no guest refresh requests, unexpected console errors or horizontal overflow found.
- Last frontend checks for frontend foundation hardening passed: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`.
- Production smoke passed for `nginx-health`, `api/health`, `/login`, `/register`, `/tasks`, `/tasks/00-01-minimal-program` and `/courses/oop-cpp/delegating-constructors`.
- Browser QA covered production `/login`, `/register`, `/tasks`, `/tasks/00-01-minimal-program` and `/courses/oop-cpp/delegating-constructors` with cache-busting hash `a2c4b29`.
- Last frontend checks for pre-section UI quality pass passed: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`.
- Production smoke passed for `nginx-health`, `api/health`, `/profile`, `/tasks/00-01-minimal-program` and `/courses/oop-cpp/delegating-constructors`.
- Browser QA covered `/profile`, CodeBlock pages locally and on production in desktop/mobile, light/dark/deep-dark, copy action and AI selection popover; no horizontal overflow found.
- Last frontend checks for CodeBlock hotfix passed: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`.
- Production smoke passed for `nginx-health`, `api/health`, `/tasks/00-01-minimal-program` and `/courses/oop-cpp/delegating-constructors`.
- Browser QA covered CodeBlock pages locally and on production in desktop/mobile, dark/deep-dark; no horizontal overflow found.
- Last frontend checks for P2 deploy passed: `npm run typecheck`, `npm run lint`, `npm run build`.
- Production smoke passed for `/`, `/courses`, `/tasks`, `/login`, `/courses/oop-cpp/delegating-constructors`, `/tasks/task5-2-worker` and health checks.
- Browser QA covered `/courses`, `/courses/oop-cpp/delegating-constructors`, `/tasks/task5-2-worker`, AI assistant and profile/login redirect; no console errors or horizontal overflow.
- Vite chunk-size warning was fixed locally in `fix/vite-build-tooling-pass`; deploy the branch before treating it as production state.
- Docs-only changes should run only repository checks unless code changes accidentally appear.

## Known Issues

- `docs/course-content-plan.md` may contain old wording for early sections 6-7; update only in a dedicated course-plan pass.
- База C++ sections 0-4 remain `needs-theory`; CoursePage shows placeholder pages for them.
- If real production secrets were pushed or shared before the security pass, manual rotation and history cleanup are still required.
- Page-level lazy loading, auth reset event cleanup and a unit test runner remain future frontend tasks.
- Auth/session behavior passed the current stability audit. Further auth work should be driven by confirmed product/backend requirements, not by the old generic backlog item.

## Do Not Do Now

- Do not push or deploy unless explicitly requested.
- Section 11 can start next; keep it scoped to course/content unless a confirmed blocker appears.
- Do not continue 9.2, 10.1, 10.2 before 11-12 are closed.
- Do not add section 12 before section 11.
- Do not mix content work with Docker/nginx/security changes.
