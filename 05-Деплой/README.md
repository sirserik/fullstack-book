# Глава 5: Деплой на Production

## Архитектура Production окружения

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PRODUCTION АРХИТЕКТУРА                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                           ИНТЕРНЕТ                                      │
│                              │                                          │
│                              ▼                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                         NGINX                                    │  │
│   │   • Reverse Proxy                                                │  │
│   │   • SSL Termination (Let's Encrypt)                              │  │
│   │   • Static Files                                                 │  │
│   │   • Load Balancing (опционально)                                 │  │
│   └────────────────────────┬──────────────────┬──────────────────────┘  │
│                            │                  │                         │
│              ┌─────────────┘                  └────────────┐            │
│              │                                             │            │
│              ▼                                             ▼            │
│   ┌─────────────────────┐                    ┌─────────────────────┐    │
│   │   PM2               │                    │   PHP-FPM           │    │
│   │   (Node.js)         │                    │   (Laravel)         │    │
│   │                     │                    │                     │    │
│   │   example.com:3000   │                    │   api.example.com  │    │
│   │   Nuxt SSR          │                    │   Laravel API       │    │
│   └─────────────────────┘                    └──────────┬──────────┘    │
│                                                         │               │
│                                              ┌──────────▼──────────┐    │
│                                              │      MySQL          │    │
│                                              │      Database       │    │
│                                              └─────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Требования к серверу

| Компонент | Минимум | Рекомендуется |
|-----------|---------|---------------|
| CPU | 1 core | 2+ cores |
| RAM | 2 GB | 4+ GB |
| Disk | 20 GB SSD | 40+ GB SSD |
| OS | Ubuntu 20.04 | Ubuntu 22.04 |

---

## Шаг 1: Подготовка сервера

### 1.1 Подключение к серверу

```bash
ssh root@your_server_ip
```

### 1.2 Обновление системы

```bash
apt update && apt upgrade -y
```

### 1.3 Создание пользователя

```bash
# Создаём пользователя
adduser deploy

# Добавляем в sudo группу
usermod -aG sudo deploy

# Переключаемся на пользователя
su - deploy
```

### 1.4 Настройка SSH ключей

```bash
# На локальной машине
ssh-keygen -t ed25519 -C "your_email@example.com"

# Копируем ключ на сервер
ssh-copy-id deploy@your_server_ip

# Теперь можно входить без пароля
ssh deploy@your_server_ip
```

### 1.5 Отключение входа по паролю (опционально)

```bash
sudo nano /etc/ssh/sshd_config

# Изменить:
PasswordAuthentication no

sudo systemctl restart sshd
```

---

## Шаг 2: Установка зависимостей

### 2.1 PHP 8.1

```bash
# Добавляем репозиторий
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Устанавливаем PHP и расширения
sudo apt install -y php8.1 php8.1-fpm php8.1-cli php8.1-mysql php8.1-xml \
    php8.1-curl php8.1-mbstring php8.1-zip php8.1-gd php8.1-intl \
    php8.1-bcmath php8.1-redis

# Проверяем
php -v
```

### 2.2 Composer

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

### 2.3 Node.js 18

```bash
# Используем NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Проверяем
node -v
npm -v
```

### 2.4 PM2

```bash
sudo npm install -g pm2
pm2 --version
```

### 2.5 MySQL 8

```bash
sudo apt install -y mysql-server

# Безопасная настройка
sudo mysql_secure_installation

# Создаём базу данных
sudo mysql -u root -p

CREATE DATABASE myapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON myapp.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.6 Nginx

```bash
sudo apt install -y nginx

# Проверяем статус
sudo systemctl status nginx
```

### 2.7 Git

```bash
sudo apt install -y git
```

---

## Шаг 3: Деплой Laravel (Backend)

### 3.1 Клонирование репозитория

```bash
# Создаём директорию
sudo mkdir -p /var/www/api.example.com
sudo chown -R deploy:deploy /var/www/api.example.com

# Клонируем
cd /var/www/api.example.com
git clone https://github.com/your-repo/app-backend.git .
```

### 3.2 Установка зависимостей

```bash
composer install --no-dev --optimize-autoloader
```

### 3.3 Настройка окружения

```bash
cp .env.example .env

nano .env
```

```env
APP_NAME=MyApp
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://api.example.com

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=myapp
DB_USERNAME=app_user
DB_PASSWORD=your_secure_password

CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
```

### 3.4 Генерация ключа и миграции

```bash
php artisan key:generate
php artisan migrate --force
php artisan storage:link
```

### 3.5 Оптимизация

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 3.6 Права доступа

```bash
sudo chown -R www-data:www-data /var/www/api.example.com
sudo chmod -R 755 /var/www/api.example.com
sudo chmod -R 775 /var/www/api.example.com/storage
sudo chmod -R 775 /var/www/api.example.com/bootstrap/cache
```

### 3.7 Nginx конфигурация для Laravel

```bash
sudo nano /etc/nginx/sites-available/api.example.com
```

```nginx
server {
    listen 80;
    server_name api.example.com;
    root /var/www/api.example.com/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php index.html;

    charset utf-8;

    # Максимальный размер загрузки
    client_max_body_size 100M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Статические файлы
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|pdf|doc|docx)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Активируем сайт
sudo ln -s /etc/nginx/sites-available/api.example.com /etc/nginx/sites-enabled/

# Проверяем конфигурацию
sudo nginx -t

# Перезапускаем
sudo systemctl reload nginx
```

---

## Шаг 4: Деплой Nuxt (Frontend)

### 4.1 Клонирование

```bash
sudo mkdir -p /var/www/example.com
sudo chown -R deploy:deploy /var/www/example.com

cd /var/www/example.com
git clone https://github.com/your-repo/app-frontend.git .
```

### 4.2 Установка и сборка

```bash
npm install
npm run build
```

### 4.3 Настройка PM2

```bash
# Создаём ecosystem файл
nano ecosystem.config.js
```

```javascript
// ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'app-frontend',
      port: 3000,
      exec_mode: 'cluster',
      instances: 'max',
      script: './.output/server/index.mjs',
      env: {
        NODE_ENV: 'production',
        NUXT_PUBLIC_API_BASE: 'https://api.example.com/api'
      }
    }
  ]
}
```

### 4.4 Запуск через PM2

```bash
pm2 start ecosystem.config.js

