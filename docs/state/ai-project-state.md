# AI Project State

Короткий снимок текущего состояния. Порядок дальнейшей разработки живёт в [product-roadmap.md](../product/product-roadmap.md); постоянные правила — в [AGENTS.md](../../AGENTS.md).

## Verified Git Snapshot

Проверено локально и production deploy 2026-07-01:

- Production deployed app hash: `0e8b81a`; previous deployed hash and rollback target: `7d10f24`.
- Current deployed runtime merge: `0e8b81a Merge checker admin content readiness`; latest runtime main hash before this docs-only state update: `0e8b81a`.
- Production backup: `/opt/uchicode/app/backups/20260701T191337Z`.
- VPS закреплён на clean detached `HEAD` `0e8b81a`.
- Local foundation commits: `a38c34e Add checker data foundation`, `352919f Add checker draft flow`, `7fa498d Consolidate documentation roadmap`, `2760cff Organize documentation structure`.
- Integration hardening commits: `0a7b12f Harden checker admin foundation`, `c9ebb39 Complete product foundation UI pass`.
- Этот post-deploy state update является docs-only и не требует повторного production deploy.

## Production

- Public `/` работает вне `AppLayout`; app routes остаются внутри app-shell.
- Product foundation phase 1, HomePage/UI pass, checker backend foundation и frontend draft flow задеплоены.
- Route loading, responsive/mobile layout и visual UI cleanup остаются задеплоены.
- Vite 8 tooling задеплоен; frontend audit был clean на последней проверенной release line.
- `CHECKER_EXECUTION_ENABLED=false`; runner, execution queue и выполнение пользовательского C++ кода отсутствуют.
- Production checker task versions и hidden tests не добавлены: `CheckerTaskVersion=0`, `TestCase=0`.
- Без production task version task page не показывает draft/checker UI; checker availability fail-closed.
- 2026-07-01 deploy check for `0e8b81a`: `/nginx-health`, `/api/health`, listed product routes, admin redirect, checker availability, backend/nginx logs and browser smoke passed.
- Backend/frontend checks, CI, migration `checker.0002_normalize_status_names`, production health checks и HTTP smoke прошли; rollback не потребовался.
- Подробное production-состояние перед операцией сверять по [deploy/docs/01_CURRENT_STATE.md](../../deploy/docs/01_CURRENT_STATE.md) и фактическому VPS.

## GitHub Pages

- GitHub Pages is enabled as legacy Pages from branch `dist` with public URL `https://sandroz1.github.io/course/`.
- It has no custom CNAME, is not referenced by repo workflows/docs as production, and is not a required protection/ruleset check on `main`.
- Production remains VPS + host Nginx + Docker Compose at `https://uchicode.ru`.
- Pages can be disabled manually in GitHub Settings if it is no longer needed, but it is not a blocker for the current VPS production flow.

## Deployed Product Foundation

- `apps.checker`: versioned task data, attempts, submissions, test cases, permissions and fail-closed API contracts.
- Task page: typed checker client и draft-only блок «Моя попытка» для checker-configured tasks.
- Authenticated users могут сохранять/восстанавливать draft; guests видят требование входа.
- Checker-enabled task нельзя вручную перевести в `solved` без accepted checker result.
- Runner и выполнение пользовательского C++ кода не добавлены; submission без runner возвращает controlled `503` и не создаётся.
- Checker admin не позволяет обойти immutable-правила через bulk delete; attempts доступны в admin только для чтения.
- HomePage и затронутые mobile surfaces прошли UI cleanup; public `/` по-прежнему работает вне `AppLayout`.
- Production browser QA проверил основные routes, CTA, mobile navigation и light/dark/deep-dark без horizontal overflow и console errors.

## Runner Prototype

