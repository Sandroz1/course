# LOCAL_RUNBOOK

## Быстрый запуск frontend

```bash
cd site
npm install
npm run dev
```

Открыть:

```text
http://127.0.0.1:5173
```

## Быстрый запуск backend

PowerShell:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Открыть:

```text
http://127.0.0.1:8000/api/health/
```

## Проверка backend health

```bash
curl http://127.0.0.1:8000/api/health/
```

Ожидаемый ответ:

```json
{"status":"ok","service":"uchicode-api"}
```

## Проверка frontend build

```bash
cd site
npm run typecheck
npm run build
npm run lint
```

`dist/` создаётся локально, но не должен попадать в Git.

## Проверка docker compose config

```bash
docker compose -f docker-compose.dev.yml config
docker compose -p app -f docker-compose.prod.yml config
```

## Docker dev запуск

```bash
docker compose -f docker-compose.dev.yml up --build
```

Миграции:

```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py migrate
```

Остановить:

```bash
docker compose -f docker-compose.dev.yml down
```

## Что делать, если порт занят

PowerShell: найти процесс по порту.

```powershell
Get-NetTCPConnection -LocalPort 5173 | Select-Object OwningProcess
Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess
```

Посмотреть процесс:

```powershell
Get-Process -Id <PID>
```

Остановить процесс, если точно понятно, что это старый dev server:

```powershell
Stop-Process -Id <PID>
```

Не останавливай системные процессы, если не уверен.

## Что делать, если env не найден

Frontend:

```bash
cd site
copy .env.example .env.local
```

Backend:

```powershell
cd backend
copy .env.example .env
```

Production:

```bash
cp .env.production.example .env.production
```

После копирования заполнить значения локально или на VPS. Реальные env-файлы не коммитить.

## Что делать, если PostgreSQL/Redis не запущены локально

Для обычного backend dev без `DATABASE_URL` Django использует SQLite `backend/db.sqlite3`.

Если нужен PostgreSQL и Redis как в production:

```bash
docker compose -f docker-compose.dev.yml up -d postgres redis
docker compose -f docker-compose.dev.yml up --build backend frontend
```

Redis не обязателен для простого локального запуска, если `REDIS_URL` не задан.

## Что проверить перед коммитом

```bash
git status
```

Проверки:

```bash
cd site
npm run typecheck
npm run build
npm run lint
```

```powershell
cd backend
.venv\Scripts\python.exe manage.py check
.venv\Scripts\python.exe manage.py test
```

```bash
docker compose -p app -f docker-compose.prod.yml config
```

Production compose требует заполненный `.env.production`. Nginx HTTPS-конфиг ожидает сертификаты Let's Encrypt в `/etc/letsencrypt/live/uchicode.ru/`.

Если проверяешь production frontend после API-правок, убедись, что нет двойного `/api`:

```bash
rg "/api/api" site/src site/dist
```

Ожидаемо: пустой вывод.

Поиск старых production-следов. Команда ниже намеренно содержит legacy-строки, чтобы их можно было быстро найти перед коммитом:

```bash
rg "cppbase.ru|api.cppbase.ru|GITHUB_PAGES|workers.dev|cloudflare"
```

Что не должно попасть в Git:

- `.env`
- `.env.local`
- `.env.production`
- `backend/db.sqlite3`
- `.venv/`
- `node_modules/`
- `site/dist/`
- `__pycache__/`
- реальные ключи и пароли
