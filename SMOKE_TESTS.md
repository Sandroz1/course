# SMOKE_TESTS

Smoke-проверки после локальной production-сборки или деплоя на VPS.

## Production health

```bash
curl -I https://uchicode.ru
curl -I https://www.uchicode.ru
curl -fsS https://uchicode.ru/nginx-health
curl -fsS https://uchicode.ru/api/health
```

Ожидаемо:

- `uchicode.ru` отдаёт `200`;
- `www.uchicode.ru` редиректит на `https://uchicode.ru`;
- `/nginx-health` возвращает `ok`;
- `/api/health` возвращает `{"status":"ok","service":"uchicode-api"}`.

## API paths

Правильный путь регистрации:

```bash
curl -i -X POST https://uchicode.ru/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{}'
```

Ожидаемо: `400 Bad Request` с JSON про обязательные поля.

Старый неправильный путь:

```bash
curl -i -X POST https://uchicode.ru/api/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{}'
```

Ожидаемо: `404 Not Found`.

Bundle не должен содержать `/api/api`:

```bash
cd /opt/uchicode/app
docker compose -p app -f docker-compose.prod.yml exec nginx sh -c 'grep -R "api/api" -n /usr/share/nginx/html || true'
```

Ожидаемо: пустой вывод.

## Docker

```bash
cd /opt/uchicode/app
docker compose -p app -f docker-compose.prod.yml ps
docker compose -p app -f docker-compose.prod.yml logs --tail=100 backend
docker compose -p app -f docker-compose.prod.yml logs --tail=100 nginx
```

Ожидаемо:

- `backend`, `postgres`, `redis` healthy;
- `nginx` Up;
- backend не публикует `8000` наружу;
- Docker nginx слушает только `127.0.0.1:8080`.

## Product scenarios

Проверить вручную в браузере:

- главная страница;
- `/courses`;
- `/courses/base-cpp`;
- `/courses/oop-cpp`;
- `/register`;
- `/login`;
- `/admin/`.

Auth/progress:

- регистрация нового пользователя;
- вход;
- refresh сессии после обновления страницы;
- отметка доступного раздела курса как пройденного;
- отображение прогресса на странице курса.

AI:

- без подтверждённого телефона AI недоступен;
- если `QWEN_API_KEY` пустой, `/api/ai/chat/` возвращает контролируемый `503`; frontend должен показать понятное сообщение о временной недоступности AI.

## Production config

Проверить без вывода секретов:

```bash
cd /opt/uchicode/app
cut -d= -f1 .env.production | sed '/^#/d;/^$/d'
grep -n "change-me\|changeme\|password\|secret\|example" .env.production || echo "ok: placeholders not found"
```

Проверить наличие важных env без вывода значений:

```bash
python3 - <<'PY'
from pathlib import Path

env = {}
for line in Path(".env.production").read_text().splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    env[key] = value

for key in [
    "DJANGO_SECRET_KEY",
    "DATABASE_URL",
    "POSTGRES_PASSWORD",
    "REDIS_URL",
    "QWEN_API_KEY",
    "QWEN_BASE_URL",
    "QWEN_MODEL",
    "SMS_PROVIDER",
]:
    print(f"{key} set:", bool(env.get(key, "").strip()))
PY
```

Критично:

- `DJANGO_DEBUG=False`;
- `DJANGO_ALLOWED_HOSTS=uchicode.ru,www.uchicode.ru`;
- `DJANGO_CSRF_TRUSTED_ORIGINS=https://uchicode.ru,https://www.uchicode.ru`;
- `DJANGO_CORS_ALLOWED_ORIGINS=` пустой при same-origin API;
- `DATABASE_URL`, `POSTGRES_PASSWORD`, `DJANGO_SECRET_KEY` не содержат placeholder values.

## Backup smoke

```bash
/opt/uchicode/backup.sh
tail -n 100 /opt/uchicode/backup.log
find /opt/uchicode/app/backups -maxdepth 2 -type f -ls | tail -n 20
```

До доверия backup-процессу нужно сделать restore drill на non-production окружении.
