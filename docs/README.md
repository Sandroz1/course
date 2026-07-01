# Documentation Index

Главный вход в документацию Uchicode. Этот файл показывает, где лежит актуальное состояние, roadmap, архитектура, UI-правила, course docs, platform docs, security docs, deploy docs и presentation materials.

## Read First

1. [../README.md](../README.md) — что такое проект и как он устроен.
2. [../AGENTS.md](../AGENTS.md) — обязательные правила для Codex/AI.
3. [state/ai-project-state.md](state/ai-project-state.md) — короткий current snapshot и следующий шаг.
4. [product/product-roadmap.md](product/product-roadmap.md) — единый порядок продуктовых фаз и `Do not do now`.

Новый разработчик затем читает [../LOCAL_RUNBOOK.md](../LOCAL_RUNBOOK.md) и [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md).

## Structure

- `state/` — current state, documentation audit/status.
- `product/` — product roadmap and public HomePage plan.
- `architecture/` — frontend/application architecture.
- `frontend/` — UI standards and frontend test strategy.
- `courses/` — course plans and theory/content standards.
- `platform/` — Learning Loop, checker contracts, runner threat model and worker provisioning gates.
- `security/` — pre-commit security, incident and release checklists.
- `presentation/` — presentation materials for demos and product discussion.

## Route By Task

- Current work: [state/ai-project-state.md](state/ai-project-state.md).
- Product sequence: [product/product-roadmap.md](product/product-roadmap.md).
- Frontend architecture: [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md).
- UI/HomePage: [frontend/frontend-ui-standards.md](frontend/frontend-ui-standards.md), [product/homepage-landing-plan.md](product/homepage-landing-plan.md).
- Frontend checks: [frontend/frontend-test-strategy.md](frontend/frontend-test-strategy.md).
- Checker/API contracts: [platform/learning-loop-checker-design.md](platform/learning-loop-checker-design.md).
- Checker task authoring: [platform/checker-task-authoring.md](platform/checker-task-authoring.md).
- Runner design/threat model: [platform/runner-design.md](platform/runner-design.md).
- Runner worker provisioning/security: [platform/runner-worker-provisioning.md](platform/runner-worker-provisioning.md).
- Course content: [courses/theory-content-standards.md](courses/theory-content-standards.md), [courses/course-content-plan.md](courses/course-content-plan.md), [courses/base-cpp-course-plan.md](courses/base-cpp-course-plan.md).
- Practice starter sources: [../practice/README.md](../practice/README.md).
- Local setup: [../LOCAL_RUNBOOK.md](../LOCAL_RUNBOOK.md).
- Deploy/rollback/backup: [../DEPLOY.md](../DEPLOY.md), [../deploy/docs/README.md](../deploy/docs/README.md).
- Security/secrets: [security/pre-commit-security.md](security/pre-commit-security.md), [security/security-incident-runbook.md](security/security-incident-runbook.md), [security/security-release-checklist.md](security/security-release-checklist.md).
- Presentation: [presentation/README.md](presentation/README.md).

## Status Sources

- Development/current work: [state/ai-project-state.md](state/ai-project-state.md).
- Product sequence: [product/product-roadmap.md](product/product-roadmap.md).
- Production infrastructure: [../deploy/docs/01_CURRENT_STATE.md](../deploy/docs/01_CURRENT_STATE.md), verified against VPS before an operation.
- Legacy status entrypoint: [../PROJECT_STATUS.md](../PROJECT_STATUS.md).
- Documentation consolidation audit: [state/documentation-audit.md](state/documentation-audit.md).

## Documentation Rules

- One full process lives in one specialized document; other docs link to it.
- Current state does not store the full roadmap or long release history.
- If docs conflict with git/code/VPS, record and resolve the conflict before implementation.
- Mark unverified runtime/production facts as `needs verification`.
- Docs-only task: run markdown/link/git checks. Runtime task: run checks for the affected area.
