# 05. Security, secrets and access

## Хранить в менеджере паролей

```text
REG.RU login/password
play2go.cloud login/password
root-пароль VPS
пароль пользователя deploy
приватный SSH-ключ uchicode_deploy
DJANGO_SECRET_KEY
POSTGRES_PASSWORD
DATABASE_URL
QWEN_API_KEY, если будет подключён
```

## Нельзя коммитить или отправлять в чат

```text
.env.production
приватный SSH-ключ без .pub
DJANGO_SECRET_KEY
POSTGRES_PASSWORD
DATABASE_URL
QWEN_API_KEY
backup-архивы
postgres.sql
```

Публичный SSH-ключ `.pub` можно показывать.

## SSH

```powershell
ssh -i $env:USERPROFILE\.ssh\uchicode_deploy deploy@2.26.99.141
```

Строгая проверка ключа:

```powershell
ssh -o PreferredAuthentications=publickey -o PasswordAuthentication=no -i $env:USERPROFILE\.ssh\uchicode_deploy deploy@2.26.99.141
```

## UFW

```bash
sudo ufw status verbose
```

Ожидаемо:

```text
22/tcp   ALLOW IN
80/tcp   ALLOW IN
443/tcp  ALLOW IN
```

Не открывать:

```text
8000
8080
5432
6379
```

## fail2ban

```bash
sudo systemctl status fail2ban --no-pager
sudo fail2ban-client status
```

Ожидаемо jail для SSH: `ssh` или `sshd`.

## Django admin

Минимум:

```text
сильный пароль;
не использовать простой username/password;
удалить лишних superuser;
не давать staff/superuser без необходимости.
```

Создать superuser:

```bash
cd /opt/uchicode/app
docker compose -p app -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## Проверка `.env.production` без вывода секретов

```bash
cd /opt/uchicode/app
ls -la .env.production
grep -n "change-me\|GENERATE\|СЮДА\|ВСТАВЬ" .env.production || echo "ok: placeholders not found"
cut -d= -f1 .env.production | sed '/^#/d;/^$/d'
```

Права должны быть:

```text
-rw-------
```

## Optional hardening для `/admin/`

Позже можно добавить:

```text
IP allowlist;
Basic Auth на host Nginx;
смену admin URL;
2FA, если появится в проекте.
```

Не делать наспех, чтобы не заблокировать себе доступ.
