# Documentation Index

Главный вход в документацию Uchicode. Здесь указана роль каждого документа; подробные инструкции не дублируются.

## Read First

1. [../README.md](../README.md) — что такое проект и его структура.
2. [../AGENTS.md](../AGENTS.md) — обязательные правила для Codex/AI.
3. [ai-project-state.md](ai-project-state.md) — короткий current snapshot.
4. [product-roadmap.md](product-roadmap.md) — единый порядок продуктовых фаз и `Do not do now`.

Новый разработчик затем читает [../LOCAL_RUNBOOK.md](../LOCAL_RUNBOOK.md) и [ARCHITECTURE.md](ARCHITECTURE.md).

## Route By Task

- Frontend architecture: [ARCHITECTURE.md](ARCHITECTURE.md).
- UI/HomePage: [frontend-ui-standards.md](frontend-ui-standards.md), [homepage-landing-plan.md](homepage-landing-plan.md).
- Frontend checks: [frontend-test-strategy.md](frontend-test-strategy.md).
- Checker/runner: [learning-loop-checker-design.md](learning-loop-checker-design.md).
- Course content: [theory-content-standards.md](theory-content-standards.md), [course-content-plan.md](course-content-plan.md), [base-cpp-course-plan.md](base-cpp-course-plan.md).
- Practice starter sources: [../practice/README.md](../practice/README.md).
- Local setup: [../LOCAL_RUNBOOK.md](../LOCAL_RUNBOOK.md).
- Deploy/rollback/backup: [../DEPLOY.md](../DEPLOY.md), [../deploy/docs/README.md](../deploy/docs/README.md).
- Security/secrets: [pre-commit-security.md](pre-commit-security.md), [security-incident-runbook.md](security-incident-runbook.md), [security-release-checklist.md](security-release-checklist.md).
- Presentation: [presentation/README.md](presentation/README.md).

## Status Sources

- Development/current work: [ai-project-state.md](ai-project-state.md).
- Product sequence: [product-roadmap.md](product-roadmap.md).
- Production infrastructure: [../deploy/docs/01_CURRENT_STATE.md](../deploy/docs/01_CURRENT_STATE.md), verified against VPS before an operation.
- Legacy status links: [../PROJECT_STATUS.md](../PROJECT_STATUS.md).
- Documentation consolidation audit: [documentation-audit.md](documentation-audit.md).

## Documentation Rules

- Один полный процесс живёт в одном профильном документе; остальные docs дают короткую ссылку.
- Current state не хранит полный roadmap или длинную release history.
- Если docs конфликтуют с git/code/VPS, сначала зафиксировать конфликт и обновить docs, а не выбирать случайную версию.
- Непроверенный runtime/production факт помечать `needs verification`.
- Docs-only task: только markdown checks. Runtime task: проверки соответствующей зоны.
