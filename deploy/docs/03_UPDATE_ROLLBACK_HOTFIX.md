# 03. Update, rollback и hotfix

## Базовый поток

```text
локально -> проверки -> commit -> push main -> fetch на VPS -> backup -> build -> up -> проверки
```

## Локальные проверки перед push

```bash
npm run lint
npm run build
docker compose -p app -f docker-compose.prod.yml config
docker compose -p app -f docker-compose.prod.yml build --pull
docker compose -p app -f docker-compose.prod.yml up -d --remove-orphans
curl -fsS http://127.0.0.1:8080/nginx-health
curl -fsS http://127.0.0.1:8080/api/health
docker compose -p app -f docker-compose.prod.yml down
```

Commit:

```bash
git status
git add path/to/changed-file-1 path/to/changed-file-2
git commit -m "Update project"
git push origin main
```

Не использовать `git add .`, если в рабочем дереве есть `.env`, `site/dist`, `node_modules`, `.venv`, `.vs`, `db.sqlite3`, `__pycache__` или backup-файлы.

## Ручной deploy на VPS по commit

```bash
cd /opt/uchicode/app

git fetch origin main
git log --oneline origin/main -1
git checkout COMMIT_SHA_ORIGIN_MAIN

/opt/uchicode/backup.sh

docker compose -p app -f docker-compose.prod.yml build --pull
docker compose -p app -f docker-compose.prod.yml up -d --remove-orphans
docker compose -p app -f docker-compose.prod.yml ps

curl -fsS https://uchicode.ru/nginx-health
curl -fsS https://uchicode.ru/api/health
```

## Если изменился только frontend

Frontend собирается внутрь Docker nginx image. Простого `up -d` недостаточно.

```bash
cd /opt/uchicode/app

docker compose -p app -f docker-compose.prod.yml build --pull nginx
docker compose -p app -f docker-compose.prod.yml up -d --force-recreate --no-deps nginx
```

Проверить bundle:

```bash
docker compose -p app -f docker-compose.prod.yml exec nginx sh -c 'grep -R "api/api" -n /usr/share/nginx/html || true'
```

## Если изменился backend

```bash
cd /opt/uchicode/app

docker compose -p app -f docker-compose.prod.yml build --pull backend
docker compose -p app -f docker-compose.prod.yml up -d --force-recreate --no-deps backend

docker compose -p app -f docker-compose.prod.yml ps
curl -fsS https://uchicode.ru/api/health
```

## Rollback

```bash
cd /opt/uchicode/app

git checkout PREVIOUS_COMMIT_OR_TAG

/opt/uchicode/backup.sh

docker compose -p app -f docker-compose.prod.yml build
docker compose -p app -f docker-compose.prod.yml up -d --remove-orphans

docker compose -p app -f docker-compose.prod.yml ps
curl -fsS https://uchicode.ru/api/health
```

## Tag policy

Не пушить tag `v*`, если `.github/workflows/deploy-production.yml` запускает production deploy на `push tags` и ты не хочешь автоматический деплой.

```bash
cat .github/workflows/deploy-production.yml
```

Перед deploy по tag проверить, что tag опубликован:

```bash
git ls-remote --tags origin v0.1.2
```

Если вывод пустой, VPS не сможет сделать `git checkout v0.1.2` после `git fetch --all --tags`.

## Hotfix: `/admin/` 503 из-за `auth_limit`

Симптом:

```text
/admin/ отдаёт 503.
nginx logs: limiting requests, excess ... by zone "auth_limit"
```

Цель:

```text
оставить auth_limit для /api/auth/
не применять auth_limit к /admin/
```

Hotfix на VPS:

```bash
cd /opt/uchicode/app

cp docker/nginx/conf.d/uchicode.conf docker/nginx/conf.d/uchicode.conf.bak
cp docker/nginx/nginx.conf docker/nginx/nginx.conf.bak

python3 - <<'PY'
from pathlib import Path

conf = Path("docker/nginx/conf.d/uchicode.conf")
text = conf.read_text()

old = '''    location /admin/ {
        limit_req zone=auth_limit burst=10 nodelay;
        proxy_pass http://backend;'''

new = '''    location /admin/ {
        proxy_pass http://backend;'''

if old not in text:
    raise SystemExit("FAIL: admin limit_req block not found")

conf.write_text(text.replace(old, new))

nginx_conf = Path("docker/nginx/nginx.conf")
text = nginx_conf.read_text()
text = text.replace(
    "limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;",
    "limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=30r/m;",
)
nginx_conf.write_text(text)

print("ok")
PY
```

Проверка:

```bash
grep -R "auth_limit\|limit_req\|limit_req_zone" -n docker/nginx
nl -ba docker/nginx/conf.d/uchicode.conf | sed -n '70,120p'
```

В `/admin/` не должно быть `limit_req`.

Применить:

```bash
docker compose -p app -f docker-compose.prod.yml build --pull nginx
docker compose -p app -f docker-compose.prod.yml up -d --force-recreate --no-deps nginx

docker compose -p app -f docker-compose.prod.yml ps
curl -I https://uchicode.ru/admin/
curl -fsS https://uchicode.ru/api/health
```

Важно: затем перенести фикс в локальный проект и закоммитить.

## Hotfix: подключить AI

```bash
cd /opt/uchicode/app
nano .env.production
```

Заполнить:

```env
QWEN_API_KEY=<значение из кабинета провайдера>
```

Пересоздать backend:

```bash
docker compose -p app -f docker-compose.prod.yml up -d --force-recreate --no-deps backend

docker compose -p app -f docker-compose.prod.yml ps
docker compose -p app -f docker-compose.prod.yml logs --tail=80 backend
curl -fsS https://uchicode.ru/api/health
```

Безопасная проверка:

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
