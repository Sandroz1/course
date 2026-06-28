# Production Deploy

Обзор production-схемы. Операционные команды и порядок действий живут в [docs/README.md](docs/README.md).

```text
Internet
  -> host Nginx 80/443 + Let's Encrypt
  -> 127.0.0.1:8080
  -> Docker nginx
  -> backend:8000
  -> PostgreSQL / Redis
```

Наружу публикуются только host Nginx 80/443. Docker nginx доступен через `127.0.0.1:8080`; backend, PostgreSQL и Redis наружу не публикуются.

## Main Files

- `docker-compose.prod.yml` — production compose.
- `docker/nginx/Dockerfile` — frontend build + nginx image.
- `docker/nginx/conf.d/uchicode.conf` — internal app-nginx.
- `deploy/nginx/uchicode.ru.conf.example` — host Nginx example.
- `deploy/systemd/uchicode-compose.service.example` — systemd unit.
- `deploy/scripts/backup.sh.example` — backup script template.

## Operations

- Full runbook index: [docs/README.md](docs/README.md).
- Current infrastructure snapshot: [docs/01_CURRENT_STATE.md](docs/01_CURRENT_STATE.md), verify against VPS.
- First deploy: [docs/02_DEPLOY_FROM_ZERO.md](docs/02_DEPLOY_FROM_ZERO.md).
- Update/rollback: [docs/03_UPDATE_ROLLBACK_HOTFIX.md](docs/03_UPDATE_ROLLBACK_HOTFIX.md).
- Backup/restore: [docs/06_BACKUP_RESTORE.md](docs/06_BACKUP_RESTORE.md).
