# 09. Post-deploy checklist

Выполнять после любого обновления production.

## 1. Git

```bash
cd /opt/uchicode/app
git log --oneline -1
git status -sb
```

## 2. Docker

```bash
docker compose -p app -f docker-compose.prod.yml ps
```

Ожидаемо:

```text
backend   healthy
postgres  healthy
redis     healthy
nginx     Up
```

## 3. Health endpoints

```bash
curl -fsS https://uchicode.ru/nginx-health
curl -fsS https://uchicode.ru/api/health
```

Ожидаемо:

```text
ok
{"status":"ok","service":"uchicode-api"}
```

## 4. Main pages

Проверить в браузере:

```text
https://uchicode.ru
https://uchicode.ru/register
https://uchicode.ru/login
https://uchicode.ru/admin/
```

## 5. Admin

```bash
curl -I https://uchicode.ru/admin/
```

Ожидаемо без авторизации:

```text
HTTP/1.1 302 Found
Location: /admin/login/?next=/admin/
```

Если `503`, проверить `auth_limit` в nginx logs.

## 6. Register route

```bash
curl -i -X POST https://uchicode.ru/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{}'
```

Ожидаемо:

```text
400 Bad Request
```

## 7. Старый неправильный `/api/api`

```bash
curl -i -X POST https://uchicode.ru/api/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{}'
```

Ожидаемо:

```text
404 Not Found
```

## 8. Проверка frontend bundle

```bash
docker compose -p app -f docker-compose.prod.yml exec nginx sh -c 'grep -R "api/api" -n /usr/share/nginx/html || true'
```

Ожидаемо: пустой вывод.

## 9. Ports

```bash
ss -tulpn | grep -E ':80|:443|:8080|:8000|:5432|:6379'
```

Ожидаемо:

```text
0.0.0.0:80
0.0.0.0:443
127.0.0.1:8080
```

Не должно быть наружу:

```text
0.0.0.0:8000
0.0.0.0:8080
0.0.0.0:5432
0.0.0.0:6379
```

## 10. System services

```bash
sudo systemctl status uchicode-compose.service --no-pager
sudo systemctl status nginx --no-pager
sudo ufw status verbose
sudo fail2ban-client status
sudo certbot certificates
```

## 11. Backup после крупного релиза

```bash
/opt/uchicode/backup.sh
find /opt/uchicode/app/backups -maxdepth 2 -type f -ls | tail -n 20
```

## 12. Browser cache

После frontend update:

```text
Ctrl + F5
DevTools -> Network -> Disable cache -> Reload
```

В Network проверить:

```text
/api/auth/register/       правильно
/api/api/auth/register/   неправильно
```