# Проверяем статус
pm2 status

# Логи
pm2 logs app-frontend

# Автозапуск при перезагрузке сервера
pm2 startup
pm2 save
```

### 4.5 Nginx конфигурация для Nuxt

```bash
sudo nano /etc/nginx/sites-available/example.com
```

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Статические ассеты Nuxt
    location /_nuxt/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Шаг 5: SSL сертификаты (Let's Encrypt)

### 5.1 Установка Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Получение сертификатов

```bash
# Для backend
sudo certbot --nginx -d api.example.com

# Для frontend
sudo certbot --nginx -d example.com -d www.example.com
```

### 5.3 Автопродление

```bash
# Проверяем автопродление
sudo certbot renew --dry-run

# Добавляем в cron (обычно certbot делает это автоматически)
sudo crontab -e

# Добавляем строку:
0 3 * * * certbot renew --quiet
```

### 5.4 Финальная конфигурация Nginx (после SSL)

```nginx
# /etc/nginx/sites-available/api.example.com

server {
    listen 80;
    server_name api.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    root /var/www/api.example.com/public;
    index index.php;

    client_max_body_size 100M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

```nginx
# /etc/nginx/sites-available/example.com

server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://example.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.example.com;
    return 301 https://example.com$request_uri;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_nuxt/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Шаг 6: Скрипты деплоя

### 6.1 deploy-backend.sh

```bash
#!/bin/bash
# /var/www/api.example.com/deploy.sh

set -e

echo "🚀 Deploying Laravel Backend..."

cd /var/www/api.example.com

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
composer install --no-dev --optimize-autoloader

echo "🔄 Running migrations..."
php artisan migrate --force

echo "🧹 Clearing caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear

echo "⚡ Caching..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "🔒 Setting permissions..."
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

echo "✅ Backend deployed successfully!"
```

### 6.2 deploy-frontend.sh

```bash
#!/bin/bash
# /var/www/example.com/deploy.sh

set -e

echo "🚀 Deploying Nuxt Frontend..."

cd /var/www/example.com

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart app-frontend

echo "✅ Frontend deployed successfully!"
```

### 6.3 Права на выполнение

```bash
chmod +x /var/www/api.example.com/deploy.sh
chmod +x /var/www/example.com/deploy.sh
```

---

## Шаг 7: Мониторинг и логи

### 7.1 PM2 мониторинг

```bash
# Статус всех процессов
pm2 status

# Мониторинг в реальном времени
pm2 monit

# Логи
pm2 logs app-frontend

# Информация о процессе
pm2 show app-frontend
```

### 7.2 Nginx логи

```bash
# Access log
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log
```

### 7.3 Laravel логи

```bash
tail -f /var/www/api.example.com/storage/logs/laravel.log
```

### 7.4 Системные логи

```bash
# Journalctl
sudo journalctl -u nginx -f
sudo journalctl -u php8.1-fpm -f
```

---

## Шаг 8: Резервное копирование

### 8.1 Скрипт бэкапа базы данных

```bash
#!/bin/bash
# /home/deploy/backup.sh

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/home/deploy/backups"
DB_NAME="myapp"
DB_USER="app_user"
DB_PASS="your_secure_password"

mkdir -p $BACKUP_DIR

# Бэкап базы данных
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Бэкап файлов (storage)
tar -czf $BACKUP_DIR/storage_$DATE.tar.gz /var/www/api.example.com/storage

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 8.2 Cron для автоматического бэкапа

```bash
crontab -e

# Ежедневно в 3:00
0 3 * * * /home/deploy/backup.sh >> /home/deploy/backup.log 2>&1
```

---

## Шаг 9: Firewall (UFW)

```bash
# Включаем UFW
sudo ufw enable

# Разрешаем SSH
sudo ufw allow OpenSSH

# Разрешаем HTTP и HTTPS
sudo ufw allow 'Nginx Full'

# Проверяем статус
sudo ufw status
```

---

## Шаг 10: CI/CD с GitHub Actions

### .github/workflows/deploy.yml

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/api.example.com
            ./deploy.sh

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/example.com
            ./deploy.sh
```

### Настройка секретов в GitHub

1. Перейдите в Settings → Secrets and variables → Actions
2. Добавьте:
   - `SERVER_HOST` — IP сервера
   - `SERVER_USER` — deploy
   - `SSH_PRIVATE_KEY` — содержимое приватного ключа

---

## Альтернатива: Docker деплой

### docker-compose.yml

```yaml
version: '3.8'

services:
  # Laravel Backend
  backend:
    build:
      context: ./app-backend
      dockerfile: Dockerfile
    container_name: app-backend
    restart: unless-stopped
    volumes:
      - ./app-backend:/var/www/html
      - ./app-backend/storage:/var/www/html/storage
    environment:
      - APP_ENV=production
      - DB_HOST=db
    depends_on:
      - db
    networks:
      - app-network

  # Nuxt Frontend
  frontend:
    build:
      context: ./app-frontend
      dockerfile: Dockerfile
    container_name: app-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NUXT_PUBLIC_API_BASE=https://api.example.com/api
    networks:
      - app-network

  # MySQL Database
  db:
    image: mysql:8.0
    container_name: app-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_DATABASE}
      MYSQL_USER: ${DB_USERNAME}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - app-network

  # Nginx
  nginx:
    image: nginx:alpine
    container_name: app-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./certbot/www:/var/www/certbot
      - ./certbot/conf:/etc/letsencrypt
    depends_on:
      - backend
      - frontend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mysql-data:
