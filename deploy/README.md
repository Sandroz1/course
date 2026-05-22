# Production Deploy Baseline

Цель: host Nginx на VPS принимает `80/443`, держит HTTPS и проксирует трафик на Docker nginx, опубликованный только на `127.0.0.1:8080`.

## DNS в REG.RU

- `A @ -> IPv4 VPS`
- `CNAME www -> uchicode.ru.`

Подождать обновления DNS и проверить `dig uchicode.ru` / `dig www.uchicode.ru`.

## Подготовка VPS

Установить Docker, Docker Compose plugin, nginx, certbot, ufw и fail2ban.

Минимальный набор:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx ufw fail2ban
```

Docker ставить по официальной инструкции Docker для текущего Ubuntu/Debian образа VPS.

## Первый запуск вручную

```bash
sudo mkdir -p /opt/uchicode
sudo chown -R deploy:deploy /opt/uchicode
cd /opt/uchicode
git clone https://github.com/Sandroz1/course.git app
cd /opt/uchicode/app
cp .env.production.example .env.production
nano .env.production
```

В `.env.production` заменить все placeholder-значения: `DJANGO_SECRET_KEY`, `DATABASE_URL`, `POSTGRES_PASSWORD`, ключи AI/SMS при использовании.

Проверка и запуск:

```bash
docker compose -f docker-compose.prod.yml config
docker compose -f docker-compose.prod.yml build --pull
docker compose -f docker-compose.prod.yml up -d
curl -fsS http://127.0.0.1:8080/nginx-health
curl -fsS http://127.0.0.1:8080/api/health
```

Docker nginx должен слушать только loopback:

```bash
ss -ltnp | grep 8080
```

Ожидаемо: `127.0.0.1:8080`, не `0.0.0.0:8080`.

## Host Nginx

Скопировать пример:

```bash
sudo cp deploy/nginx/uchicode.ru.conf.example /etc/nginx/sites-available/uchicode.ru
sudo ln -s /etc/nginx/sites-available/uchicode.ru /etc/nginx/sites-enabled/uchicode.ru
sudo mkdir -p /var/www/certbot
sudo nginx -t
sudo systemctl reload nginx
```

До выпуска сертификата активный `80` server block проксирует на Docker nginx и отдаёт ACME webroot. После выпуска сертификата раскомментировать `443` server blocks из example-конфига.

## Let's Encrypt

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d uchicode.ru -d www.uchicode.ru
sudo certbot renew --dry-run
sudo nginx -t
sudo systemctl reload nginx
```

Проверить:

```bash
curl -fsS https://uchicode.ru
curl -fsS https://uchicode.ru/api/health
```

## Systemd unit

```bash
sudo cp deploy/systemd/uchicode-compose.service.example /etc/systemd/system/uchicode-compose.service
sudo systemctl daemon-reload
sudo systemctl enable uchicode-compose.service
sudo systemctl start uchicode-compose.service
sudo systemctl status uchicode-compose.service
```

## Backup

```bash
cp deploy/scripts/backup.sh.example deploy/scripts/backup.sh
chmod +x deploy/scripts/backup.sh
APP_DIR=/opt/uchicode/app deploy/scripts/backup.sh
```

Скрипт не удаляет старые backup-файлы. Политику хранения нужно выбрать отдельно.

## Rollback

```bash
cd /opt/uchicode/app
git fetch --all --tags
git checkout <previous-tag>
docker compose -f docker-compose.prod.yml build --pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
curl -fsS http://127.0.0.1:8080/nginx-health
curl -fsS http://127.0.0.1:8080/api/health
```

## PostgreSQL migration — отдельный этап

`docker-compose.prod.yml` уже использует PostgreSQL service. Если нужно переносить данные из SQLite или другого окружения, это отдельная операция:

1. Сделать backup текущей БД и media.
2. Подготовить `DATABASE_URL` для PostgreSQL.
3. Выполнить миграции на пустой PostgreSQL.
4. Перенести данные через `dumpdata`/`loaddata` или отдельный проверенный dump.
5. Проверить авторизацию, прогресс, AI usage и админку.

Не смешивать миграцию данных с обычным deploy.
