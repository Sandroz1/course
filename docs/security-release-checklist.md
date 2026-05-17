# Security release checklist

Перед публичным production запуском:

1. Создать `.env.production` из `.env.production.example` только на сервере.
2. Заполнить реальные значения и не коммитить `.env.production`.
3. Проверить обязательные production env:
   - `DJANGO_SECRET_KEY`
   - `DJANGO_DEBUG=False`
   - `DJANGO_ALLOWED_HOSTS`
   - `DJANGO_CORS_ALLOWED_ORIGINS`
   - `DJANGO_CSRF_TRUSTED_ORIGINS`
   - `DATABASE_URL`
   - `REDIS_URL`
   - `QWEN_API_KEY`
   - `SMS_PROVIDER`
   - `SMS_API_KEY` или `SMS_LOGIN`/`SMS_PASSWORD`
   - `POSTGRES_DB`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
4. Валидировать production compose после заполнения env:

```bash
docker compose -f docker-compose.prod.yml config --quiet
```

5. Проверить backend:

```bash
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

6. Проверить frontend:

```bash
cd site
npm run typecheck
npm run build
npm audit --omit=dev
```

7. Проверить Python-зависимости вне runtime requirements:

```bash
cd backend
python -m pip install pip-audit
pip-audit -r requirements.txt
```

8. Перед включением платного AI проверить логи `ai_request_completed`, `ai_user_daily_limit_exceeded`, `ai_global_daily_limit_exceeded` и дневные счётчики `AiDailyUsage`/`AiGlobalDailyUsage`.

Token usage сохраняется только если провайдер вернул `usage` в ответе. Стоимость и spend cap не считаются без явных данных о цене модели или billing API.
