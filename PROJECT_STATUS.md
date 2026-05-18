# PROJECT_STATUS

## 1. Текущее состояние

### Frontend

Frontend находится в `site/`.

Есть:

- React + Vite + TypeScript;
- учебные страницы курса;
- страницы задач;
- AI Assistant;
- API-layer через `VITE_API_BASE_URL`;
- frontend auth pages;
- подключение progress API;
- production base в Vite равен `/`.

Production frontend должен обращаться к:

```text
https://api.uchicode.ru
```

### Backend

Backend находится в `backend/`.

Есть:

- Django REST Framework;
- custom `User`;
- health endpoint `/api/health/`;
- AI endpoints;
- progress endpoints;
- PostgreSQL через `DATABASE_URL`;
- Redis cache/throttling через `REDIS_URL`;
- settings через env.

### AI

Production AI должен идти через Django:

```text
POST /api/ai/chat/
```

`QWEN_API_KEY` берётся только из env. Если ключ не задан, backend возвращает понятную ошибку `503`.

Доступ к `/api/ai/chat/` разрешён только авторизованным пользователям с `is_phone_verified=True`. Backend-лимиты: 15 AI-запросов в день на пользователя и глобальный дневной лимит из `AI_GLOBAL_DAILY_REQUEST_LIMIT`.

### Auth

Frontend страницы auth уже подготовлены.

Backend auth реализован через JWT:

- `POST /api/auth/register/`;
- `POST /api/auth/login/`;
- `POST /api/auth/token/refresh/`;
- `POST /api/auth/logout/` blacklist refresh token;
- `GET/PATCH /api/me/`;
- подтверждение телефона через SMS-код.

### Docker

Есть:

- `docker-compose.dev.yml`;
- `docker-compose.prod.yml`;
- `backend/Dockerfile`;
- `site/Dockerfile`;
- `docker/nginx/Dockerfile`;
- `.dockerignore` файлы.

Production backend запускается через `gunicorn`.

### Nginx

Есть production Nginx конфигурация:

- `docker/nginx/nginx.conf`;
- `docker/nginx/conf.d/uchicode.conf`.

Логика:

- `uchicode.ru` отдаёт frontend SPA;
- `www.uchicode.ru` редиректится на `uchicode.ru`;
- `api.uchicode.ru` проксирует backend.

Nginx настроен на HTTPS и ожидает Let's Encrypt сертификат в `/etc/letsencrypt/live/uchicode.ru/`.

### Domain/VPS

- Домен: `uchicode.ru`.
- API: `api.uchicode.ru`.
- VPS: Play2Go, Ubuntu 24.04.
- VPS IP: `2.26.99.141`.

Деплой на VPS ещё не выполнен.

## 2. Что уже выполнено

- Подготовлена рабочая ветка для pre-release и UI/security hardening.
- Создан Django backend.
- Добавлены cache/throttling настройки под Redis.
- Добавлен backend AI proxy.
- AI закрыт для гостей и пользователей без подтверждённого телефона.
- Frontend переведён на Django API через `VITE_API_BASE_URL`.
- Добавлен frontend auth scaffold.
- Добавлен backend progress API.
- Frontend подключён к progress API для уроков, задач и профиля.
- Production frontend base переведён на `/`.
- Добавлен dev Docker Compose.
- Добавлен production Docker Compose.
- Добавлен production Nginx config.
- Домен обновлён на `uchicode.ru`.
- `site/dist/` снят с Git tracking.
- Добавлены `DEPLOY.md`, `DEPLOY_SSL.md`, `SMOKE_TESTS.md`.

## 3. Что ещё не выполнено

- Получить production SSL через Let's Encrypt.
- DNS настройка у REG.RU.
- Деплой на VPS.
- Production smoke tests после деплоя.
- Финальная проверка frontend UX после стабилизации инфраструктуры.

## 4. Как запускать локально

Frontend:

```bash
cd site
npm install
npm run dev
```

Backend:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Docker dev:

```bash
docker compose -f docker-compose.dev.yml up --build
```

## 5. Как проверить локально

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

Health:

```bash
curl http://127.0.0.1:8000/api/health/
```

## 6. Какие env нужны

Frontend:

- `VITE_API_BASE_URL`

Backend:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `DJANGO_CSRF_TRUSTED_ORIGINS`
- `DATABASE_URL`
- `REDIS_URL`
- `QWEN_API_KEY`
- `QWEN_BASE_URL`
- `QWEN_MODEL`
- `AI_DAILY_REQUEST_LIMIT`
- `AI_GLOBAL_DAILY_REQUEST_LIMIT`
- `SMS_PROVIDER`
- `SMS_API_KEY`
- `SMS_LOGIN`
- `SMS_PASSWORD`
- `SMS_FROM`

Postgres:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

Реальные env-файлы не коммитить.

## 7. Риски

- SSL ещё нужно получить до запуска HTTPS-конфига nginx.
- DNS может быть ещё не направлен на VPS.
- VPS должен быть чистой Ubuntu без конфликтующего LEMP/LAMP.
- Пароль VPS нужно сменить после выдачи доступа.
- Нельзя коммитить `.env`, `.env.local`, `.env.production`.
- `site/dist/` больше не должен попадать в Git.

## 8. Следующие шаги

1. Сделать Git commit текущей стабилизации.
2. Провести frontend architecture audit.
3. После аудита выполнить SCSS/refactor, если он действительно нужен.
4. Провести финальную локальную проверку.
5. Настроить DNS.
6. Развернуть на VPS.
7. Получить SSL.
8. Провести smoke tests на production.
