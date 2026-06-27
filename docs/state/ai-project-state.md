# AI Project State

Короткий снимок текущего состояния. Порядок дальнейшей разработки живёт в [product-roadmap.md](../product/product-roadmap.md); постоянные правила — в [AGENTS.md](../../AGENTS.md).

## Verified Git Snapshot

Проверено локально 2026-06-28:

- Production deployed app hash: `cc8d75d` по последней зафиксированной успешной публикации. VPS в этом docs-only проходе не проверялся; перед deploy сверить server `HEAD`.
- `origin/main`: `546015d`.
- Local `main`: `43a827f` (design merge локально, не pushed).
- Current implementation branch: `codex/checker-data-foundation`.
- Local checker commits: `a38c34e Add checker data foundation`, `352919f Add checker draft flow`.
- Working tree был чистым до этого docs-only pass.

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

## Course State

- OOP C++ sections 0-10 готовы в текущей course line.
- Sections 11 «Инкапсуляция» и 12 «Исключения» не начаты и не являются deploy blocker.
- Content work возобновляется только в phases 7-8 [product roadmap](../product/product-roadmap.md).

## Next Stage

Phase 1: HomePage redesign + site-wide UI audit. После него — review/merge checker draft flow, затем отдельный stable deploy. Runner не является немедленным следующим шагом.

## Read For Details

- Documentation map: [README.md](../README.md).
- Product order and current restrictions: [product-roadmap.md](../product/product-roadmap.md).
- Checker and runner technical design: [learning-loop-checker-design.md](../platform/learning-loop-checker-design.md).
- UI rules: [frontend-ui-standards.md](../frontend/frontend-ui-standards.md).
- Course plans: [course-content-plan.md](../courses/course-content-plan.md), [base-cpp-course-plan.md](../courses/base-cpp-course-plan.md).
- Deploy operations: [DEPLOY.md](../../DEPLOY.md), [deploy/docs/README.md](../../deploy/docs/README.md).
