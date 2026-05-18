# DEPLOY

## Production deploy

```bash
git pull
cp .env.production.example .env.production
nano .env.production
```

Обязательные значения:

- `DJANGO_SECRET_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `QWEN_API_KEY`
- `SMS_PROVIDER`
- `SMS_API_KEY` или `SMS_LOGIN`/`SMS_PASSWORD`
- `POSTGRES_PASSWORD`

Перед запуском production проверь, что в `.env.production` не осталось placeholder values:

- `change-me`
- `changeme`
- `password`
- `secret`
- `example`

Backend дополнительно падает при `DEBUG=False`, если `DATABASE_URL` содержит placeholder, `POSTGRES_PASSWORD` оставлен шаблонным или `AI_GLOBAL_DAILY_REQUEST_LIMIT <= 0`.

Сначала получи SSL по `DEPLOY_SSL.md`, затем запускай:

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

Backend container сам запускает `migrate` и `collectstatic` перед `gunicorn`.

Логи:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
```

## Перед обновлением production

- Проверить текущие контейнеры: `docker compose -f docker-compose.prod.yml ps`.
- Проверить свободное место на диске перед сборкой новых images.
- Создать Postgres backup перед рискованными изменениями.
- Сделать backup media volume, если используются пользовательские файлы.
- Не добавлять `.env.production` в git и хранить защищённую копию отдельно.

Пример Postgres backup:

```bash
mkdir -p backups
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backups/uchicode-$(date +%F).sql
```

После deploy выполнить `SMOKE_TESTS.md` и проверить backend/nginx logs.
