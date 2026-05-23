# Documentation index

Этот каталог содержит планы курсов и общую проектную документацию. Production runbooks лежат отдельно в `deploy/docs`.

## Project

- [../README.md](../README.md) — краткий обзор проекта.
- [../PROJECT_STATUS.md](../PROJECT_STATUS.md) — текущее состояние frontend, backend, production и рисков.
- [../LOCAL_RUNBOOK.md](../LOCAL_RUNBOOK.md) — локальный запуск и проверки.
- [../SMOKE_TESTS.md](../SMOKE_TESTS.md) — smoke-проверки после деплоя.
- [documentation-audit.md](documentation-audit.md) — результаты аудита документации.
- [security-release-checklist.md](security-release-checklist.md) — security checklist перед release.

## Production

- [../DEPLOY.md](../DEPLOY.md) — короткий deploy entrypoint.
- [../DEPLOY_SSL.md](../DEPLOY_SSL.md) — короткая памятка по HTTPS.
- [../deploy/README.md](../deploy/README.md) — обзор production-схемы.
- [../deploy/docs/README.md](../deploy/docs/README.md) — полный комплект VPS runbooks.

## Courses

- [base-cpp-course-plan.md](base-cpp-course-plan.md) — план отдельного курса "База C++".
- [course-content-plan.md](course-content-plan.md) — план курса "ООП C++".

## Правила поддержки документации

- Один источник деталей по production: `deploy/docs`.
- Корневые `DEPLOY.md`, `DEPLOY_SSL.md`, `SMOKE_TESTS.md` держать короткими и ссылаться на runbooks.
- Не писать в docs реальные секреты, приватные ключи, пароли, backup paths с приватными данными.
- Если меняется API prefix или production compose, обновлять `README.md`, `PROJECT_STATUS.md`, `SMOKE_TESTS.md` и `deploy/docs`.
- Если меняется порядок курсов или статусы разделов, обновлять `docs/base-cpp-course-plan.md` и `docs/course-content-plan.md`.
