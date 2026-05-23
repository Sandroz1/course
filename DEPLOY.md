# DEPLOY

Короткий entrypoint для production-деплоя. Полные инструкции находятся в [deploy/docs/README.md](deploy/docs/README.md).

## Важные правила

- `.env.production` создаётся и хранится только на VPS.
- Не пушить tag `v*`, если не нужен запуск GitHub Actions deploy.
- После frontend-изменений пересобирать `nginx` image, потому что frontend собирается внутри `docker/nginx/Dockerfile`.
- Не использовать `git add .` перед release, если в рабочем дереве есть env, `site/dist`, `node_modules`, `.venv`, `.vs`, `db.sqlite3` или backup-файлы.

## Ручной deploy текущего main на VPS

```bash
cd /opt/uchicode/app
git fetch origin main
git checkout origin/main
docker compose -f docker-compose.prod.yml build --pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker compose -f docker-compose.prod.yml ps
curl -fsS https://uchicode.ru/nginx-health
curl -fsS https://uchicode.ru/api/health
```

Если нужно закрепиться на конкретном commit:

```bash
git checkout 1cfbdb5
```

## Ручной deploy по tag

Перед использованием tag убедиться, что он опубликован:

```bash
git ls-remote --tags origin v0.1.2
```

Если tag существует:

```bash
cd /opt/uchicode/app
git fetch --all --tags
git checkout v0.1.2
docker compose -f docker-compose.prod.yml build --pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
curl -fsS https://uchicode.ru/api/health
```

## Rollback

```bash
cd /opt/uchicode/app
git fetch --all --tags
git checkout v0.1.1
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d --remove-orphans
curl -fsS https://uchicode.ru/api/health
```

## Где смотреть детали

- Первый деплой: [deploy/docs/02_DEPLOY_FROM_ZERO.md](deploy/docs/02_DEPLOY_FROM_ZERO.md).
- Обновление и rollback: [deploy/docs/03_UPDATE_ROLLBACK_HOTFIX.md](deploy/docs/03_UPDATE_ROLLBACK_HOTFIX.md).
- Troubleshooting: [deploy/docs/04_TROUBLESHOOTING.md](deploy/docs/04_TROUBLESHOOTING.md).
- Security: [deploy/docs/05_SECURITY_SECRETS_ACCESS.md](deploy/docs/05_SECURITY_SECRETS_ACCESS.md).
- Backup: [deploy/docs/06_BACKUP_RESTORE.md](deploy/docs/06_BACKUP_RESTORE.md).
- Post-deploy checklist: [deploy/docs/09_POST_DEPLOY_CHECKLIST.md](deploy/docs/09_POST_DEPLOY_CHECKLIST.md).
