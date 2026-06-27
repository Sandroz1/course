# Documentation Index

Главная карта документации Uchicode. Если документ ниже описывает подробный процесс, здесь остается только ссылка и роль документа.

## Читать первым

- [../README.md](../README.md) - короткий обзор проекта, стек и основные ссылки.
- [../AGENTS.md](../AGENTS.md) - постоянные правила для Codex/AI-агентов.
- [ai-project-state.md](ai-project-state.md) - текущее состояние, последние важные задачи и ближайший следующий шаг.

## Новичку в проекте

1. [../README.md](../README.md) - что это за проект и где что лежит.
2. [LOCAL_RUNBOOK.md](../LOCAL_RUNBOOK.md) - локальный запуск frontend/backend и базовые проверки.
3. [ARCHITECTURE.md](ARCHITECTURE.md) - структура frontend и граница layout/content data.
4. [frontend-test-strategy.md](frontend-test-strategy.md) - какие проверки доступны сейчас.

## Codex Перед Задачей

- Общие правила: [../AGENTS.md](../AGENTS.md).
- Текущее состояние и next task: [ai-project-state.md](ai-project-state.md).
- Frontend UI: [frontend-ui-standards.md](frontend-ui-standards.md).
- Course/theory content: [theory-content-standards.md](theory-content-standards.md).
- Security: [pre-commit-security.md](pre-commit-security.md).
- Deploy: [../DEPLOY.md](../DEPLOY.md) и [../deploy/docs/README.md](../deploy/docs/README.md).

## Frontend

- [ARCHITECTURE.md](ARCHITECTURE.md) - структура `site/src`, routing, pages/shared/components/content/tasks/api, добавление section/task.
- [frontend-ui-standards.md](frontend-ui-standards.md) - визуальные правила, карточки, статусы, inline-code, адаптивность.
- [frontend-test-strategy.md](frontend-test-strategy.md) - текущие frontend checks и ручной smoke.
- [../site/src/styles/README.md](../site/src/styles/README.md) - краткая карта global styles.

## Platform Design

- [learning-loop-checker-design.md](learning-loop-checker-design.md) - согласованные границы Learning Loop 2.0, versioned attempts/submissions и безопасного C++ Checker MVP.

## Courses And Content

- [theory-content-standards.md](theory-content-standards.md) - структура теории, примеры, ошибки, самопроверка, источники.
- [course-content-plan.md](course-content-plan.md) - рабочий план курса ООП C++.
- [base-cpp-course-plan.md](base-cpp-course-plan.md) - план отдельного курса "База C++".
- [../practice/README.md](../practice/README.md) - internal role of practice starter files; ordinary site users should not need this folder.

## Security

- [pre-commit-security.md](pre-commit-security.md) - как не коммитить секреты и как проверить индекс/историю.
- [security-incident-runbook.md](security-incident-runbook.md) - порядок действий при подозрении на утечку env/secrets.
- [security-release-checklist.md](security-release-checklist.md) - checklist перед релизом.
- [../deploy/docs/05_SECURITY_SECRETS_ACCESS.md](../deploy/docs/05_SECURITY_SECRETS_ACCESS.md) - production secrets/access на VPS.

## Deploy, Docker, Migrations, Backup, Rollback

- [../DEPLOY.md](../DEPLOY.md) - короткий deploy entrypoint.
- [../deploy/README.md](../deploy/README.md) - production deploy overview.
- [../deploy/docs/README.md](../deploy/docs/README.md) - полный индекс production runbooks.
- [../deploy/docs/02_DEPLOY_FROM_ZERO.md](../deploy/docs/02_DEPLOY_FROM_ZERO.md) - первый запуск VPS, Docker Compose, `.env.production`, nginx, HTTPS.
- [../deploy/docs/03_UPDATE_ROLLBACK_HOTFIX.md](../deploy/docs/03_UPDATE_ROLLBACK_HOTFIX.md) - update, migrations, rollback, hotfix.
- [../deploy/docs/06_BACKUP_RESTORE.md](../deploy/docs/06_BACKUP_RESTORE.md) - backup/restore PostgreSQL, media/staticfiles.
- [../deploy/docs/09_POST_DEPLOY_CHECKLIST.md](../deploy/docs/09_POST_DEPLOY_CHECKLIST.md) - post-deploy checks.
- [../SMOKE_TESTS.md](../SMOKE_TESTS.md) - production smoke tests.
- [../DEPLOY_SSL.md](../DEPLOY_SSL.md) - отдельный HTTPS runbook.

## Status And Audit

- [ai-project-state.md](ai-project-state.md) - актуальное состояние разработки.
- [../PROJECT_STATUS.md](../PROJECT_STATUS.md) - совместимый короткий указатель на актуальные status docs.
- [documentation-audit.md](documentation-audit.md) - заметки по состоянию документации и что было упорядочено.
- [presentation/README.md](presentation/README.md) - материалы для демонстрации, защиты и продуктового разбора.
- [../deploy/docs/01_CURRENT_STATE.md](../deploy/docs/01_CURRENT_STATE.md) - текущее production-состояние. Перед deploy сверять с реальным VPS.

## Правила Поддержки Документации

- Один полный процесс должен жить в одном документе.
- В остальных местах оставлять короткую ссылку, а не копию инструкции.
- Не хранить текущее состояние в нескольких местах. Для разработки использовать `docs/ai-project-state.md`, для production - `deploy/docs/01_CURRENT_STATE.md`.
- Если факт не проверен в текущем проходе, писать `needs verification`, а не утверждать его как актуальный.
