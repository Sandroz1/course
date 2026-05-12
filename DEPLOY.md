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