- Isolated standalone C++ runner prototype added under `tools/runner_prototype/` on branch `codex/isolated-runner-prototype`.
- Prototype is Python stdlib only and uses synthetic local snippets; it has no backend API, frontend UI, queue, Docker/VPS or production integration.
- Prototype tests passed in a disposable non-production Linux container with `g++`; local Windows run is only an unsupported smoke path.
- No-network proof is not claimed by the Python harness. Dedicated worker VM/container/firewall no-network validation remains a blocker before API-integrated runner or production enablement.
- Worker provisioning/security packet is prepared in [runner-worker-provisioning.md](../platform/runner-worker-provisioning.md); dedicated VM/access are not confirmed yet, validation has not started, and the packet must pass on a dedicated non-production Linux worker VM before API-integrated runner work.
- Backend checker status names are normalized to canonical runner design values before API-integrated runner work.
- Backend runner adapter contract exists as internal DTO/protocol/mapping plus a fail-closed `DisabledRunner` provider used by the checker service layer. No Piston client, real provider, queue or execution integration exists.
- Frontend checker UI supports the honest disabled/draft state only: authenticated users can save drafts, guests see the login requirement, and no compiling/running/result lifecycle is shown.
- Task page now has a reusable in-browser C++ editor for checker-configured tasks. Users can write code on the site and save drafts; check/submit remains unavailable until worker VM/Piston/API integration is completed.
- Task page also has a reusable checker result UI foundation for future real submissions. It renders nothing without a real submission and does not add polling, fake results or execution.
- Checker admin/content readiness is deployed with admin readiness counts and [checker-task-authoring.md](../platform/checker-task-authoring.md). Production task versions and hidden tests are still not seeded.
- Project-local Codex skills for guardrails, frontend quality, checker/runner and deploy safety are merged into main and documented in [agent-skills.md](../platform/agent-skills.md).
- Production deployed app hash is `0e8b81a`; `CHECKER_EXECUTION_ENABLED=false`, production task versions and hidden tests are still absent.

## Course State

- OOP C++ sections 0-10 готовы в текущей course line.
- Sections 11 «Инкапсуляция» и 12 «Исключения» не начаты и не являются deploy blocker.
- Content work возобновляется только в phases 7-8 [product roadmap](../product/product-roadmap.md).

## Next Stage

Фазы 0-3 завершены, product foundation задеплоен. Phase 4 runner design review выполнен docs-only: [runner-design.md](../platform/runner-design.md) approved for isolated non-production prototype planning with a dedicated worker VM target. Standalone prototype добавлен в `tools/runner_prototype/`, но production execution и API integration отсутствуют. Backend checker statuses нормализованы под canonical runner design names; runner adapter contract and fail-closed `DisabledRunner` service boundary exist only for the current disabled state. Frontend result UI foundation is hidden until real submission data exists. Следующий gate: create/validate a dedicated non-production worker VM using [runner-worker-provisioning.md](../platform/runner-worker-provisioning.md), including no-network/no-secrets proof before API-integrated runner. Piston является preferred future runner target только после этих gates. Sections 11/12 не начаты.

## Read For Details

- Documentation map: [README.md](../README.md).
- Product order and current restrictions: [product-roadmap.md](../product/product-roadmap.md).
- Checker technical design: [learning-loop-checker-design.md](../platform/learning-loop-checker-design.md).
- Checker task authoring: [checker-task-authoring.md](../platform/checker-task-authoring.md).
- Runner threat model: [runner-design.md](../platform/runner-design.md).
- Runner worker provisioning/security: [runner-worker-provisioning.md](../platform/runner-worker-provisioning.md).
- UI rules: [frontend-ui-standards.md](../frontend/frontend-ui-standards.md).
- Course plans: [course-content-plan.md](../courses/course-content-plan.md), [base-cpp-course-plan.md](../courses/base-cpp-course-plan.md).
- Deploy operations: [DEPLOY.md](../../DEPLOY.md), [deploy/docs/README.md](../../deploy/docs/README.md).
