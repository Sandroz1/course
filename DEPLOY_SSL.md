# DEPLOY_SSL

## Предусловия

- DNS `uchicode.ru`, `www.uchicode.ru`, `api.uchicode.ru` указывает на VPS.
- На VPS открыты порты `80` и `443`.
- Реальный `.env.production` заполнен и не коммитится.

## Получить сертификат

До запуска production nginx получи сертификат на хосте:

```bash
sudo apt update
sudo apt install -y certbot
sudo certbot certonly --standalone \
  -d uchicode.ru \
  -d www.uchicode.ru \
  -d api.uchicode.ru
```

Production compose монтирует `/etc/letsencrypt` в nginx container, поэтому сертификат должен появиться здесь:

```text
/etc/letsencrypt/live/uchicode.ru/fullchain.pem
/etc/letsencrypt/live/uchicode.ru/privkey.pem
```

## Renewal

Проверка renewal:

```bash
sudo certbot renew --dry-run
```

После реального renewal перезагрузи nginx:

```bash
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```
