# 04. Troubleshooting

## `/api/api/...` 404

Симптом:

```text
POST https://uchicode.ru/api/api/auth/register/
404 Not Found
```

Причина: `VITE_API_BASE_URL=/api`, а endpoint тоже содержит `/api/...`.

Правильно:

```text
baseURL=/api
endpoint=/auth/register/
итог=/api/auth/register/
```

Проверка:

```bash
curl -i -X POST https://uchicode.ru/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{}'
```

Ожидаемо: `400 Bad Request`.

Если браузер всё ещё шлёт `/api/api`, пересобрать nginx image:

```bash
cd /opt/uchicode/app
docker compose -p app -f docker-compose.prod.yml build --pull nginx
docker compose -p app -f docker-compose.prod.yml up -d --force-recreate --no-deps nginx
docker compose -p app -f docker-compose.prod.yml exec nginx sh -c 'grep -R "api/api" -n /usr/share/nginx/html || true'
```

## `/admin/` отдаёт 503

Проверить логи:

```bash
cd /opt/uchicode/app
docker compose -p app -f docker-compose.prod.yml logs --tail=120 nginx
```

Если есть:

```text
limiting requests, excess ... by zone "auth_limit"
```

значит проблема в nginx rate limit.

Проверить конфиг:

```bash
grep -R "auth_limit\|limit_req\|limit_req_zone" -n docker/nginx
nl -ba docker/nginx/conf.d/uchicode.conf | sed -n '70,125p'
```

Плохо:

```nginx
location /admin/ {
    limit_req zone=auth_limit burst=10 nodelay;
```

Фикс см. `03_UPDATE_ROLLBACK_HOTFIX.md`.

## `/admin/` через `127.0.0.1:8080` отдаёт 400

Причина: Django `ALLOWED_HOSTS` содержит `uchicode.ru,www.uchicode.ru`, а не `127.0.0.1`.

Проверять админку так:

```bash
curl -i https://uchicode.ru/admin/
```

Ожидаемо без логина:

```text
302 Found
Location: /admin/login/?next=/admin/
```

## AI отдаёт 503

Симптом:

```text
POST https://uchicode.ru/api/ai/chat/
503 Service Unavailable
AI-сервис временно не настроен.
```

Проверить env без вывода ключа:

```bash
python3 - <<'PY'
from pathlib import Path

env = {}
for line in Path("/opt/uchicode/app/.env.production").read_text().splitlines():
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        env[k] = v

print("QWEN_API_KEY set:", bool(env.get("QWEN_API_KEY", "").strip()))
print("QWEN_BASE_URL:", env.get("QWEN_BASE_URL", ""))
print("QWEN_MODEL:", env.get("QWEN_MODEL", ""))
PY
```

Если `QWEN_API_KEY set: False`, AI работать не будет.

## Docker permission denied под deploy

```bash
sudo usermod -aG docker deploy
exit
```

Полностью выйти из SSH и зайти заново.

## SSH спрашивает пароль пользователя deploy

Проверить ключ:

```powershell
ssh -o PreferredAuthentications=publickey -o PasswordAuthentication=no -i $env:USERPROFILE\.ssh\uchicode_deploy deploy@2.26.99.141
```

Если `Permission denied`, сверить:

Windows:

```powershell
type $env:USERPROFILE\.ssh\uchicode_deploy.pub
```

VPS:

```bash
cat ~/.ssh/authorized_keys
ls -ld ~ ~/.ssh ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod go-w ~
```

## Certbot не выдаёт сертификат

```bash
getent hosts uchicode.ru
getent hosts www.uchicode.ru
sudo nginx -t
sudo systemctl status nginx --no-pager
ss -tulpn | grep -E ':80|:443'
curl -I http://uchicode.ru
```

## Build падает с `Killed` или OOM

```bash
free -h
swapon --show
docker system df
docker system prune -af
```

Если повторяется, увеличить VPS или собирать image вне VPS.

## После reboot проект не поднялся

```bash
sudo systemctl status uchicode-compose.service --no-pager
cd /opt/uchicode/app
docker compose -p app -f docker-compose.prod.yml ps
docker compose -p app -f docker-compose.prod.yml logs --tail=120 backend
docker compose -p app -f docker-compose.prod.yml logs --tail=120 nginx
```

Перезапуск:

```bash
sudo systemctl restart uchicode-compose.service
```

## Команда выполняется не там

Windows-команды с `$env:USERPROFILE` выполнять только в PowerShell:

```powershell
PS C:\Users\odero>
```

Linux-команды выполнять на VPS:

```bash
deploy@uchi:~$
```
