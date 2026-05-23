# Uchicode

Uchicode — учебная платформа по C++ с отдельными маршрутами для базового C++ и ООП C++.

## Текущее состояние

- Frontend: React, Vite, TypeScript.
- Backend: Django REST Framework.
- Production: VPS `play2go.cloud`, Docker Compose, host Nginx, HTTPS для `uchicode.ru`.
- API работает same-origin через `/api`; frontend endpoints должны быть относительными к base URL `/api`.
- `origin/main` содержит hotfix `1cfbdb5 Fix frontend API paths`, который убирает ошибку `/api/api/...`.
- `v0.1.2` может запускать production deploy через GitHub Actions при push tag `v*`; tag публиковать только осознанно.

## Курсы

- `base-cpp` — отдельный курс "База C++". Сейчас готовы условия и циклы `for`, `while`, `do while`; ранние темы до условий помечены как теория на доработке.
- `oop-cpp` — отдельный курс по ООП C++. Он не должен смешиваться с `base-cpp`.

## Структура проекта

```text
site/                    Frontend React/Vite/TypeScript
backend/                 Django REST Framework API
docker/                  Docker nginx для production
deploy/                  VPS, nginx, systemd, backup и deploy docs
docs/                    Планы курсов и общая документация
practice/                Практические материалы
docker-compose.dev.yml   Локальная Docker-среда
docker-compose.prod.yml  Production Docker Compose
.env.production.example  Шаблон production env
```

## Карта документации

- [docs/README.md](docs/README.md) — общий индекс документации.
- [PROJECT_STATUS.md](PROJECT_STATUS.md) — текущее состояние проекта.
- [LOCAL_RUNBOOK.md](LOCAL_RUNBOOK.md) — локальный запуск и проверки.
- [SMOKE_TESTS.md](SMOKE_TESTS.md) — smoke-проверки после деплоя.
- [DEPLOY.md](DEPLOY.md) — короткий deploy entrypoint.
- [deploy/docs/README.md](deploy/docs/README.md) — полный комплект production-инструкций.
- [docs/base-cpp-course-plan.md](docs/base-cpp-course-plan.md) — план курса "База C++".
- [docs/course-content-plan.md](docs/course-content-plan.md) — план курса "ООП C++".

## Архитектура

```text
Browser
  -> https://uchicode.ru
  -> host Nginx 80/443 + Let's Encrypt
  -> Docker nginx 127.0.0.1:8080
  -> backend:8000 inside Docker network
  -> PostgreSQL / Redis inside Docker network
```

Наружу не должны публиковаться:

```text
backend:8000
postgres:5432
redis:6379
Docker nginx на 0.0.0.0:8080
```

## Локальный запуск frontend

```bash
cd site
npm install
npm run dev
```

Vite проксирует `/api` и `/admin` на локальный backend `http://127.0.0.1:8000`.

## Локальный запуск backend

Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Health:

```bash
curl http://127.0.0.1:8000/api/health/
```

## Локальный запуск через Docker

```bash
docker compose -f docker-compose.dev.yml up --build
```

## Проверки перед push

Frontend:

```bash
cd site
npm run typecheck
npm run build
npm run lint
```

Backend:

```powershell
cd backend
.venv\Scripts\python.exe manage.py check
.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.venv\Scripts\python.exe manage.py test
```

Production compose:

```bash
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml build --pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
curl -fsS http://127.0.0.1:8080/nginx-health
curl -fsS http://127.0.0.1:8080/api/health
docker compose -f docker-compose.prod.yml down
```

## Env

Реальные env-файлы не коммитить:

```text
.env
.env.production
site/.env.local
backend/.env
```

Production backend читает основные переменные:

```text
DJANGO_DEBUG
DJANGO_SECRET_KEY
DJANGO_ALLOWED_HOSTS
DJANGO_CSRF_TRUSTED_ORIGINS
DJANGO_CORS_ALLOWED_ORIGINS
DATABASE_URL
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
REDIS_URL
QWEN_API_KEY
SMS_PROVIDER
```

Production frontend по умолчанию использует:

```env
VITE_API_BASE_URL=/api
```

Endpoint в frontend должен быть без второго `/api`, например `/auth/register/`, чтобы итоговый URL был `/api/auth/register/`.

## Production

Основные инструкции:

```text
deploy/docs/02_DEPLOY_FROM_ZERO.md
deploy/docs/03_UPDATE_ROLLBACK_HOTFIX.md
deploy/docs/09_POST_DEPLOY_CHECKLIST.md
```

Быстрый health-check:

```bash
curl -fsS https://uchicode.ru/nginx-health
curl -fsS https://uchicode.ru/api/health
```

## Безопасность

- Не отправлять в чат и не коммитить приватные ключи, `.env.production`, `DJANGO_SECRET_KEY`, `POSTGRES_PASSWORD`, `DATABASE_URL`, `QWEN_API_KEY`.
- Не использовать `git add .` перед release, если в дереве есть env, build artifacts или локальная БД.
- Push tag `v*` может запустить GitHub Actions deploy workflow.
