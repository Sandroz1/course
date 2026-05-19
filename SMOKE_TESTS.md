# SMOKE_TESTS

## Production smoke

```bash
curl -I https://uchicode.ru
curl -I https://www.uchicode.ru
curl -fsS https://api.uchicode.ru/api/health/
```

Ожидаемо:

- `uchicode.ru` отдаёт `200`;
- `www.uchicode.ru` редиректит на `https://uchicode.ru`;
- `/api/health/` возвращает `{"status":"ok","service":"uchicode-api"}`.

## Product сценарии

- Регистрация пользователя.
- Вход и refresh сессии.
- Добавление телефона.
- Отправка и проверка SMS-кода.
- AI недоступен без подтверждённого телефона.
- AI доступен после подтверждения телефона.
- 16-й AI-запрос за день получает `429`.
- Открытие урока сохраняет прогресс.
- Отметка урока и задачи отображается в профиле.

## Production config checks

- `DEBUG=False` в production.
- `DJANGO_SECRET_KEY` не равен dev-значению.
- `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS` и `DJANGO_CSRF_TRUSTED_ORIGINS` соответствуют публичным доменам.
- `DATABASE_URL`, `REDIS_URL`, `QWEN_API_KEY` и SMS credentials заданы только в серверных env-файлах.
- В `.env.production` нет placeholder values: `change-me`, `changeme`, `password`, `secret`, `example`.
- `AI_GLOBAL_DAILY_REQUEST_LIMIT` больше `0`.
- `site/.env.production` или build args frontend указывают на публичный API origin, не на localhost.
- Реальные `.env` файлы не staged в git.
- Python-зависимости backend проверены перед deploy:
  `python -m pip_audit -r backend/requirements.txt`.

## Docker и логи

```bash
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 backend
docker compose -f docker-compose.prod.yml logs --tail=100 nginx
```

Ожидаемо:

- compose config строится без ошибок;
- backend, nginx, postgres и redis контейнеры запущены;
- в backend logs нет ошибок migration, settings или database;
- в nginx logs нет повторяющихся `502` для `/api/`.

## Backup и restore smoke

- Проверить, что последний Postgres backup существует и читается.
- Проверить backup media volume, если используются пользовательские файлы.
- Хранить backup `.env.production` зашифрованным или в защищённом secret manager.
- До доверия backup-процессу прогнать restore drill на non-production хосте.
