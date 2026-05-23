# 00. Audit report v3

## Что подтверждалось фактическим деплоем

```text
Docker containers работают.
backend healthy.
postgres healthy.
redis healthy.
Docker nginx слушает 127.0.0.1:8080.
Host Nginx слушает 80/443.
HTTPS работает.
Certbot dry-run проходил успешно.
UFW включён и разрешает только 22/80/443.
fail2ban работает.
systemd service uchicode-compose.service включён.
backup вручную создаётся.
cron backup настроен.
```

Проверки API:

```text
/api/auth/register/ на пустом JSON возвращал 400 Bad Request — endpoint существует.
/api/api/auth/register/ возвращал 404 — неправильный старый путь.
После пересборки nginx image frontend начал обращаться к /api/auth/... без двойного /api.
```

Проверки Django admin:

```text
/admin/ корректно редиректит на /admin/login/?next=/admin/.
Django admin открывался и отдавал 200 после логина.
503 в админке был связан с nginx rate limit auth_limit, а не с падением backend.
```

AI:

```text
/api/ai/chat/ отдаёт 503, если QWEN_API_KEY не задан.
Это ожидаемое состояние, пока AI-интеграция не подключена.
```

## Что улучшено в v3

1. Разделены deploy, update, hotfix, troubleshooting и security.
2. Зафиксирован release-ориентир `1cfbdb5`; фактический commit на VPS нужно сверять командой `git log --oneline -1`.
3. Добавлен отдельный hotfix-playbook для nginx `auth_limit` на `/admin/`.
4. Добавлен отдельный сценарий для AI 503 при пустом `QWEN_API_KEY`.
5. Добавлено правило: если менялся frontend, нужно пересобирать `nginx` image.
6. Добавлена проверка, что `/api/api` отсутствует внутри `/usr/share/nginx/html`.
7. Разведены команды Windows PowerShell и команды VPS Linux.
8. Добавлена безопасная проверка `.env.production` без вывода секретов.
9. Добавлены правила для backup-прав и владельцев файлов.
10. Добавлен короткий cheatsheet.

## Риски

### Hotfix на VPS может потеряться

Если nginx rate limit был исправлен прямо на VPS, но не закоммичен в репозиторий, при следующем `git checkout` изменение может пропасть.

Правильно: внести фикс локально, проверить, сделать commit, push, затем задеплоить.

### GitHub Actions по tag `v*`

Workflow `.github/workflows/deploy-production.yml` может запускаться при `git push origin v*`.

Пока ручной деплой уже настроен, tag лучше не пушить, если не нужен автоматический deploy.

### AI не настроен

Если `QWEN_API_KEY` пустой, AI-помощник будет отдавать `503`.

Нужно либо подключить ключ, либо скрыть/отключить AI UI до настройки.

### Админка публично доступна

Django admin открыт по `/admin/`. Минимально нужны сильный пароль и корректный rate limit. Позже можно добавить IP allowlist, Basic Auth или сменить admin URL.

## Минимальная проверка production-ready

```bash
cd /opt/uchicode/app

git log --oneline -1
docker compose -f docker-compose.prod.yml ps
curl -fsS https://uchicode.ru/nginx-health
curl -fsS https://uchicode.ru/api/health
curl -I https://uchicode.ru/admin/
sudo ufw status verbose
sudo systemctl status uchicode-compose.service --no-pager
sudo certbot certificates
```
