# Uchicode

Uchicode — учебная платформа по C++ с курсами «База C++» и «ООП C++», практическими задачами, справочником ошибок, progress и AI assistant.

## Start Here

- [docs/README.md](docs/README.md) — главный индекс документации.
- [docs/state/ai-project-state.md](docs/state/ai-project-state.md) — текущее состояние.
- [docs/product/product-roadmap.md](docs/product/product-roadmap.md) — единый product roadmap.
- [AGENTS.md](AGENTS.md) — правила для Codex/AI.
- [LOCAL_RUNBOOK.md](LOCAL_RUNBOOK.md) — локальный запуск и проверки.
- [DEPLOY.md](DEPLOY.md) — production entrypoint.

## Stack And Structure

- `site/` — React + TypeScript + Vite frontend.
- `backend/` — Django REST Framework API.
- `site/src/content` и `site/src/data` — учебный контент, courses, sections и tasks.
- `practice/` — internal starter sources; обычный пользователь работает с кодом на task page.
- `docs/` — architecture, product, UI, course and security documentation.
- `deploy/` и `docker-compose*.yml` — production infrastructure and runbooks.

Production использует Docker Compose, host Nginx, PostgreSQL и Redis. Подробные команды намеренно находятся только в профильных runbooks.

## Focused Documentation

- Frontend: [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md), [docs/frontend/frontend-ui-standards.md](docs/frontend/frontend-ui-standards.md).
- Checker/runner: [docs/platform/learning-loop-checker-design.md](docs/platform/learning-loop-checker-design.md).
- Course content: [docs/courses/theory-content-standards.md](docs/courses/theory-content-standards.md).
- Security: [docs/security/pre-commit-security.md](docs/security/pre-commit-security.md).
- Production: [deploy/docs/README.md](deploy/docs/README.md).
