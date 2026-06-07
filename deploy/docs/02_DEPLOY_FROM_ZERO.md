# 02. Deploy from zero

Команды `powershell` выполнять на Windows. Команды `bash` выполнять на VPS.

## 1. DNS в REG.RU

В DNS-зоне домена:

```text
uchicode.ru       A  2.26.99.141
www.uchicode.ru   A  2.26.99.141
```

Удалить `AAAA` для:

```text
uchicode.ru
www.uchicode.ru
```

Не трогать без необходимости:

```text
NS
SOA
MX
TXT
mail
smtp
pop
```

Проверка с Windows:

```powershell
nslookup uchicode.ru
nslookup www.uchicode.ru
nslookup uchicode.ru 8.8.8.8
nslookup www.uchicode.ru 8.8.8.8
```

## 2. Первичный вход root

```powershell
ssh root@2.26.99.141
```

```bash
apt update && apt upgrade -y
apt install -y git nginx ufw fail2ban ca-certificates curl gnupg nano lsb-release snapd
```

## 3. Swap 2 GB

```bash
free -h
swapon --show

swapoff /swapfile || true
rm -f /swapfile
dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

cp /etc/fstab /etc/fstab.backup
sed -i '/swap/d' /etc/fstab
echo '/swapfile none swap sw 0 0' >> /etc/fstab

free -h
swapon --show
```

## 4. Пользователь deploy и SSH key

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /opt/uchicode
chown -R deploy:deploy /opt/uchicode
```

На Windows создать ключ:

```powershell
ssh-keygen -t ed25519 -C "deploy@uchicode" -f $env:USERPROFILE\.ssh\uchicode_deploy
type $env:USERPROFILE\.ssh\uchicode_deploy.pub
```

На VPS вставить публичный ключ:

```bash
mkdir -p /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chmod go-w /home/deploy
```

Проверка с Windows:

```powershell
ssh -o PreferredAuthentications=publickey -o PasswordAuthentication=no -i $env:USERPROFILE\.ssh\uchicode_deploy deploy@2.26.99.141
```

## 5. Docker

На VPS под root или через `sudo -i`:

```bash
apt remove -y docker.io docker-compose docker-compose-v2 podman-docker containerd runc || true
apt update
apt install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
```

Создать Docker apt source:

```bash
nano /etc/apt/sources.list.d/docker.sources
```

Для Ubuntu 24.04 обычно:

```text
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: noble
Components: stable
Architectures: amd64
Signed-By: /etc/apt/keyrings/docker.asc
```

Установка:

```bash
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker
systemctl start docker
usermod -aG docker deploy
```

Выйти из SSH и зайти заново под `deploy`.

```bash
docker --version
docker compose version
docker ps
```

## 6. Проект

```bash
cd /opt/uchicode
git clone https://github.com/Sandroz1/course app
cd /opt/uchicode/app
git fetch origin main
git checkout origin/main
```

Если нужно закрепиться на проверенном commit hotfix-релиза:

```bash
git checkout c05f7b9
```

Если tag `v0.1.2` опубликован в GitHub, можно использовать:

```bash
git fetch --all --tags
git checkout v0.1.2
```

## 7. `.env.production`

```bash
cd /opt/uchicode/app
cp .env.production.example .env.production
chmod 600 .env.production
```

Сгенерировать секреты:

```bash
python3 - <<'PY'
import secrets
print("DJANGO_SECRET_KEY=" + secrets.token_urlsafe(64))
print("POSTGRES_PASSWORD=" + secrets.token_urlsafe(32))
PY
```

Минимально проверить после редактирования:

```bash
grep -n "change-me\|GENERATE\|СЮДА\|ВСТАВЬ" .env.production || echo "ok: placeholders not found"
cut -d= -f1 .env.production | sed '/^#/d;/^$/d'
```

## 8. Docker compose запуск

```bash
cd /opt/uchicode/app
docker compose -p app -f docker-compose.prod.yml config
docker compose -p app -f docker-compose.prod.yml build --pull
docker compose -p app -f docker-compose.prod.yml up -d --remove-orphans
docker compose -p app -f docker-compose.prod.yml ps
```

Smoke:

```bash
curl -fsS http://127.0.0.1:8080/nginx-health
curl -fsS http://127.0.0.1:8080/api/health
curl -I http://127.0.0.1:8080
ss -tulpn | grep -E ':80|:443|:8080|:8000|:5432|:6379'
```

## 9. Host Nginx

```bash
sudo nano /etc/nginx/sites-available/uchicode.ru
```

Конфиг:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name uchicode.ru www.uchicode.ru;
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Включить:

```bash
sudo ln -sf /etc/nginx/sites-available/uchicode.ru /etc/nginx/sites-enabled/uchicode.ru
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 10. HTTPS, UFW, fail2ban, systemd, backup

HTTPS:

```bash
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx -d uchicode.ru -d www.uchicode.ru
sudo certbot renew --dry-run
```

UFW:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

fail2ban:

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status
```

systemd:

```bash
sudo cp /opt/uchicode/app/deploy/systemd/uchicode-compose.service.example /etc/systemd/system/uchicode-compose.service
sudo systemctl daemon-reload
sudo systemctl enable uchicode-compose.service
sudo systemctl start uchicode-compose.service
```

backup:

```bash
cp /opt/uchicode/app/deploy/scripts/backup.sh.example /opt/uchicode/backup.sh
chmod +x /opt/uchicode/backup.sh
/opt/uchicode/backup.sh
crontab -e
```

Cron line:

```cron
30 3 * * * /opt/uchicode/backup.sh >> /opt/uchicode/backup.log 2>&1
```

## 11. Reboot test

```bash
sudo reboot
```

После перезагрузки:

```bash
cd /opt/uchicode/app
sudo systemctl status uchicode-compose.service --no-pager
docker compose -p app -f docker-compose.prod.yml ps
curl -fsS https://uchicode.ru/nginx-health
curl -fsS https://uchicode.ru/api/health
```
