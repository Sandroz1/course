# Uchicode

Uchicode - учебная платформа по C++ с курсами "База C++" и "ООП C++".

## Где начинать

- [docs/README.md](docs/README.md) - главная карта документации.
- [docs/ai-project-state.md](docs/ai-project-state.md) - текущее состояние проекта и ближайшая задача.
- [AGENTS.md](AGENTS.md) - правила для Codex/AI-агентов.
- [LOCAL_RUNBOOK.md](LOCAL_RUNBOOK.md) - локальный запуск и проверки.
- [DEPLOY.md](DEPLOY.md) - короткий вход в production deploy.

## Стек

- Frontend: React + TypeScript + Vite, основная зона `site/src`.
- Backend: Django, зона `backend`.
- Production: Docker Compose, host Nginx, PostgreSQL, Redis.
- Учебный контент: `site/src/content/course`, `site/src/data`, `practice`.

## Структура

- `site/` - frontend.
- `backend/` - Django backend.
- `docs/` - архитектура, правила курса, security и текущее состояние.
- `deploy/` - production compose/nginx/scripts и deploy runbooks.
- `practice/` - стартовые файлы практических задач.
- `docker-compose*.yml` - локальная и production compose-конфигурация.

## Локальный запуск

Подробная инструкция находится в [LOCAL_RUNBOOK.md](LOCAL_RUNBOOK.md).

Коротко для frontend:

```powershell
cd site
npm install
npm run dev
```

Коротко для backend см. [LOCAL_RUNBOOK.md](LOCAL_RUNBOOK.md), потому что команды зависят от `.venv`, `.env` и локальной базы.

## Проверки

Frontend:

```powershell
cd site
npm run typecheck
npm run lint
npm run build
```

Backend:

```powershell
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

Docs-only изменения обычно проверяются так:

```powershell
git diff --check
git status -sb
git diff --stat
```

## Документация по зонам

- Frontend architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- Frontend UI rules: [docs/frontend-ui-standards.md](docs/frontend-ui-standards.md).
- Course content rules: [docs/theory-content-standards.md](docs/theory-content-standards.md).
- OOP C++ plan: [docs/course-content-plan.md](docs/course-content-plan.md).
- Security checks: [docs/pre-commit-security.md](docs/pre-commit-security.md).
- Secret leak runbook: [docs/security-incident-runbook.md](docs/security-incident-runbook.md).
- Full production docs: [deploy/docs/README.md](deploy/docs/README.md).

## Безопасность

Не коммить реальные `.env*`, ключи, базы, backups и приватные данные. Для примеров использовать только placeholder-файлы. При подозрении на утечку секретов следовать [docs/security-incident-runbook.md](docs/security-incident-runbook.md).