```

### Dockerfile для Laravel

```dockerfile
# app-backend/Dockerfile

FROM php:8.1-fpm

# Установка зависимостей
RUN apt-get update && apt-get install -y \
    git curl zip unzip libpng-dev libonig-dev libxml2-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --optimize-autoloader

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]
```

### Dockerfile для Nuxt

```dockerfile
# app-frontend/Dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

---

## Чек-лист деплоя

### Сервер
- [ ] Создан пользователь deploy
- [ ] Настроены SSH ключи
- [ ] Установлен PHP 8.1 + расширения
- [ ] Установлен Composer
- [ ] Установлен Node.js 18
- [ ] Установлен PM2
- [ ] Установлен MySQL 8
- [ ] Установлен Nginx
- [ ] Настроен UFW

### Backend (Laravel)
- [ ] Склонирован репозиторий
- [ ] Установлены зависимости (composer install)
- [ ] Настроен .env
- [ ] Сгенерирован ключ
- [ ] Выполнены миграции
- [ ] Создан storage link
- [ ] Настроен Nginx vhost
- [ ] Настроены права доступа

### Frontend (Nuxt)
- [ ] Склонирован репозиторий
- [ ] Установлены зависимости (npm install)
- [ ] Выполнена сборка (npm run build)
- [ ] Настроен PM2 ecosystem
- [ ] Запущен через PM2
- [ ] Настроен Nginx vhost

### SSL
- [ ] Установлен Certbot
- [ ] Получены сертификаты для всех доменов
- [ ] Настроено автопродление
- [ ] Настроен редирект HTTP → HTTPS

### Автоматизация
- [ ] Созданы скрипты деплоя
- [ ] Настроен cron для бэкапов
- [ ] (Опционально) Настроен CI/CD

---

## Полезные команды

```bash
# Перезапуск сервисов
sudo systemctl restart nginx
sudo systemctl restart php8.1-fpm
pm2 restart all

# Проверка статуса
sudo systemctl status nginx
sudo systemctl status php8.1-fpm
pm2 status

# Проверка портов
sudo netstat -tlnp

# Использование диска
df -h

# Использование памяти
free -m

# Процессы
htop
```

---

**Поздравляем! Ваше приложение развёрнуто на production сервере!**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ГОТОВО К PRODUCTION                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ✅ https://example.com          — Frontend (Nuxt SSR)                  │
│   ✅ https://api.example.com    — Backend API (Laravel)                │
│   ✅ SSL сертификаты             — Let's Encrypt                        │
│   ✅ Автоматический деплой       — GitHub Actions                       │
│   ✅ Мониторинг                  — PM2                                   │
│   ✅ Резервное копирование       — Ежедневные бэкапы                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```
