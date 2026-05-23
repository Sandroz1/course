# 01. Current production state

## Инфраструктура

```text
Домен: uchicode.ru
www: www.uchicode.ru
DNS:
  uchicode.ru       A  2.26.99.141
  www.uchicode.ru   A  2.26.99.141

VPS:
  Provider: play2go.cloud
  Server: uchi
  IP: 2.26.99.141
  OS: Ubuntu 24.04
  RAM: 2 GB
  Disk: 50 GB
  Swap: 2 GB

Deploy user:
  deploy

Project path:
  /opt/uchicode/app

Compose file:
  docker-compose.prod.yml

Systemd service:
  uchicode-compose.service

Manual backup script:
  /opt/uchicode/backup.sh

Backup folder:
  /opt/uchicode/app/backups

Cron backup:
  30 3 * * * /opt/uchicode/backup.sh >> /opt/uchicode/backup.log 2>&1
```

## Release target

```text
1cfbdb5 Fix frontend API paths
```

Проверка фактического состояния VPS:

```bash
cd /opt/uchicode/app
git log --oneline -1
git status -sb
```

`HEAD (no branch)` на сервере — нормально для production, если сервер закреплён на конкретном commit. Если `git log --oneline -1` показывает не `1cfbdb5`, значит сервер работает на другом release и его нужно обновлять отдельной операцией.

## Tag policy

`v0.1.2` был локальным tag и не был запушен в GitHub, потому что workflow может стартовать production deploy по tag `v*`.

Пока используется ручной деплой, безопаснее деплоить по commit SHA:

```bash
git fetch origin main
git checkout 1cfbdb5
```

## Runtime схема

```text
User browser
  -> https://uchicode.ru
  -> Host Nginx на VPS, 80/443
  -> proxy_pass http://127.0.0.1:8080
  -> Docker nginx
  -> backend:8000 inside Docker network
  -> PostgreSQL / Redis inside Docker network
```

## Containers

```bash
cd /opt/uchicode/app
docker compose -f docker-compose.prod.yml ps
```

Ожидаемо:

```text
app-backend-1    Up ... healthy   8000/tcp
app-nginx-1      Up ...           127.0.0.1:8080->80/tcp
app-postgres-1   Up ... healthy   5432/tcp
app-redis-1      Up ... healthy   6379/tcp
```

## Ports

```bash
ss -tulpn | grep -E ':80|:443|:8080|:8000|:5432|:6379'
```

Нормально:

```text
0.0.0.0:80
0.0.0.0:443
127.0.0.1:8080
[::]:80
[::]:443
```

Не должно быть:

```text
0.0.0.0:8000
0.0.0.0:8080
0.0.0.0:5432
0.0.0.0:6379
```

## Health checks

```bash
curl -I https://uchicode.ru
curl -fsS https://uchicode.ru/nginx-health
curl -fsS https://uchicode.ru/api/health
curl -I https://uchicode.ru/admin/
```

Ожидаемо:

```text
https://uchicode.ru                 200 OK
/nginx-health                       ok
/api/health                         {"status":"ok","service":"uchicode-api"}
/admin/ без логина                  302 Found -> /admin/login/?next=/admin/
```

## Известные ограничения

### AI assistant

Если `QWEN_API_KEY` пустой в `.env.production`, `/api/ai/chat/` отдаёт `503`.

### Admin rate limit

Если `/admin/` отдаёт `503` при обновлении страницы, вероятная причина — `limit_req zone=auth_limit` внутри Docker nginx location `/admin/`.

### Superuser

Superuser создавался через:

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

Если создавались два admin-пользователя, проверить и оставить только нужного:

```text
Django admin -> Accounts -> Users
```
