# DEPLOY_SSL

Короткая памятка по HTTPS на host Nginx. Основной сценарий первого деплоя описан в [deploy/docs/02_DEPLOY_FROM_ZERO.md](deploy/docs/02_DEPLOY_FROM_ZERO.md).

## Предусловия

- DNS `uchicode.ru` и `www.uchicode.ru` указывает на VPS `2.26.99.141`.
- На VPS открыты только нужные публичные порты: `22`, `80`, `443`.
- Docker nginx доступен локально на VPS через `127.0.0.1:8080`.
- `.env.production` заполнен и не находится в git.

## Получить сертификат

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d uchicode.ru -d www.uchicode.ru
```

Пути Let's Encrypt:

```text
/etc/letsencrypt/live/uchicode.ru/fullchain.pem
/etc/letsencrypt/live/uchicode.ru/privkey.pem
```

## Проверить HTTPS

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -I https://uchicode.ru
curl -fsS https://uchicode.ru/nginx-health
curl -fsS https://uchicode.ru/api/health
```

## Renewal

```bash
sudo certbot renew --dry-run
sudo nginx -t
sudo systemctl reload nginx
```

Если certbot менял Nginx-конфиг автоматически, сверить его с [deploy/nginx/uchicode.ru.conf.example](deploy/nginx/uchicode.ru.conf.example).
