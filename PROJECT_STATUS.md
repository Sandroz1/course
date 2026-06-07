# PROJECT_STATUS

Актуально на 2026-06-07.

## Git и release

- Основная ветка: `main`.
- `origin/main` содержит commit `c05f7b9 Polish guide heading spacing`.
- Локальный tag `v0.1.2` указывает на старый commit `1cfbdb5` и не опубликован в `origin`; tag нужно публиковать отдельно и осторожно: workflow `.github/workflows/deploy-production.yml` запускается на push tag `v*`.
- Ветка `dist` используется отдельно для статического frontend-артефакта и не влияет на production Docker deploy.

## Frontend

Frontend находится в `site/`.

Есть:

- React + Vite + TypeScript;
- страницы курсов и задач;
- отдельные маршруты `base-cpp` и `oop-cpp`;
- auth pages;
- progress UI;
- AI Assistant UI;
- API-layer через same-origin `/api`.

Важное правило API:

```text
baseURL=/api
endpoint=/auth/register/
итог=/api/auth/register/
```

Неправильно:

```text
/api/api/auth/register/
```

## Курсы

`base-cpp`:

- отдельный курс "База C++";
- ранние темы до условий помечены как `needs-theory`;
- доступны: `conditions`, `ternary-operator`, `switch-case`, `for-loop`, `while-loop`, `do-while-loop`;
- практические задания базового курса пока находятся внутри учебных разделов, не в общем списке задач.

`oop-cpp`:

- отдельный курс по ООП;
- не должен смешиваться с `base-cpp`;
- sidebar и статусы курсов строятся из общих данных, а не из hardcode одного курса.

## Backend

Backend находится в `backend/`.

Есть:

- Django REST Framework;
- custom `User`;
- JWT auth;
- health endpoint `/api/health/`;
- progress endpoints;
- AI endpoint `/api/ai/chat/`;
- PostgreSQL через `DATABASE_URL`;
- Redis cache/throttling через `REDIS_URL`;
- production settings через env.

Auth endpoints:

```text
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/token/refresh/
POST /api/auth/logout/
GET/PATCH /api/me/
```

## AI

AI идёт через Django:

```text
POST /api/ai/chat/
```

Если `QWEN_API_KEY` пустой, backend ожидаемо возвращает `503`. Это не падение сайта, а незаполненная внешняя интеграция.

## Docker и production

Есть:

- `docker-compose.dev.yml`;
- `docker-compose.prod.yml`;
- `backend/Dockerfile`;
- `site/Dockerfile`;
- `docker/nginx/Dockerfile`;
- `docker/nginx/nginx.conf`;
- `docker/nginx/conf.d/uchicode.conf`.

Production схема:

```text
host Nginx 80/443
  -> 127.0.0.1:8080
  -> Docker nginx
  -> backend:8000
  -> PostgreSQL / Redis
```

Backend, PostgreSQL и Redis не публикуются наружу напрямую.

## Документация

Основной индекс: [docs/README.md](docs/README.md).

Production runbooks:

- [deploy/docs/README.md](deploy/docs/README.md);
- [deploy/docs/02_DEPLOY_FROM_ZERO.md](deploy/docs/02_DEPLOY_FROM_ZERO.md);
- [deploy/docs/03_UPDATE_ROLLBACK_HOTFIX.md](deploy/docs/03_UPDATE_ROLLBACK_HOTFIX.md);
- [deploy/docs/04_TROUBLESHOOTING.md](deploy/docs/04_TROUBLESHOOTING.md);
- [deploy/docs/09_POST_DEPLOY_CHECKLIST.md](deploy/docs/09_POST_DEPLOY_CHECKLIST.md).

## Локальные проверки

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

Docker production smoke:

```bash
docker compose -p app -f docker-compose.prod.yml config
docker compose -p app -f docker-compose.prod.yml build --pull
docker compose -p app -f docker-compose.prod.yml up -d --remove-orphans
curl -fsS http://127.0.0.1:8080/nginx-health
curl -fsS http://127.0.0.1:8080/api/health
docker compose -p app -f docker-compose.prod.yml down
```

## Риски

- Push tag `v*` может запустить GitHub Actions deploy.
- Если `QWEN_API_KEY` пустой, AI UI будет получать `503`.
- Любой hotfix на VPS нужно переносить в репозиторий, иначе он потеряется при `git checkout`.
- `.env.production`, приватные ключи, backup-архивы и локальная БД не должны попадать в git.
- После frontend-изменений нужно пересобирать `nginx` image, потому что production frontend собирается внутри `docker/nginx/Dockerfile`.
