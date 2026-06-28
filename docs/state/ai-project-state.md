# AI Project State

Короткий снимок текущего состояния. Порядок дальнейшей разработки живёт в [product-roadmap.md](../product/product-roadmap.md); постоянные правила — в [AGENTS.md](../../AGENTS.md).

## Verified Git Snapshot

Проверено локально 2026-06-28:

- Production deployed app hash: `cc8d75d` по последней зафиксированной успешной публикации. VPS в этом docs-only проходе не проверялся; перед deploy сверить server `HEAD`.
- `origin/main`: `546015d`.
- Product foundation local merge commit on `main`: `39fb8cc` (не pushed).
- Retained integration branch: `codex/product-foundation-phase-1`.
- Local foundation commits: `a38c34e Add checker data foundation`, `352919f Add checker draft flow`, `7fa498d Consolidate documentation roadmap`, `2760cff Organize documentation structure`.
- Integration hardening commits: `0a7b12f Harden checker admin foundation`, `c9ebb39 Complete product foundation UI pass`.
- Integration branch локально merged в `main`; `main` не pushed, runtime не deployed, ветка сохранена до успешного deploy.

## Production

- Public `/` работает вне `AppLayout`; app routes остаются внутри app-shell.
- Route loading, responsive/mobile layout и visual UI cleanup задеплоены.
- Vite 8 tooling задеплоен; frontend audit был clean на последней проверенной release line.
- Production checker execution отсутствует; production checker task versions и hidden tests не добавлены.
- Подробное production-состояние перед операцией сверять по [deploy/docs/01_CURRENT_STATE.md](../../deploy/docs/01_CURRENT_STATE.md) и фактическому VPS.

## Local Work Not Pushed Or Deployed

- `apps.checker`: versioned task data, attempts, submissions, test cases, permissions and fail-closed API contracts.
- Task page: typed checker client и draft-only блок «Моя попытка» для checker-configured tasks.
- Authenticated users могут сохранять/восстанавливать draft; guests видят требование входа.
- Checker-enabled task нельзя вручную перевести в `solved` без accepted checker result.
- Runner и выполнение пользовательского C++ кода не добавлены; submission без runner возвращает controlled `503` и не создаётся.
- Checker admin не позволяет обойти immutable-правила через bulk delete; attempts доступны в admin только для чтения.
- HomePage и затронутые mobile surfaces прошли UI cleanup; public `/` по-прежнему работает вне `AppLayout`.
- Desktop/mobile browser QA проверил основные routes, CTA, mobile navigation, guest/auth draft save/restore и light/dark/deep-dark без horizontal overflow.

## Course State

- OOP C++ sections 0-10 готовы в текущей course line.
- Sections 11 «Инкапсуляция» и 12 «Исключения» не начаты и не являются deploy blocker.
- Content work возобновляется только в phases 7-8 [product roadmap](../product/product-roadmap.md).

## Next Stage

Фазы 0-2 локально merged в `main`; backend/frontend checks и browser QA после merge прошли. Следующий шаг — отдельный stable deploy по фазе 3. Runner остаётся будущей фазой 4 и не является немедленным следующим шагом.

## Read For Details

- Documentation map: [README.md](../README.md).
- Product order and current restrictions: [product-roadmap.md](../product/product-roadmap.md).
- Checker and runner technical design: [learning-loop-checker-design.md](../platform/learning-loop-checker-design.md).
- UI rules: [frontend-ui-standards.md](../frontend/frontend-ui-standards.md).
- Course plans: [course-content-plan.md](../courses/course-content-plan.md), [base-cpp-course-plan.md](../courses/base-cpp-course-plan.md).
- Deploy operations: [DEPLOY.md](../../DEPLOY.md), [deploy/docs/README.md](../../deploy/docs/README.md).
