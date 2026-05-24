# 07. Commands cheatsheet

## Подключение

```powershell
ssh -i $env:USERPROFILE\.ssh\uchicode_deploy deploy@2.26.99.141
```

## Состояние проекта

```bash
cd /opt/uchicode/app

git log --oneline -1
git status -sb
docker compose -p app -f docker-compose.prod.yml ps
```

## Health

```bash
curl -fsS https://uchicode.ru/nginx-health
curl -fsS https://uchicode.ru/api/health
curl -I https://uchicode.ru/admin/
```

## Logs

```bash
cd /opt/uchicode/app

docker compose -p app -f docker-compose.prod.yml logs --tail=120 backend
docker compose -p app -f docker-compose.prod.yml logs --tail=120 nginx
docker compose -p app -f docker-compose.prod.yml logs --tail=120 postgres
docker compose -p app -f docker-compose.prod.yml logs --tail=120 redis
```

## Rebuild

Frontend / Docker nginx:

```bash
cd /opt/uchicode/app
docker compose -p app -f docker-compose.prod.yml build --pull nginx
docker compose -p app -f docker-compose.prod.yml up -d --force-recreate --no-deps nginx
```

Backend:

```bash
docker compose -p app -f docker-compose.prod.yml build --pull backend
docker compose -p app -f docker-compose.prod.yml up -d --force-recreate --no-deps backend
```

Everything:

```bash
docker compose -p app -f docker-compose.prod.yml build --pull
docker compose -p app -f docker-compose.prod.yml up -d --remove-orphans
```

## Проверка API paths

```bash
curl -i -X POST https://uchicode.ru/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{}'

curl -i -X POST https://uchicode.ru/api/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{}'
```

Ожидаемо:

```text
/api/auth/register/     400
/api/api/auth/register/ 404
```

## Проверка bundle

```bash
docker compose -p app -f docker-compose.prod.yml exec nginx sh -c 'grep -R "api/api" -n /usr/share/nginx/html || true'
```

Нормально: пустой вывод.

## Ports

```bash
ss -tulpn | grep -E ':80|:443|:8080|:8000|:5432|:6379'
```

## Certbot

```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

## UFW / fail2ban

```bash
sudo ufw status verbose
sudo systemctl status fail2ban --no-pager
sudo fail2ban-client status
```

## Backup

```bash
/opt/uchicode/backup.sh
tail -n 100 /opt/uchicode/backup.log
find /opt/uchicode/app/backups -maxdepth 2 -type f -ls | tail -n 20
```

## Create Django superuser

```bash
cd /opt/uchicode/app
docker compose -p app -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## Check AI env without printing key

```bash
python3 - <<'PY'
from pathlib import Path

env = {}
for line in Path("/opt/uchicode/app/.env.production").read_text().splitlines():
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        env[k] = v

print("QWEN_API_KEY set:", bool(env.get("QWEN_API_KEY", "").strip()))
print("QWEN_MODEL:", env.get("QWEN_MODEL", ""))
PY
```
