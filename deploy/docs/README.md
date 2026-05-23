# Uchicode production docs v3

Комплект инструкций по production-деплою `uchicode.ru` на VPS.

## Файлы

1. `00_AUDIT_REPORT.md` — аудит, решения и риски.
2. `01_CURRENT_STATE.md` — текущее состояние production.
3. `02_DEPLOY_FROM_ZERO.md` — полный деплой с чистого VPS.
4. `03_UPDATE_ROLLBACK_HOTFIX.md` — обновление, rollback и hotfix.
5. `04_TROUBLESHOOTING.md` — типовые ошибки и фиксы.
6. `05_SECURITY_SECRETS_ACCESS.md` — доступы, секреты, SSH, UFW, fail2ban.
7. `06_BACKUP_RESTORE.md` — backup, cron, права, восстановление.
8. `07_COMMANDS_CHEATSHEET.md` — короткий набор команд.
9. `08_CODEX_PROMPTS.md` — промты для Codex/Cursor.
10. `09_POST_DEPLOY_CHECKLIST.md` — чеклист после деплоя.

## Главные правила

Не коммитить и не отправлять в чат:

```text
.env.production
приватный SSH-ключ
DJANGO_SECRET_KEY
POSTGRES_PASSWORD
DATABASE_URL
QWEN_API_KEY
backup-архивы
postgres.sql
```

Не открывать наружу:

```text
8000 backend
8080 Docker nginx
5432 PostgreSQL
6379 Redis
```

Production-схема:

```text
Internet
  -> host Nginx 80/443 + Let's Encrypt
  -> 127.0.0.1:8080
  -> Docker nginx
  -> backend:8000 внутри Docker network
  -> PostgreSQL / Redis внутри Docker network
```

Текущий release-ориентир:

```text
1cfbdb5 Fix frontend API paths
```

Перед deploy всегда сверить фактический server `HEAD`:

```bash
cd /opt/uchicode/app
git log --oneline -1
```

Tag `v0.1.2` был создан локально, но в GitHub его нужно публиковать отдельно. Push tag `v*` может запускать production deploy workflow.

AI-помощник может отдавать `503`, если `QWEN_API_KEY` пустой. Это не падение сайта, а незаполненная интеграция.

Django admin может получать `503`, если на `/admin/` применён nginx `auth_limit`. Фикс описан в `03_UPDATE_ROLLBACK_HOTFIX.md` и `04_TROUBLESHOOTING.md`.
