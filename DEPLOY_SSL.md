# DEPLOY_SSL

## Предусловия

- DNS `uchicode.ru` и `www.uchicode.ru` указывает на VPS.
- На VPS открыты порты `80` и `443`.
- Реальный `.env.production` заполнен и не коммитится.

## Получить сертификат

После настройки host Nginx получи сертификат через webroot:

```bash
sudo apt update
sudo apt install -y certbot
sudo mkdir -p /var/www/certbot
sudo certbot certonly --webroot -w /var/www/certbot \
  -d uchicode.ru \
  -d www.uchicode.ru
```

Host Nginx использует стандартные пути Let's Encrypt:

```text
/etc/letsencrypt/live/uchicode.ru/fullchain.pem
/etc/letsencrypt/live/uchicode.ru/privkey.pem
```

После выпуска сертификата раскомментируй `443` blocks в `deploy/nginx/uchicode.ru.conf.example`, перенеси изменения в `/etc/nginx/sites-available/uchicode.ru` и перезагрузи host Nginx.

## Renewal

Проверка renewal:

```bash
sudo certbot renew --dry-run
```

После реального renewal перезагрузи host Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```
