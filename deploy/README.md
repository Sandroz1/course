# Production Deploy

Короткий обзор production-схемы. Полные runbook-файлы лежат в [deploy/docs](docs).

## Схема

```text
Internet
  -> host Nginx 80/443 + Let's Encrypt
  -> http://127.0.0.1:8080
  -> Docker nginx
  -> backend:8000
  -> PostgreSQL / Redis
```

Docker наружу публикует только:

```text
127.0.0.1:8080:80
```

Backend, PostgreSQL и Redis наружу не публикуются.

## Главные файлы

- `docker-compose.prod.yml` — production compose.
- `docker/nginx/Dockerfile` — multi-stage frontend build + nginx image.
- `docker/nginx/nginx.conf` — контейнерный nginx без TLS.
- `docker/nginx/conf.d/uchicode.conf` — внутренний app-nginx.
- `deploy/nginx/uchicode.ru.conf.example` — host Nginx example для VPS.
- `deploy/systemd/uchicode-compose.service.example` — systemd unit.
- `deploy/scripts/backup.sh.example` — backup example.
- `deploy/docs/README.md` — полный набор инструкций.

## Первый запуск

```bash
sudo mkdir -p /opt/uchicode
sudo chown -R deploy:deploy /opt/uchicode
cd /opt/uchicode
git clone https://github.com/Sandroz1/course.git app
cd /opt/uchicode/app
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

В `.env.production` заменить placeholder values:

```text
DJANGO_SECRET_KEY
POSTGRES_PASSWORD
DATABASE_URL
QWEN_API_KEY, если AI нужен
SMS_* переменные, если SMS нужен
```

Проверка и запуск:

```bash
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml build --pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker compose -f docker-compose.prod.yml ps
curl -fsS http://127.0.0.1:8080/nginx-health
curl -fsS http://127.0.0.1:8080/api/health
```

## Host Nginx и HTTPS

```bash
sudo cp deploy/nginx/uchicode.ru.conf.example /etc/nginx/sites-available/uchicode.ru
sudo ln -sf /etc/nginx/sites-available/uchicode.ru /etc/nginx/sites-enabled/uchicode.ru
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d uchicode.ru -d www.uchicode.ru
sudo certbot renew --dry-run
```

Проверка:

```bash
curl -fsS https://uchicode.ru/nginx-health
curl -fsS https://uchicode.ru/api/health
```

## Update

Текущий безопасный путь — ручной deploy по `main` или конкретному commit:

```bash
cd /opt/uchicode/app
git fetch origin main
git checkout origin/main
docker compose -f docker-compose.prod.yml build --pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
curl -fsS https://uchicode.ru/api/health
```

Если нужен release tag, сначала проверить workflow:

```bash
cat .github/workflows/deploy-production.yml
```

В текущем проекте push tag `v*` может запускать GitHub Actions deploy.

## Rollback

```bash
cd /opt/uchicode/app
git fetch --all --tags
git checkout v0.1.1
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d --remove-orphans
curl -fsS https://uchicode.ru/api/health
```

## Где детали

- [docs/02_DEPLOY_FROM_ZERO.md](docs/02_DEPLOY_FROM_ZERO.md) — установка VPS с нуля.
- [docs/03_UPDATE_ROLLBACK_HOTFIX.md](docs/03_UPDATE_ROLLBACK_HOTFIX.md) — update, rollback, hotfix.
- [docs/04_TROUBLESHOOTING.md](docs/04_TROUBLESHOOTING.md) — типовые проблемы.
- [docs/05_SECURITY_SECRETS_ACCESS.md](docs/05_SECURITY_SECRETS_ACCESS.md) — безопасность и доступы.
- [docs/06_BACKUP_RESTORE.md](docs/06_BACKUP_RESTORE.md) — backup и restore.
- [docs/09_POST_DEPLOY_CHECKLIST.md](docs/09_POST_DEPLOY_CHECKLIST.md) — post-deploy checklist.
