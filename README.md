# Uchicode

Uchicode — учебный сайт по C++ и ООП.

- Frontend: React + Vite + TypeScript.
- Backend: Django REST Framework.
- AI-помощник: Qwen через backend endpoint `/api/ai/chat/`.
- Production: VPS + Docker Compose + Nginx.
- Домен: `uchicode.ru`.
- API: `api.uchicode.ru`.

## Структура проекта

```text
site/                    Frontend на React/Vite/TypeScript
backend/                 Django REST Framework API
docker/                  Production Nginx конфигурация
docker-compose.dev.yml    Локальная Docker-среда
docker-compose.prod.yml   Production Docker Compose
.env.production.example   Шаблон production env
README.md                Обзор проекта
PROJECT_STATUS.md         Текущее состояние проекта
LOCAL_RUNBOOK.md          Практические команды запуска и проверок
```

`DEPLOY.md`, `DEPLOY_SSL.md` и `SMOKE_TESTS.md` пока не созданы. Их стоит добавить перед реальным деплоем на VPS.

## Архитектура

```text
Frontend SPA
  -> Django REST API
      -> PostgreSQL
      -> Redis
      -> Qwen API
```

Production:

```text
Internet
  -> Nginx container :80/:443
      -> uchicode.ru       -> frontend SPA
      -> www.uchicode.ru   -> redirect на uchicode.ru
      -> api.uchicode.ru   -> backend:8000

backend container
  -> Django + DRF + Gunicorn
  -> PostgreSQL внутри Docker network
  -> Redis внутри Docker network
```

PostgreSQL, Redis и backend не публикуются наружу напрямую. Наружу смотрит только Nginx.

## Локальный запуск frontend

```bash
cd site
npm install
npm run dev
```

Frontend будет доступен на `http://127.0.0.1:5173`.

## Локальный запуск backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend будет доступен на `http://127.0.0.1:8000`.

Проверка health endpoint:

```bash
curl http://127.0.0.1:8000/api/health/
```

## Локальный запуск через Docker

```bash
docker compose -f docker-compose.dev.yml up --build
```

Миграции в dev Docker:

```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py migrate
```

## Локальные проверки

Frontend:

```bash
cd site
npm run build
```

Backend:

```powershell
cd backend
.venv\Scripts\python.exe manage.py check
.venv\Scripts\python.exe manage.py test
```

Docker:

```bash
docker compose -f docker-compose.dev.yml config
docker compose -f docker-compose.prod.yml config
```

## Env

Шаблоны:

- `site/.env.example` — frontend dev env.
- `site/.env.production.example` — frontend production API URL.
- `backend/.env.example` — backend dev env.
- `.env.production.example` — production env для Docker Compose.

Реальные `.env`, `.env.local` и `.env.production` нельзя коммитить.

Production frontend должен использовать:

```env
VITE_API_BASE_URL=https://api.uchicode.ru
```

Production backend должен получать секреты только через env:

- `DJANGO_SECRET_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `QWEN_API_KEY`
- `POSTGRES_PASSWORD`

## Production

Домены:

- `uchicode.ru`
- `www.uchicode.ru`
- `api.uchicode.ru`

Production сервисы:

- `nginx`
- `backend`
- `postgres`
- `redis`

Базовые команды:

```bash
cp .env.production.example .env.production
# заполнить .env.production реальными значениями на сервере

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

HTTPS/Let's Encrypt ещё нужно оформить отдельным шагом.

## AI endpoint

AI-помощник работает через Django endpoint:

```text
POST /api/ai/chat/
```

Frontend использует общий API base URL из `VITE_API_BASE_URL`.

## Статус

Готово:

- frontend переведён на `VITE_API_BASE_URL`;
- backend DRF создан;
- AI proxy добавлен в backend;
- progress API добавлен;
- Docker Compose для dev и production подготовлены;
- production Nginx конфигурация подготовлена для `uchicode.ru`;
- `site/dist/` снят с Git tracking и игнорируется.

Осталось до VPS:

- закоммитить текущую ветку `dev/vps-migration`;
- настроить DNS у REG.RU;
- развернуть проект на VPS;
- получить SSL-сертификаты;
- добавить финальные deploy/smoke-test инструкции.
