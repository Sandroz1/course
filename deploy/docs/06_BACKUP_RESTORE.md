# 06. Backup and restore

## Что бэкапится

Папка:

```text
/opt/uchicode/app/backups/YYYYMMDDTHHMMSSZ
```

Файлы:

```text
git-sha.txt
git-ref.txt
postgres.sql
media.tar.gz
staticfiles.tar.gz
```

## Ручной backup

```bash
/opt/uchicode/backup.sh
find /opt/uchicode/app/backups -maxdepth 2 -type f -ls | tail -n 20
```

Права должны быть:

```text
-rw------- deploy deploy postgres.sql
-rw------- deploy deploy media.tar.gz
-rw------- deploy deploy staticfiles.tar.gz
```

Если нет:

```bash
sudo chown -R deploy:deploy /opt/uchicode/app/backups
chmod -R go-rwx /opt/uchicode/app/backups
```

## Cron backup

```bash
crontab -l
```

Ожидаемо:

```cron
30 3 * * * /opt/uchicode/backup.sh >> /opt/uchicode/backup.log 2>&1
```

Проверить cron:

```bash
systemctl status cron --no-pager
```

Warning про journal без sudo не критичен.

## Logs

```bash
tail -n 100 /opt/uchicode/backup.log
```

## Скачать backup на Windows

```powershell
scp -i $env:USERPROFILE\.ssh\uchicode_deploy -r deploy@2.26.99.141:/opt/uchicode/app/backups/YYYYMMDDTHHMMSSZ .\uchicode-backup-YYYYMMDDTHHMMSSZ
```

## Restore PostgreSQL

Перед restore сделать новый backup:

```bash
/opt/uchicode/backup.sh
```

Восстановление plain SQL dump в существующую базу может конфликтовать с существующими данными. Сначала тестировать на staging или пустой базе.

Базовый вариант:

```bash
cd /opt/uchicode/app
cat /path/to/postgres.sql | docker compose -p app -f docker-compose.prod.yml exec -T postgres psql -U uchicode -d uchicode
```

После restore:

```bash
docker compose -p app -f docker-compose.prod.yml up -d --remove-orphans
docker compose -p app -f docker-compose.prod.yml ps
curl -fsS https://uchicode.ru/api/health
```

## Restore media/staticfiles

```bash
cd /opt/uchicode/app
BACKUP_DIR=/opt/uchicode/app/backups/YYYYMMDDTHHMMSSZ

docker compose -p app -f docker-compose.prod.yml run --rm --no-deps \
  -v "$BACKUP_DIR:/backup" \
  backend \
  sh -c 'tar -xzf /backup/media.tar.gz -C /app && tar -xzf /backup/staticfiles.tar.gz -C /app'
```

## Retention policy

Проверить старые backup:

```bash
find /opt/uchicode/app/backups -mindepth 1 -maxdepth 1 -type d -mtime +14 -print
```

Удалять только после проверки:

```bash
find /opt/uchicode/app/backups -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +
```
