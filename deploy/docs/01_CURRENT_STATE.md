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
production deployed app hash: 0e8b81a
previous deployed hash / rollback target: 7d10f24
verified backup: /opt/uchicode/app/backups/20260701T191337Z
```

Release `0e8b81a` задеплоен 2026-07-01. VPS закреплён на clean detached `HEAD`; backend, PostgreSQL и Redis healthy, Docker nginx up. `/nginx-health` и `/api/health` прошли, основные product routes вернули ожидаемые ответы.

Post-deploy check 2026-07-01 confirmed: VPS remains on clean detached `HEAD` `0e8b81a`, containers are up/healthy, health endpoints pass, listed product routes return `200`, `/admin/` returns `302`, `CHECKER_EXECUTION_ENABLED=False`, `CheckerTaskVersion=0`, `TestCase=0`, `Submission=0`, migrations have no pending changes, checker availability fails closed when no production task version exists, and rendered browser smoke found no route loading text, console errors or horizontal overflow on checked routes.

Проверка фактического состояния VPS:

```bash
cd /opt/uchicode/app
git log --oneline -1
git status -sb
```

`HEAD (no branch)` на сервере - нормально для production, если сервер закреплён на конкретном commit. Если `git log --oneline -1` не совпадает с выбранным release, сервер работает на другом commit и его нужно обновлять отдельной операцией.

## Tag policy

`v0.1.2` был локальным tag и не был запушен в GitHub, потому что workflow может стартовать production deploy по tag `v*`.

Пока используется ручной деплой, безопаснее деплоить по commit SHA:

```bash
git fetch origin main
git checkout <commit-sha>
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

## GitHub Pages status

GitHub Pages is enabled in GitHub as legacy Pages from branch `dist` and publishes `https://sandroz1.github.io/course/`.

This is not the production deployment:

- production domain `uchicode.ru` points to the VPS above;
- the repo has no production CNAME for GitHub Pages;
- GitHub Pages is not a required branch protection/ruleset gate for `main`;
- production deploys must continue to use the VPS runbooks in this directory.

If the legacy Pages site is no longer useful, disable it manually in GitHub Settings. Do not treat it as a production target.

## Containers

```bash
cd /opt/uchicode/app
docker compose -p app -f docker-compose.prod.yml ps
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
docker compose -p app -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

Если создавались два admin-пользователя, проверить и оставить только нужного:

```text
Django admin -> Accounts -> Users
```
