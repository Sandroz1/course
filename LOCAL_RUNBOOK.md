# LOCAL_RUNBOOK

Короткий runbook для первого локального запуска Uchicode после клонирования. Production deploy живёт отдельно в [DEPLOY.md](DEPLOY.md) и [deploy/docs/README.md](deploy/docs/README.md).

## Что установить

- Git.
- Node.js и npm, совместимые с Vite 8. Проверить: `node -v`, `npm -v`.
- Python с поддержкой Django 6. Проверить: `python --version`.
- Docker Desktop, если нужен локальный PostgreSQL/Redis или запуск всего стека через compose.

Для простого backend dev без `DATABASE_URL` Django использует локальный SQLite-файл `backend/db.sqlite3`. Его нельзя коммитить.

## Клонирование

```powershell
git clone <repo-url> uchicode
cd uchicode
git status -sb
```

Работать с реальными secrets в репозитории нельзя. Для локальных значений используйте только свои `.env`, созданные из example-файлов.

## Env-файлы

В репозитории есть безопасные шаблоны:

- `.env.example` - общий список переменных и placeholders.
- `backend/.env.example` - локальные backend-настройки.
- `site/.env.example` - frontend-настройки Vite.
- `.env.production.example` - production-шаблон без реальных секретов.

Локально:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item site\.env.example site\.env.local
```

Безопасные локальные значения:

- `DJANGO_DEBUG=True`
- `DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1`
- `DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `DATABASE_URL=` пустой, если используете SQLite
- `REDIS_URL=` пустой, если Redis не нужен
- `SMS_PROVIDER=console`

Не коммитить реальные API keys, passwords, tokens, production hostnames и production `.env`.

## Frontend

```powershell
cd site
npm install
npm run dev
```

Открыть:

```text
http://127.0.0.1:5173
```

Frontend по умолчанию ходит в `/api`; dev proxy в Vite направляет запросы на локальный backend.

Проверки frontend:

```powershell
cd site
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=low
```

`site/dist/` создаётся локально, но не должен попадать в Git.

## Backend

PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Проверить health:

```powershell
curl http://127.0.0.1:8000/api/health/
```

Ожидаемый ответ:

```json
{"status":"ok","service":"uchicode-api"}
```

Проверки backend:

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe manage.py test
.\.venv\Scripts\python.exe -m pip check
```

Если `python` указывает не на нужный interpreter, используйте `.\.venv\Scripts\python.exe`.

## Docker dev

Для локального PostgreSQL/Redis:

```powershell
docker compose -f docker-compose.dev.yml up -d postgres redis
```

Для всего dev-стека:

```powershell
docker compose -f docker-compose.dev.yml up --build
```

Миграции внутри compose:

```powershell
docker compose -f docker-compose.dev.yml exec backend python manage.py migrate
```

Остановить контейнеры без удаления volumes:

```powershell
docker compose -f docker-compose.dev.yml down
```

Не использовать `down -v`, если не нужно явно удалить локальные volumes.

Проверить compose config:

```powershell
docker compose -f docker-compose.dev.yml config --quiet
docker compose -f docker-compose.prod.yml config --quiet
```

Production compose может требовать заполненный `.env.production`.

## Practice

`practice/` не является обязательной папкой для обычного пользователя сайта. Это internal/course source для `.cpp/.hpp` заготовок, связанный с task data. На сайте стартовый код должен быть виден в задаче, без требования искать файл вручную.

Подробно: [practice/README.md](practice/README.md).

## Частые проблемы

### PowerShell не даёт активировать `.venv`

Разрешите выполнение локально для текущего пользователя:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

После этого заново активируйте `.venv`.

### Порт занят

```powershell
Get-NetTCPConnection -LocalPort 5173 | Select-Object OwningProcess
Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess
Get-Process -Id <PID>
```

Останавливайте процесс только если уверены, что это старый dev server:

```powershell
Stop-Process -Id <PID>
```

### Docker daemon не запущен

Запустите Docker Desktop и повторите compose-команду. Ошибка вида `failed to connect to the docker API` означает, что Docker Desktop не поднят или недоступен.

### Backend не видит env

Проверьте, что файл называется именно `backend/.env`, а не `.env.example`, и что вы запускаете команды из папки `backend`.

### Миграции не применены

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py migrate
```

### Frontend не видит backend

Проверьте:

- backend открыт на `http://127.0.0.1:8000/api/health/`;
- frontend запущен через `npm run dev`;
- `site/.env.local` не содержит неправильный `VITE_API_BASE_URL`.

### Нельзя коммитить

Перед commit:

```powershell
git diff --check
git status -sb
git diff --stat
```

Проверьте, что в Git не попали:

- `.env`
- `.env.local`
- `.env.production`
- `backend/db.sqlite3`
- `.venv/`
- `node_modules/`
- `site/dist/`
- `__pycache__/`
- реальные keys/passwords/tokens/backups
