# Глава 6: Docker и Docker Compose

## Зачем Docker?

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ПРЕИМУЩЕСТВА DOCKER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   БЕЗ DOCKER                           С DOCKER                         │
│   ──────────                           ─────────                        │
│                                                                         │
│   "У меня работает"                    "Работает везде одинаково"       │
│   PHP 7.4 vs PHP 8.1                   Фиксированные версии             │
│   Разные конфиги                       Единый docker-compose.yml        │
│   Сложный деплой                       docker-compose up -d             │
│   Конфликты зависимостей               Изолированные контейнеры         │
│                                                                         │
│   АРХИТЕКТУРА:                                                          │
│   ────────────                                                          │
│                                                                         │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│   │  Nginx  │  │ PHP-FPM │  │  Node   │  │  MySQL  │  │  Redis  │       │
│   │  :80    │  │  :9000  │  │  :3000  │  │  :3306  │  │  :6379  │       │
│   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│        │            │            │            │            │            │
│        └────────────┴────────────┴────────────┴────────────┘            │
│                              │                                          │
│                     Docker Network                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Установка Docker

### Ubuntu/Debian

```bash
# Удаляем старые версии
sudo apt remove docker docker-engine docker.io containerd runc

# Устанавливаем зависимости
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

# Добавляем GPG ключ Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Добавляем репозиторий
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Устанавливаем Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Добавляем пользователя в группу docker
sudo usermod -aG docker $USER

# Перелогиниваемся или выполняем
newgrp docker

# Проверяем
docker --version
docker compose version
```

### macOS

```bash
# Установите Docker Desktop с https://www.docker.com/products/docker-desktop
# Или через Homebrew:
brew install --cask docker
```

### Windows

Скачайте Docker Desktop с https://www.docker.com/products/docker-desktop

---

## Структура проекта

```
app-docker/
├── docker-compose.yml          # Главный файл оркестрации
├── docker-compose.override.yml # Переопределения для development
├── docker-compose.prod.yml     # Production конфигурация
├── .env                        # Переменные окружения
├── .env.example                # Пример переменных
│
├── backend/                    # Laravel приложение
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   ├── .dockerignore
│   └── ... (Laravel файлы)
│
├── frontend/                   # Nuxt приложение
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   ├── .dockerignore
│   └── ... (Nuxt файлы)
│
├── nginx/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── conf.d/
│       ├── default.conf
│       ├── backend.conf
│       └── frontend.conf
│
├── mysql/
│   ├── my.cnf
│   └── init/
│       └── 01-create-database.sql
│
└── scripts/
    ├── deploy.sh
    ├── backup.sh
    └── restore.sh
```

---

## Переменные окружения

### .env.example

```env
# Application
APP_NAME=MyApp
APP_ENV=local
APP_DEBUG=true

# Domains
BACKEND_DOMAIN=api.app.local
FRONTEND_DOMAIN=app.local

# Database
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=myapp
DB_USERNAME=app_user
DB_PASSWORD=secret_password
DB_ROOT_PASSWORD=root_secret_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=null

# Node
NODE_ENV=development
NUXT_PUBLIC_API_BASE=http://api.app.local/api

# PHP
PHP_VERSION=8.1
PHP_MEMORY_LIMIT=256M
PHP_UPLOAD_MAX_FILESIZE=100M
PHP_POST_MAX_SIZE=100M

# Nginx
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
```

### .env (скопируйте и настройте)

```bash
cp .env.example .env
nano .env
```

---

## Docker Compose (Development)

### docker-compose.yml

```yaml
version: '3.8'

services:
  # ===========================================
  # NGINX - Reverse Proxy
  # ===========================================
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    container_name: app-nginx
    restart: unless-stopped
    ports:
      - "${NGINX_HTTP_PORT:-80}:80"
      - "${NGINX_HTTPS_PORT:-443}:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./backend:/var/www/backend:ro
      - ./certbot/www:/var/www/certbot:ro
      - ./certbot/conf:/etc/letsencrypt:ro
    depends_on:
      - backend
      - frontend
    networks:
      - app-network

  # ===========================================
  # BACKEND - Laravel + PHP-FPM
  # ===========================================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      args:
        PHP_VERSION: ${PHP_VERSION:-8.1}
    container_name: app-backend
    restart: unless-stopped
    working_dir: /var/www/backend
    volumes:
      - ./backend:/var/www/backend
      - ./backend/storage:/var/www/backend/storage
      - ./backend/bootstrap/cache:/var/www/backend/bootstrap/cache
    environment:
      APP_NAME: ${APP_NAME}
      APP_ENV: ${APP_ENV}
      APP_DEBUG: ${APP_DEBUG}
      APP_URL: http://${BACKEND_DOMAIN}
      DB_CONNECTION: ${DB_CONNECTION}
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_DATABASE: ${DB_DATABASE}
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: ${REDIS_HOST}
      REDIS_PORT: ${REDIS_PORT}
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app-network

  # ===========================================
  # FRONTEND - Nuxt 3
  # ===========================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: app-frontend
    restart: unless-stopped
    working_dir: /app
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.nuxt
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      NUXT_PUBLIC_API_BASE: ${NUXT_PUBLIC_API_BASE}
    ports:
      - "24678:24678"  # HMR порт для development
    command: npm run dev -- --host 0.0.0.0
    networks:
      - app-network

  # ===========================================
  # MySQL Database
  # ===========================================
  mysql:
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
      - ./mysql/my.cnf:/etc/mysql/conf.d/my.cnf:ro
      - ./mysql/init:/docker-entrypoint-initdb.d:ro
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  # ===========================================
  # Redis Cache
  # ===========================================
  redis:
    image: redis:7-alpine
    container_name: app-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    networks:
      - app-network

  # ===========================================
  # phpMyAdmin (только для development)
  # ===========================================
  phpmyadmin:
    image: phpmyadmin:latest
    container_name: app-phpmyadmin
    restart: unless-stopped
    environment:
      PMA_HOST: mysql
      PMA_USER: root
      PMA_PASSWORD: ${DB_ROOT_PASSWORD}
      UPLOAD_LIMIT: 100M
    ports:
      - "8080:80"
    depends_on:
      - mysql
    networks:
      - app-network
    profiles:
      - dev

  # ===========================================
  # Mailhog (перехват email для development)
  # ===========================================
  mailhog:
    image: mailhog/mailhog
    container_name: app-mailhog
    restart: unless-stopped
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - app-network
    profiles:
      - dev

# ===========================================
# Networks
# ===========================================
networks:
  app-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

# ===========================================
# Volumes
# ===========================================
volumes:
  mysql-data:
    driver: local
  redis-data:
    driver: local
```

---

## Dockerfile для Laravel

### backend/Dockerfile

```dockerfile
# ===========================================
# Laravel Backend Dockerfile (Development)
# ===========================================

ARG PHP_VERSION=8.1

FROM php:${PHP_VERSION}-fpm

LABEL maintainer="MyApp Development Team"

# Аргументы
ARG USER_ID=1000
ARG GROUP_ID=1000

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libwebp-dev \
    libxpm-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Установка PHP расширений
RUN docker-php-ext-configure gd \
    --with-freetype \
    --with-jpeg \
    --with-webp \
    --with-xpm

RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    intl \
    opcache

# Установка Redis расширения
RUN pecl install redis && docker-php-ext-enable redis

# Установка Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Настройка PHP
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini

# Создание пользователя
RUN groupadd -g ${GROUP_ID} www \
    && useradd -u ${USER_ID} -g www -m www \
    && chown -R www:www /var/www

# Рабочая директория
WORKDIR /var/www/backend

# Переключаемся на пользователя
USER www

EXPOSE 9000

CMD ["php-fpm"]
```

### backend/Dockerfile.prod

```dockerfile
# ===========================================
# Laravel Backend Dockerfile (Production)
# ===========================================

ARG PHP_VERSION=8.1

# Stage 1: Composer dependencies
FROM composer:latest AS composer

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --ignore-platform-reqs

COPY . .

RUN composer dump-autoload --optimize --no-dev

# Stage 2: Production image
FROM php:${PHP_VERSION}-fpm-alpine

LABEL maintainer="MyApp Development Team"

# Установка зависимостей
RUN apk add --no-cache \
    git \
    curl \
    zip \
    unzip \
    libpng-dev \
    oniguruma-dev \
    libxml2-dev \
    libzip-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    libwebp-dev

# Установка PHP расширений
RUN docker-php-ext-configure gd \
    --with-freetype \
    --with-jpeg \
    --with-webp

RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    intl \
    opcache

# Установка Redis
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Копирование конфигурации PHP
COPY docker/php.prod.ini /usr/local/etc/php/conf.d/custom.ini

# Рабочая директория
WORKDIR /var/www/backend

# Копирование приложения
COPY --from=composer /app /var/www/backend

# Права доступа
RUN chown -R www-data:www-data /var/www/backend \
    && chmod -R 755 /var/www/backend/storage \
    && chmod -R 755 /var/www/backend/bootstrap/cache

USER www-data

EXPOSE 9000

CMD ["php-fpm"]
```

### backend/docker/php.ini

```ini
; PHP Configuration for Development

[PHP]
memory_limit = 256M
upload_max_filesize = 100M
post_max_size = 100M
max_execution_time = 300
max_input_time = 300

display_errors = On
display_startup_errors = On
error_reporting = E_ALL

[Date]
date.timezone = Asia/Almaty

[opcache]
opcache.enable = 0
```

### backend/docker/php.prod.ini

```ini
; PHP Configuration for Production

[PHP]
memory_limit = 256M
upload_max_filesize = 100M
post_max_size = 100M
max_execution_time = 60
max_input_time = 60

display_errors = Off
display_startup_errors = Off
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
log_errors = On

expose_php = Off

[Date]
date.timezone = Asia/Almaty

[opcache]
opcache.enable = 1
opcache.memory_consumption = 128
opcache.interned_strings_buffer = 8
opcache.max_accelerated_files = 10000
opcache.revalidate_freq = 0
opcache.validate_timestamps = 0
opcache.save_comments = 1
opcache.fast_shutdown = 1
```

### backend/.dockerignore

```
.git
.gitignore
.env
.env.example
docker-compose*.yml
Dockerfile*
README.md
node_modules
vendor
storage/logs/*
storage/framework/cache/*
storage/framework/sessions/*
storage/framework/views/*
bootstrap/cache/*
tests
phpunit.xml
.phpunit.result.cache
```

---

## Dockerfile для Nuxt

### frontend/Dockerfile

```dockerfile
# ===========================================
# Nuxt Frontend Dockerfile (Development)
# ===========================================

FROM node:18-alpine

LABEL maintainer="MyApp Development Team"

# Установка зависимостей для node-gyp
RUN apk add --no-cache python3 make g++

# Рабочая директория
WORKDIR /app

# Копирование package files
COPY package*.json ./

# Установка зависимостей
RUN npm ci

# Копирование исходников
COPY . .

# Порты
EXPOSE 3000 24678

# Команда по умолчанию
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### frontend/Dockerfile.prod

```dockerfile
# ===========================================
# Nuxt Frontend Dockerfile (Production)
# ===========================================

# Stage 1: Dependencies
FROM node:18-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

# Stage 2: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build arguments
ARG NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE

RUN npm run build

# Stage 3: Production
FROM node:18-alpine AS runner

LABEL maintainer="MyApp Development Team"

WORKDIR /app

ENV NODE_ENV=production

# Создаём пользователя
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nuxtjs

# Копирование билда
COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output

USER nuxtjs

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
```

### frontend/.dockerignore

```
.git
.gitignore
.nuxt
.output
node_modules
npm-debug.log
Dockerfile*
docker-compose*.yml
README.md
.env*
```

---

## Nginx Configuration

### nginx/Dockerfile

```dockerfile
FROM nginx:alpine

LABEL maintainer="MyApp Development Team"

# Удаляем дефолтный конфиг
RUN rm /etc/nginx/conf.d/default.conf

# Копируем наш конфиг
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

### nginx/nginx.conf

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    multi_accept on;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/xml application/xml+rss text/javascript application/x-javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    include /etc/nginx/conf.d/*.conf;
}
```

### nginx/conf.d/backend.conf

```nginx
# Laravel Backend
server {
    listen 80;
    server_name api.app.local api.example.com;

    root /var/www/backend/public;
    index index.php;

    charset utf-8;
    client_max_body_size 100M;

    # API rate limiting
    location /api {
        limit_req zone=api burst=20 nodelay;
        try_files $uri $uri/ /index.php?$query_string;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass backend:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Статика с кэшированием
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|pdf|doc|docx|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### nginx/conf.d/frontend.conf

```nginx
# Nuxt Frontend
server {
    listen 80;
    server_name app.local example.com www.example.com;

    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # HMR WebSocket для development
    location /_nuxt/ {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        proxy_pass http://frontend:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## MySQL Configuration

### mysql/my.cnf

```ini
[mysqld]
# Charset
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# InnoDB
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Query cache (deprecated in MySQL 8, но полезно знать)
# query_cache_type = 1
# query_cache_size = 32M

# Connections
max_connections = 200
wait_timeout = 600
interactive_timeout = 600

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Binary log (для репликации)
# log_bin = mysql-bin
# binlog_format = ROW
# expire_logs_days = 7

[client]
default-character-set = utf8mb4

[mysql]
default-character-set = utf8mb4
```

### mysql/init/01-create-database.sql

```sql
-- Создание базы данных (если не существует)
CREATE DATABASE IF NOT EXISTS `etu`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Права пользователя
GRANT ALL PRIVILEGES ON `myapp`.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
```

---

## Production Docker Compose

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    container_name: app-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./backend/public:/var/www/backend/public:ro
      - ./backend/storage/app/public:/var/www/backend/storage/app/public:ro
      - ./certbot/www:/var/www/certbot:ro
      - ./certbot/conf:/etc/letsencrypt:ro
    depends_on:
      - backend
      - frontend
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: app-backend
    restart: always
    environment:
      APP_NAME: ${APP_NAME}
      APP_ENV: production
      APP_DEBUG: "false"
      APP_URL: https://${BACKEND_DOMAIN}
      DB_CONNECTION: ${DB_CONNECTION}
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_DATABASE: ${DB_DATABASE}
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: ${REDIS_HOST}
      REDIS_PORT: ${REDIS_PORT}
      CACHE_DRIVER: redis
      SESSION_DRIVER: redis
      QUEUE_CONNECTION: redis
    volumes:
      - backend-storage:/var/www/backend/storage
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        NUXT_PUBLIC_API_BASE: https://${BACKEND_DOMAIN}/api
    container_name: app-frontend
    restart: always
    environment:
      NODE_ENV: production
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  mysql:
    image: mysql:8.0
    container_name: app-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_DATABASE}
      MYSQL_USER: ${DB_USERNAME}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
      - ./mysql/my.cnf:/etc/mysql/conf.d/my.cnf:ro
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_ROOT_PASSWORD}"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    container_name: app-redis
    restart: always
    command: redis-server --appendonly yes --maxmemory 128mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Certbot для SSL
  certbot:
    image: certbot/certbot
    container_name: app-certbot
    volumes:
      - ./certbot/www:/var/www/certbot
      - ./certbot/conf:/etc/letsencrypt
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mysql-data:
  redis-data:
  backend-storage:
```

---

## Скрипты управления

### scripts/deploy.sh

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Переходим в директорию проекта
cd /opt/app-docker

# Получаем последние изменения
echo "📥 Pulling latest changes..."
git pull origin main

# Останавливаем контейнеры
echo "🛑 Stopping containers..."
docker compose -f docker-compose.prod.yml down

# Пересобираем образы
echo "🔨 Building images..."
docker compose -f docker-compose.prod.yml build --no-cache

# Запускаем контейнеры
echo "🚀 Starting containers..."
docker compose -f docker-compose.prod.yml up -d

# Ждём пока MySQL будет готов
echo "⏳ Waiting for MySQL..."
sleep 10

# Выполняем миграции Laravel
echo "📦 Running migrations..."
docker compose -f docker-compose.prod.yml exec -T backend php artisan migrate --force

# Очищаем и кэшируем
echo "⚡ Caching..."
docker compose -f docker-compose.prod.yml exec -T backend php artisan config:cache
docker compose -f docker-compose.prod.yml exec -T backend php artisan route:cache
docker compose -f docker-compose.prod.yml exec -T backend php artisan view:cache

# Очищаем неиспользуемые образы
echo "🧹 Cleaning up..."
docker image prune -f

echo "✅ Deployment completed!"
docker compose -f docker-compose.prod.yml ps
```

### scripts/backup.sh

```bash
#!/bin/bash
set -e

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/opt/backups"
PROJECT_DIR="/opt/app-docker"

mkdir -p $BACKUP_DIR

echo "📦 Starting backup..."

# Бэкап базы данных
echo "💾 Backing up database..."
docker compose -f $PROJECT_DIR/docker-compose.prod.yml exec -T mysql \
    mysqldump -u root -p${DB_ROOT_PASSWORD} ${DB_DATABASE} | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Бэкап файлов storage
echo "📁 Backing up storage..."
docker run --rm \
    -v app-docker_backend-storage:/data \
    -v $BACKUP_DIR:/backup \
    alpine tar czf /backup/storage_$DATE.tar.gz -C /data .

# Удаление старых бэкапов (старше 7 дней)
echo "🧹 Removing old backups..."
find $BACKUP_DIR -type f -mtime +7 -delete

echo "✅ Backup completed: $DATE"
ls -lh $BACKUP_DIR
```

### scripts/restore.sh

```bash
#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_date>"
    echo "Example: ./restore.sh 2024-01-15_03-00-00"
    exit 1
fi

BACKUP_DATE=$1
BACKUP_DIR="/opt/backups"
PROJECT_DIR="/opt/app-docker"

DB_BACKUP="$BACKUP_DIR/db_$BACKUP_DATE.sql.gz"
STORAGE_BACKUP="$BACKUP_DIR/storage_$BACKUP_DATE.tar.gz"

if [ ! -f "$DB_BACKUP" ]; then
    echo "❌ Database backup not found: $DB_BACKUP"
    exit 1
fi

echo "⚠️  This will restore backup from $BACKUP_DATE"
read -p "Are you sure? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo "🔄 Restoring database..."
gunzip < $DB_BACKUP | docker compose -f $PROJECT_DIR/docker-compose.prod.yml exec -T mysql \
    mysql -u root -p${DB_ROOT_PASSWORD} ${DB_DATABASE}

if [ -f "$STORAGE_BACKUP" ]; then
    echo "🔄 Restoring storage..."
    docker run --rm \
        -v app-docker_backend-storage:/data \
        -v $BACKUP_DIR:/backup \
        alpine sh -c "rm -rf /data/* && tar xzf /backup/storage_$BACKUP_DATE.tar.gz -C /data"
fi

echo "✅ Restore completed!"
```

---

## Команды Docker

### Основные команды

```bash
# Запуск development
docker compose up -d

# Запуск с dev-профилем (phpMyAdmin, Mailhog)
docker compose --profile dev up -d

# Запуск production
docker compose -f docker-compose.prod.yml up -d

# Остановка
docker compose down

# Пересборка
docker compose build --no-cache

# Логи
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# Статус
docker compose ps

# Выполнение команд в контейнере
docker compose exec backend php artisan migrate
docker compose exec backend php artisan tinker
docker compose exec mysql mysql -u root -p

# Перезапуск сервиса
docker compose restart backend
docker compose restart frontend
```

### Полезные алиасы (~/.bashrc)

```bash
# Docker Compose
alias dc='docker compose'
alias dcup='docker compose up -d'
alias dcdown='docker compose down'
alias dclogs='docker compose logs -f'
alias dcps='docker compose ps'
alias dcbuild='docker compose build --no-cache'

# Laravel в Docker
alias dartisan='docker compose exec backend php artisan'
alias dcomposer='docker compose exec backend composer'

# Nuxt в Docker
alias dnpm='docker compose exec frontend npm'
```

---

## SSL в Docker (Let's Encrypt)

### Первоначальная настройка

```bash
# 1. Создаём директории
mkdir -p certbot/www certbot/conf

# 2. Запускаем nginx без SSL
docker compose -f docker-compose.prod.yml up -d nginx

# 3. Получаем сертификат
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    -d example.com \
    -d www.example.com \
    -d api.example.com \
    --email your@email.com \
    --agree-tos \
    --no-eff-email

# 4. Обновляем nginx конфиг для HTTPS
# 5. Перезапускаем
docker compose -f docker-compose.prod.yml restart nginx
```

### nginx/conf.d/ssl.conf (после получения сертификата)

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name example.com www.example.com api.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# Frontend HTTPS
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend HTTPS
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    root /var/www/backend/public;
    index index.php;

    client_max_body_size 100M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass backend:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

---

## CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CI/CD ПРОЦЕСС                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│   │  PUSH   │───►│  TEST   │───►│  BUILD  │───►│ DEPLOY  │             │
│   │  CODE   │    │  CI     │    │  IMAGE  │    │  PROD   │             │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘             │
│        │              │              │              │                   │
│        ▼              ▼              ▼              ▼                   │
│   GitHub/GitLab  PHPUnit/Jest   Docker Hub    Production               │
│   Repository     Lint/Analyze   Registry      Server                   │
│                                                                         │
│   ТРИГГЕРЫ:                                                            │
│   ─────────                                                            │
│   • Push в main/master → автодеплой на production                      │
│   • Push в develop → автодеплой на staging                             │
│   • Pull Request → только тесты (без деплоя)                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### GitHub Actions

#### Структура директории

```
.github/
└── workflows/
    ├── ci.yml           # Тесты при каждом push/PR
    ├── deploy.yml       # Деплой на production
    └── staging.yml      # Деплой на staging
```

#### .github/workflows/ci.yml (Тесты)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # ===========================================
  # Backend Tests (Laravel)
  # ===========================================
  backend-tests:
    name: Backend Tests
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: myapp_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd="redis-cli ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.1'
          extensions: mbstring, pdo, pdo_mysql, gd, zip, bcmath, redis
          coverage: xdebug

      - name: Get Composer cache directory
        id: composer-cache
        run: echo "dir=$(composer config cache-files-dir)" >> $GITHUB_OUTPUT
        working-directory: backend

      - name: Cache Composer dependencies
        uses: actions/cache@v4
        with:
          path: ${{ steps.composer-cache.outputs.dir }}
          key: ${{ runner.os }}-composer-${{ hashFiles('backend/composer.lock') }}
          restore-keys: ${{ runner.os }}-composer-

      - name: Install dependencies
        run: composer install --no-progress --prefer-dist --optimize-autoloader
        working-directory: backend

      - name: Copy environment file
        run: cp .env.example .env
        working-directory: backend

      - name: Generate application key
        run: php artisan key:generate
        working-directory: backend

      - name: Run migrations
        run: php artisan migrate --force
        working-directory: backend
        env:
          DB_CONNECTION: mysql
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_DATABASE: myapp_test
          DB_USERNAME: root
          DB_PASSWORD: root

      - name: Run PHPUnit tests
        run: php artisan test --coverage --min=60
        working-directory: backend
        env:
          DB_CONNECTION: mysql
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_DATABASE: myapp_test
          DB_USERNAME: root
          DB_PASSWORD: root
          REDIS_HOST: 127.0.0.1

      - name: Run PHP Code Sniffer
        run: vendor/bin/phpcs --standard=PSR12 app/
        working-directory: backend
        continue-on-error: true

      - name: Run PHPStan
        run: vendor/bin/phpstan analyse --memory-limit=2G
        working-directory: backend
        continue-on-error: true

  # ===========================================
  # Frontend Tests (Nuxt)
  # ===========================================
  frontend-tests:
    name: Frontend Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: frontend

      - name: Run ESLint
        run: npm run lint
        working-directory: frontend
        continue-on-error: true

      - name: Run TypeScript check
        run: npm run typecheck
        working-directory: frontend
        continue-on-error: true

      - name: Run Vitest tests
        run: npm run test
        working-directory: frontend
        continue-on-error: true

      - name: Build application
        run: npm run build
        working-directory: frontend
        env:
          NUXT_PUBLIC_API_BASE: https://api.example.com/api

  # ===========================================
  # Docker Build Test
  # ===========================================
  docker-build:
    name: Docker Build Test
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile.prod
          push: false
          tags: app-backend:test
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build Frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile.prod
          push: false
          tags: app-frontend:test
          build-args: |
            NUXT_PUBLIC_API_BASE=https://api.example.com/api
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

#### .github/workflows/deploy.yml (Production Deployment)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:  # Ручной запуск

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ===========================================
  # Build and Push Docker Images
  # ===========================================
  build:
    name: Build and Push
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    outputs:
      backend-tag: ${{ steps.meta-backend.outputs.tags }}
      frontend-tag: ${{ steps.meta-frontend.outputs.tags }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # Backend Image
      - name: Extract metadata for Backend
        id: meta-backend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend
          tags: |
            type=sha,prefix=
            type=raw,value=latest

      - name: Build and push Backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile.prod
          push: true
          tags: ${{ steps.meta-backend.outputs.tags }}
          labels: ${{ steps.meta-backend.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      # Frontend Image
      - name: Extract metadata for Frontend
        id: meta-frontend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend
          tags: |
            type=sha,prefix=
            type=raw,value=latest

      - name: Build and push Frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile.prod
          push: true
          tags: ${{ steps.meta-frontend.outputs.tags }}
          labels: ${{ steps.meta-frontend.outputs.labels }}
          build-args: |
            NUXT_PUBLIC_API_BASE=https://api.example.com/api
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ===========================================
  # Deploy to Server
  # ===========================================
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    environment: production

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          port: ${{ secrets.PROD_PORT || 22 }}
          script: |
            cd /opt/app-docker

            # Pull latest changes
            git pull origin main

            # Login to registry
            echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin

            # Pull new images
            docker compose -f docker-compose.prod.yml pull

            # Deploy with zero-downtime
            docker compose -f docker-compose.prod.yml up -d --remove-orphans

            # Run migrations
            docker compose -f docker-compose.prod.yml exec -T backend php artisan migrate --force

            # Clear and cache
            docker compose -f docker-compose.prod.yml exec -T backend php artisan config:cache
            docker compose -f docker-compose.prod.yml exec -T backend php artisan route:cache
            docker compose -f docker-compose.prod.yml exec -T backend php artisan view:cache

            # Cleanup old images
            docker image prune -f

            # Health check
            sleep 10
            curl -f http://localhost/api/health || exit 1

            echo "✅ Deployment successful!"

      - name: Notify on success
        if: success()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.repos.createCommitStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              sha: context.sha,
              state: 'success',
              description: 'Deployed to production',
              context: 'deployment/production'
            })

      - name: Notify on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.repos.createCommitStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              sha: context.sha,
              state: 'failure',
              description: 'Deployment failed',
              context: 'deployment/production'
            })
```

#### .github/workflows/staging.yml (Staging Deployment)

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/app-docker-staging
            git pull origin develop
            docker compose -f docker-compose.staging.yml down
            docker compose -f docker-compose.staging.yml build --no-cache
            docker compose -f docker-compose.staging.yml up -d
            docker compose -f docker-compose.staging.yml exec -T backend php artisan migrate --force
            echo "✅ Staging deployment successful!"
```

---

### GitLab CI/CD

#### .gitlab-ci.yml

```yaml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

  # Registry
  REGISTRY: registry.gitlab.com
  BACKEND_IMAGE: $CI_REGISTRY_IMAGE/backend
  FRONTEND_IMAGE: $CI_REGISTRY_IMAGE/frontend

# ===========================================
# Templates
# ===========================================
.docker-template: &docker-template
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY

# ===========================================
# Test Stage
# ===========================================
backend-test:
  stage: test
  image: php:8.1
  services:
    - mysql:8.0
    - redis:7-alpine
  variables:
    MYSQL_ROOT_PASSWORD: root
    MYSQL_DATABASE: myapp_test
    DB_HOST: mysql
    REDIS_HOST: redis
  before_script:
    - apt-get update && apt-get install -y git unzip libpng-dev libzip-dev
    - docker-php-ext-install pdo_mysql gd zip
    - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
  script:
    - cd backend
    - composer install --no-progress
    - cp .env.example .env
    - php artisan key:generate
    - php artisan migrate --force
    - php artisan test
  cache:
    key: ${CI_COMMIT_REF_SLUG}-backend
    paths:
      - backend/vendor/
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_BRANCH == "develop"

frontend-test:
  stage: test
  image: node:18-alpine
  script:
    - cd frontend
    - npm ci
    - npm run lint
    - npm run build
  cache:
    key: ${CI_COMMIT_REF_SLUG}-frontend
    paths:
      - frontend/node_modules/
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_BRANCH == "develop"

# ===========================================
# Build Stage
# ===========================================
build-backend:
  stage: build
  <<: *docker-template
  script:
    - docker build -f backend/Dockerfile.prod -t $BACKEND_IMAGE:$CI_COMMIT_SHA -t $BACKEND_IMAGE:latest backend/
    - docker push $BACKEND_IMAGE:$CI_COMMIT_SHA
    - docker push $BACKEND_IMAGE:latest
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

build-frontend:
  stage: build
  <<: *docker-template
  script:
    - docker build
        --build-arg NUXT_PUBLIC_API_BASE=https://api.example.com/api
        -f frontend/Dockerfile.prod
        -t $FRONTEND_IMAGE:$CI_COMMIT_SHA
        -t $FRONTEND_IMAGE:latest
        frontend/
    - docker push $FRONTEND_IMAGE:$CI_COMMIT_SHA
    - docker push $FRONTEND_IMAGE:latest
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

# ===========================================
# Deploy Stage
# ===========================================
deploy-production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - echo "$SSH_KNOWN_HOSTS" >> ~/.ssh/known_hosts
  script:
    - |
      ssh $PROD_USER@$PROD_HOST << 'ENDSSH'
        cd /opt/app-docker
        git pull origin main
        docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
        docker compose -f docker-compose.prod.yml pull
        docker compose -f docker-compose.prod.yml up -d --remove-orphans
        docker compose -f docker-compose.prod.yml exec -T backend php artisan migrate --force
        docker compose -f docker-compose.prod.yml exec -T backend php artisan config:cache
        docker compose -f docker-compose.prod.yml exec -T backend php artisan route:cache
        docker image prune -f
        echo "✅ Deployment successful!"
      ENDSSH
  environment:
    name: production
    url: https://example.com
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
  needs:
    - build-backend
    - build-frontend

deploy-staging:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - echo "$SSH_KNOWN_HOSTS" >> ~/.ssh/known_hosts
  script:
    - |
      ssh $STAGING_USER@$STAGING_HOST << 'ENDSSH'
        cd /opt/app-docker-staging
        git pull origin develop
        docker compose -f docker-compose.staging.yml down
        docker compose -f docker-compose.staging.yml build --no-cache
        docker compose -f docker-compose.staging.yml up -d
        docker compose -f docker-compose.staging.yml exec -T backend php artisan migrate --force
        echo "✅ Staging deployment successful!"
      ENDSSH
  environment:
    name: staging
    url: https://staging.example.com
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
```

---

### Настройка Secrets

#### GitHub Secrets

```
# Repository Settings → Secrets and variables → Actions

# Production Server
PROD_HOST=123.456.789.0
PROD_USER=deploy
PROD_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
PROD_PORT=22

# Staging Server
STAGING_HOST=staging.example.com
STAGING_USER=deploy
STAGING_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...

# Docker Registry (если используете DockerHub)
DOCKERHUB_USERNAME=your-username
DOCKERHUB_TOKEN=your-token
```

#### GitLab CI/CD Variables

```
# Settings → CI/CD → Variables

# SSH
SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
SSH_KNOWN_HOSTS=example.com ssh-rsa AAAA...

# Production
PROD_HOST=123.456.789.0
PROD_USER=deploy

# Staging
STAGING_HOST=staging.example.com
STAGING_USER=deploy
```

---

### Health Check Endpoint

#### backend/routes/api.php

```php
<?php

// Health check для CI/CD
Route::get('/health', function () {
    try {
        // Проверка базы данных
        DB::connection()->getPdo();

        // Проверка Redis
        Cache::store('redis')->put('health_check', true, 10);

        return response()->json([
            'status' => 'healthy',
            'timestamp' => now()->toISOString(),
            'services' => [
                'database' => 'ok',
                'cache' => 'ok',
            ]
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'unhealthy',
            'error' => $e->getMessage(),
        ], 500);
    }
});
```

---

### docker-compose.prod.yml с Registry

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/your-org/app-backend:latest
    # или для GitLab:
    # image: registry.gitlab.com/your-group/myapp/backend:latest
    container_name: app-backend
    restart: always
    environment:
      APP_ENV: production
      # ...остальные переменные
    volumes:
      - backend-storage:/var/www/backend/storage
    networks:
      - app-network

  frontend:
    image: ghcr.io/your-org/app-frontend:latest
    # или для GitLab:
    # image: registry.gitlab.com/your-group/myapp/frontend:latest
    container_name: app-frontend
    restart: always
    environment:
      NODE_ENV: production
    networks:
      - app-network

  # nginx, mysql, redis - как и раньше
  # ...
```

---

### Rollback Script

#### scripts/rollback.sh

```bash
#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Usage: ./rollback.sh <commit_sha>"
    echo "Example: ./rollback.sh abc1234"
    echo ""
    echo "Recent deployments:"
    docker images --format "{{.Repository}}:{{.Tag}}" | grep myapp | head -10
    exit 1
fi

COMMIT_SHA=$1
REGISTRY="ghcr.io/your-org"

echo "⚠️  Rolling back to commit: $COMMIT_SHA"
read -p "Are you sure? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

cd /opt/app-docker

# Pull specific version
docker pull $REGISTRY/app-backend:$COMMIT_SHA
docker pull $REGISTRY/app-frontend:$COMMIT_SHA

# Update docker-compose to use specific tags
sed -i "s|app-backend:.*|app-backend:$COMMIT_SHA|g" docker-compose.prod.yml
sed -i "s|app-frontend:.*|app-frontend:$COMMIT_SHA|g" docker-compose.prod.yml

# Restart services
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "✅ Rollback to $COMMIT_SHA completed!"
docker compose -f docker-compose.prod.yml ps
```

---

### Cron для автоматического бэкапа

```bash
# Добавить в crontab: crontab -e

# Ежедневный бэкап в 3:00
0 3 * * * /opt/app-docker/scripts/backup.sh >> /var/log/app-backup.log 2>&1

# Проверка здоровья каждые 5 минут
*/5 * * * * curl -sf http://localhost/api/health || docker compose -f /opt/app-docker/docker-compose.prod.yml restart backend frontend
```

---

### Notification (Telegram/Slack)

#### scripts/notify.sh

```bash
#!/bin/bash

# Telegram notification
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
MESSAGE="$1"

curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d chat_id="${TELEGRAM_CHAT_ID}" \
    -d text="${MESSAGE}" \
    -d parse_mode="Markdown"
```

#### Использование в CI/CD

```yaml
# В GitHub Actions
- name: Notify Telegram
  if: always()
  run: |
    if [ "${{ job.status }}" == "success" ]; then
      MESSAGE="✅ *MyApp Deploy*: успешно развёрнуто на production"
    else
      MESSAGE="❌ *MyApp Deploy*: ошибка деплоя!"
    fi
    curl -s -X POST "https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage" \
      -d chat_id="${{ secrets.TELEGRAM_CHAT_ID }}" \
      -d text="$MESSAGE" \
      -d parse_mode="Markdown"
```

---

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CI/CD PIPELINE СХЕМА                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Developer                                                             │
│      │                                                                  │
│      ▼                                                                  │
│   ┌──────────┐                                                         │
│   │  git     │                                                         │
│   │  push    │                                                         │
│   └────┬─────┘                                                         │
│        │                                                                │
│        ▼                                                                │
│   ┌──────────────────────────────────────────────────────┐             │
│   │                 GitHub Actions / GitLab CI            │             │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │             │
│   │  │   TEST   │  │   BUILD  │  │  DEPLOY  │           │             │
│   │  │ Backend  │  │  Docker  │  │   SSH    │           │             │
│   │  │ Frontend │  │  Images  │  │  Script  │           │             │
│   │  └────┬─────┘  └────┬─────┘  └────┬─────┘           │             │
│   │       │             │             │                  │             │
│   │       │    ✓        │    ✓        │    ✓             │             │
│   │       └─────────────┴─────────────┘                  │             │
│   └──────────────────────────┬───────────────────────────┘             │
│                              │                                          │
│                              ▼                                          │
│   ┌──────────────────────────────────────────────────────┐             │
│   │                  Production Server                    │             │
│   │                                                       │             │
│   │   docker compose pull                                 │             │
│   │   docker compose up -d                                │             │
│   │   php artisan migrate --force                        │             │
│   │                                                       │             │
│   └───────────────────────────────────────────────────────┘             │
│                              │                                          │
│                              ▼                                          │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                            │
│   │ Telegram │  │  Slack   │  │  Email   │   ← Notifications           │
│   └──────────┘  └──────────┘  └──────────┘                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Безопасность Docker

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      УРОВНИ БЕЗОПАСНОСТИ                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  1. HOST          Firewall, SSH, Updates, User permissions      │   │
│   ├─────────────────────────────────────────────────────────────────┤   │
│   │  2. DOCKER        Daemon config, Image scanning, Secrets        │   │
│   ├─────────────────────────────────────────────────────────────────┤   │
│   │  3. CONTAINER     Non-root, Read-only, Resource limits          │   │
│   ├─────────────────────────────────────────────────────────────────┤   │
│   │  4. NETWORK       Isolated networks, TLS, Firewall rules        │   │
│   ├─────────────────────────────────────────────────────────────────┤   │
│   │  5. APPLICATION   Headers, CORS, Input validation, Auth         │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Безопасность контейнеров

#### Запуск от непривилегированного пользователя

```dockerfile
# backend/Dockerfile.prod

FROM php:8.1-fpm-alpine

# Создаём пользователя с конкретным UID/GID
RUN addgroup -g 1000 -S www && \
    adduser -u 1000 -S www -G www

# ... установка зависимостей ...

# Устанавливаем владельца файлов
COPY --chown=www:www . /var/www/backend

# Переключаемся на непривилегированного пользователя
USER www

EXPOSE 9000
CMD ["php-fpm"]
```

```dockerfile
# frontend/Dockerfile.prod

FROM node:18-alpine AS runner

# Создаём пользователя
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxtjs

# Копируем с правильным владельцем
COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output

# Запуск от непривилегированного пользователя
USER nuxtjs

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

#### Read-only файловая система

```yaml
# docker-compose.prod.yml

services:
  backend:
    image: app-backend:latest
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
    volumes:
      # Только необходимые директории для записи
      - backend-storage:/var/www/backend/storage
      - backend-cache:/var/www/backend/bootstrap/cache

  frontend:
    image: app-frontend:latest
    read_only: true
    tmpfs:
      - /tmp
```

#### Ограничение ресурсов

```yaml
# docker-compose.prod.yml

services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    # Для docker-compose без swarm:
    mem_limit: 512m
    memswap_limit: 512m
    cpus: 2

  frontend:
    mem_limit: 256m
    cpus: 1

  mysql:
    mem_limit: 1g
    cpus: 2

  redis:
    mem_limit: 128m
    cpus: 0.5
```

#### Отключение привилегий

```yaml
# docker-compose.prod.yml

services:
  backend:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SMyAppID
      - SETGID

  nginx:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # Для портов < 1024
      - CHOWN
```

---

### Безопасность образов

#### Сканирование образов

```bash
# Использование Docker Scout (встроенный)
docker scout cves app-backend:latest
docker scout recommendations app-backend:latest

# Использование Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy image app-backend:latest

# Сканирование с отчётом
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    -v $(pwd)/reports:/reports \
    aquasec/trivy image \
    --format json \
    --output /reports/scan-report.json \
    app-backend:latest
```

#### CI/CD интеграция сканирования

```yaml
# .github/workflows/security.yml

name: Security Scan

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * *'  # Ежедневно

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build image
        run: docker build -t app-backend:scan ./backend

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'app-backend:scan'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Fail on critical vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'app-backend:scan'
          exit-code: '1'
          severity: 'CRITICAL'
```

#### Доверенные базовые образы

```dockerfile
# Используйте официальные образы
FROM php:8.1-fpm-alpine      # ✓ Официальный
FROM node:18-alpine          # ✓ Официальный
FROM nginx:alpine            # ✓ Официальный

# НЕ используйте непроверенные образы
# FROM random-user/php:latest  # ✗ Небезопасно

# Фиксируйте версии
FROM php:8.1.27-fpm-alpine3.19  # ✓ Конкретная версия
FROM node:18.19.0-alpine3.19     # ✓ Конкретная версия

# Используйте digest для максимальной безопасности
FROM php@sha256:abc123...  # ✓ Неизменяемый образ
```

#### .dockerignore для безопасности

```dockerignore
# .dockerignore

# Git
.git
.gitignore

# Секреты и конфигурация
.env
.env.*
*.pem
*.key
credentials.json
secrets/

# IDE
.idea
.vscode
*.swp

# Тесты и документация
tests/
docs/
*.md
README*

# Зависимости (устанавливаются при сборке)
vendor/
node_modules/

# Логи и кэш
*.log
storage/logs/*
storage/framework/cache/*
.nuxt/
.output/

# Docker файлы
Dockerfile*
docker-compose*.yml
```

---

### Управление секретами

#### Docker Secrets (Swarm mode)

```yaml
# docker-compose.prod.yml (Swarm)

version: '3.8'

services:
  backend:
    image: app-backend:latest
    secrets:
      - db_password
      - app_key
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password
      APP_KEY_FILE: /run/secrets/app_key

secrets:
  db_password:
    external: true
  app_key:
    external: true
```

```bash
# Создание секретов
echo "super_secret_password" | docker secret create db_password -
echo "base64:your_app_key" | docker secret create app_key -

# Список секретов
docker secret ls
```

#### Использование секретов в Laravel

```php
<?php
// config/database.php

'mysql' => [
    'password' => file_exists('/run/secrets/db_password')
        ? trim(file_get_contents('/run/secrets/db_password'))
        : env('DB_PASSWORD'),
],
```

#### Секреты через .env файлы (без Swarm)

```yaml
# docker-compose.prod.yml

services:
  backend:
    env_file:
      - .env.prod.secrets  # Файл НЕ в git!
    environment:
      # Переопределение несекретных переменных
      APP_ENV: production
      APP_DEBUG: "false"
```

```bash
# .env.prod.secrets (НЕ коммитить!)
DB_PASSWORD=super_secret_password
APP_KEY=base64:your_app_key
REDIS_PASSWORD=redis_secret
```

```gitignore
# .gitignore
.env.prod.secrets
*.secrets
```

#### HashiCorp Vault интеграция

```yaml
# docker-compose.yml

services:
  vault:
    image: hashicorp/vault:latest
    container_name: app-vault
    cap_add:
      - IPC_LOCK
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: myroot
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
    ports:
      - "8200:8200"
    volumes:
      - vault-data:/vault/data
    networks:
      - app-network

volumes:
  vault-data:
```

```php
<?php
// Получение секретов из Vault (Laravel)

use GuzzleHttp\Client;

class VaultSecrets
{
    public static function get(string $path): ?string
    {
        $client = new Client([
            'base_uri' => env('VAULT_ADDR', 'http://vault:8200'),
            'headers' => [
                'X-Vault-Token' => env('VAULT_TOKEN'),
            ],
        ]);

        try {
            $response = $client->get("/v1/secret/data/{$path}");
            $data = json_decode($response->getBody(), true);
            return $data['data']['data']['value'] ?? null;
        } catch (\Exception $e) {
            return null;
        }
    }
}
```

---

### Сетевая безопасность

#### Изолированные сети

```yaml
# docker-compose.prod.yml

services:
  nginx:
    networks:
      - frontend-net
      - backend-net

  frontend:
    networks:
      - frontend-net  # Только frontend сеть

  backend:
    networks:
      - backend-net   # Только backend сеть
      - db-net        # Доступ к БД

  mysql:
    networks:
      - db-net        # Изолированная сеть для БД

  redis:
    networks:
      - backend-net

networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge
    internal: true   # Нет доступа в интернет
  db-net:
    driver: bridge
    internal: true   # Полностью изолированная
```

#### Ограничение портов

```yaml
# docker-compose.prod.yml

services:
  nginx:
    ports:
      - "80:80"
      - "443:443"
    # Только nginx доступен извне

  backend:
    # НЕТ ports - доступ только через nginx
    expose:
      - "9000"

  mysql:
    # НЕТ ports - только внутренний доступ
    expose:
      - "3306"

  redis:
    # НЕТ ports
    expose:
      - "6379"
```

#### UFW Firewall на хосте

```bash
# Базовые правила
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH (измените порт если нужно)
sudo ufw allow 22/tcp

# HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Запретить доступ к Docker портам напрямую
# Docker по умолчанию обходит UFW!

# Включить
sudo ufw enable
sudo ufw status verbose
```

#### Исправление Docker + UFW

```bash
# /etc/docker/daemon.json

{
  "iptables": false
}

# Перезапустить Docker
sudo systemctl restart docker

# Или использовать DOCKER-USER chain
sudo iptables -I DOCKER-USER -i eth0 -j DROP
sudo iptables -I DOCKER-USER -i eth0 -p tcp --dport 80 -j ACCEPT
sudo iptables -I DOCKER-USER -i eth0 -p tcp --dport 443 -j ACCEPT
```

---

### SSL/TLS безопасность

#### Nginx SSL конфигурация

```nginx
# nginx/conf.d/ssl.conf

# Современные SSL настройки
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

# Рекомендуемые шифры
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

# DH параметры
ssl_dhparam /etc/nginx/ssl/dhparam.pem;

# SSL сессии
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

```bash
# Генерация DH параметров
openssl dhparam -out /etc/nginx/ssl/dhparam.pem 4096
```

#### Security Headers

```nginx
# nginx/conf.d/security-headers.conf

# Защита от clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Защита от MIME sniffing
add_header X-Content-Type-Options "nosniff" always;

# XSS защита
add_header X-XSS-Protection "1; mode=block" always;

# Referrer Policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.example.com;" always;

# HSTS (только для production с валидным SSL)
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# Permissions Policy
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

#### Проверка SSL конфигурации

```bash
# Использование testssl.sh
docker run --rm -ti drwetter/testssl.sh https://example.com

# SSL Labs (онлайн)
# https://www.ssllabs.com/ssltest/

# Mozilla Observatory
# https://observatory.mozilla.org/
```

---

### Безопасность приложения

#### Laravel Security

```php
<?php
// config/app.php

return [
    // Отключить debug в production
    'debug' => env('APP_DEBUG', false),

    // Скрыть версию Laravel
    'version' => '',
];
```

```php
<?php
// app/Http/Middleware/SecurityHeaders.php

namespace App\Http\Middleware;

use Closure;

class SecurityHeaders
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }
}
```

```php
<?php
// config/cors.php (Production)

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE'],
    'allowed_origins' => [
        'https://example.com',
        'https://www.example.com',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => false,
];
```

#### Rate Limiting

```php
<?php
// app/Providers/RouteServiceProvider.php

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

public function boot()
{
    // API rate limiting
    RateLimiter::for('api', function ($request) {
        return Limit::perMinute(60)->by($request->ip());
    });

    // Строгий лимит для auth
    RateLimiter::for('auth', function ($request) {
        return Limit::perMinute(5)->by($request->ip());
    });

    // Лимит для загрузки файлов
    RateLimiter::for('uploads', function ($request) {
        return Limit::perMinute(10)->by($request->ip());
    });
}
```

```nginx
# nginx/conf.d/rate-limit.conf

# Зоны rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

# Применение к location
location /api {
    limit_req zone=api burst=20 nodelay;
    # ...
}

location /api/login {
    limit_req zone=auth burst=5 nodelay;
    # ...
}

location / {
    limit_req zone=general burst=50 nodelay;
    # ...
}
```

---

### Docker Daemon безопасность

#### /etc/docker/daemon.json

```json
{
  "icc": false,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "seccomp-profile": "/etc/docker/seccomp-profile.json",
  "storage-driver": "overlay2",
  "userns-remap": "default"
}
```

```bash
# Применить изменения
sudo systemctl restart docker

# Проверить конфигурацию
docker info
```

#### Аудит безопасности Docker

```bash
# Docker Bench Security
docker run --rm --net host --pid host --userns host --cap-add audit_control \
    -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
    -v /etc:/etc:ro \
    -v /lib/systemd/system:/lib/systemd/system:ro \
    -v /usr/bin/containerd:/usr/bin/containerd:ro \
    -v /usr/bin/runc:/usr/bin/runc:ro \
    -v /usr/lib/systemd:/usr/lib/systemd:ro \
    -v /var/lib:/var/lib:ro \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    --label docker_bench_security \
    docker/docker-bench-security
```

---

### Полный безопасный docker-compose.prod.yml

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:1.25-alpine
    container_name: app-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
      - backend-public:/var/www/backend/public:ro
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
      - CHOWN
      - SMyAppID
      - SETGID
    networks:
      - frontend-net
      - backend-net
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    image: app-backend:${VERSION:-latest}
    container_name: app-backend
    restart: always
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
    volumes:
      - backend-storage:/var/www/backend/storage
      - backend-cache:/var/www/backend/bootstrap/cache
    env_file:
      - .env.prod.secrets
    environment:
      APP_ENV: production
      APP_DEBUG: "false"
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SMyAppID
      - SETGID
    mem_limit: 512m
    cpus: 2
    networks:
      - backend-net
      - db-net
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "php", "-v"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: app-frontend:${VERSION:-latest}
    container_name: app-frontend
    restart: always
    read_only: true
    tmpfs:
      - /tmp
    environment:
      NODE_ENV: production
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    mem_limit: 256m
    cpus: 1
    networks:
      - frontend-net
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "node", "-e", "console.log('ok')"]
      interval: 30s
      timeout: 10s
      retries: 3

  mysql:
    image: mysql:8.0
    container_name: app-mysql
    restart: always
    env_file:
      - .env.prod.secrets
    volumes:
      - mysql-data:/var/lib/mysql
      - ./mysql/my.cnf:/etc/mysql/conf.d/my.cnf:ro
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SMyAppID
      - SETGID
      - DAC_OVERRIDE
    mem_limit: 1g
    cpus: 2
    networks:
      - db-net
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: app-redis
    restart: always
    command: redis-server --appendonly yes --maxmemory 128mb --maxmemory-policy allkeys-lru --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    mem_limit: 128m
    cpus: 0.5
    networks:
      - backend-net
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge
    internal: true
  db-net:
    driver: bridge
    internal: true

volumes:
  mysql-data:
  redis-data:
  backend-storage:
  backend-cache:
  backend-public:
```

---

### Чек-лист безопасности

#### Контейнеры
- [ ] Запуск от непривилегированного пользователя (USER)
- [ ] Отключены лишние capabilities (cap_drop: ALL)
- [ ] Включен no-new-privileges
- [ ] Read-only файловая система где возможно
- [ ] Установлены лимиты ресурсов (memory, cpu)

#### Образы
- [ ] Используются официальные базовые образы
- [ ] Версии образов зафиксированы
- [ ] Настроен .dockerignore
- [ ] Регулярное сканирование на уязвимости
- [ ] Multi-stage builds для минимизации размера

#### Сеть
- [ ] Изолированные сети для разных компонентов
- [ ] Только nginx доступен извне
- [ ] Настроен firewall на хосте
- [ ] Internal networks для БД

#### Секреты
- [ ] Секреты не в docker-compose.yml
- [ ] .env.secrets не в git
- [ ] Используются Docker secrets или Vault

#### SSL/TLS
- [ ] Только TLS 1.2/1.3
- [ ] Сильные шифры
- [ ] HSTS включен
- [ ] Регулярное обновление сертификатов

#### Приложение
- [ ] Security headers настроены
- [ ] CORS ограничен
- [ ] Rate limiting включен
- [ ] APP_DEBUG=false в production

---

## Мониторинг и Логирование

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      СТЕК МОНИТОРИНГА                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │
│   │   COLLECT   │  │   STORE     │  │  VISUALIZE  │                    │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                    │
│          │                │                │                            │
│          ▼                ▼                ▼                            │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │
│   │ Promtail    │  │ Loki        │  │ Grafana     │   ← Логи           │
│   │ Filebeat    │  │ Elastic     │  │ Kibana      │                    │
│   └─────────────┘  └─────────────┘  └─────────────┘                    │
│                                                                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │
│   │ Prometheus  │  │ Prometheus  │  │ Grafana     │   ← Метрики        │
│   │ Exporters   │  │ TSDB        │  │ Dashboards  │                    │
│   └─────────────┘  └─────────────┘  └─────────────┘                    │
│                                                                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │
│   │ Healthcheck │  │ Alertmanager│  │ Telegram    │   ← Алерты         │
│   │ Probes      │  │ Rules       │  │ Slack/Email │                    │
│   └─────────────┘  └─────────────┘  └─────────────┘                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Docker Logging

#### Настройка драйвера логов

```yaml
# docker-compose.yml

services:
  backend:
    # ... остальная конфигурация
    logging:
      driver: "json-file"
      options:
        max-size: "10m"      # Максимальный размер файла
        max-file: "5"        # Количество файлов ротации
        labels: "service"
        tag: "{{.Name}}/{{.ID}}"

  frontend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"
```

#### Просмотр логов

```bash
# Логи всех сервисов
docker compose logs

# Логи конкретного сервиса
docker compose logs backend

# Последние 100 строк
docker compose logs --tail=100 backend

# В реальном времени
docker compose logs -f backend

# С временными метками
docker compose logs -t backend

# Несколько сервисов
docker compose logs -f backend frontend nginx

# Фильтрация по времени
docker compose logs --since="2024-01-01T00:00:00" backend
docker compose logs --since="1h" backend  # За последний час
```

---

### Prometheus + Grafana (Метрики)

#### docker-compose.monitoring.yml

```yaml
version: '3.8'

services:
  # ===========================================
  # Prometheus - Сбор метрик
  # ===========================================
  prometheus:
    image: prom/prometheus:latest
    container_name: app-prometheus
    restart: unless-stopped
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./monitoring/prometheus/rules:/etc/prometheus/rules:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    networks:
      - app-network
      - monitoring

  # ===========================================
  # Grafana - Визуализация
  # ===========================================
  grafana:
    image: grafana/grafana:latest
    container_name: app-grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_USER:-admin}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
      GF_USERS_ALLOW_SIGN_UP: "false"
      GF_SERVER_ROOT_URL: https://monitoring.example.com
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards:ro
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
    networks:
      - app-network
      - monitoring

  # ===========================================
  # Node Exporter - Метрики хоста
  # ===========================================
  node-exporter:
    image: prom/node-exporter:latest
    container_name: app-node-exporter
    restart: unless-stopped
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    networks:
      - monitoring

  # ===========================================
  # cAdvisor - Метрики контейнеров
  # ===========================================
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: app-cadvisor
    restart: unless-stopped
    privileged: true
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    ports:
      - "8081:8080"
    networks:
      - monitoring

  # ===========================================
  # MySQL Exporter
  # ===========================================
  mysql-exporter:
    image: prom/mysqld-exporter:latest
    container_name: app-mysql-exporter
    restart: unless-stopped
    environment:
      DATA_SOURCE_NAME: "exporter:${MYSQL_EXPORTER_PASSWORD}@(mysql:3306)/"
    ports:
      - "9104:9104"
    depends_on:
      - mysql
    networks:
      - app-network
      - monitoring

  # ===========================================
  # Redis Exporter
  # ===========================================
  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: app-redis-exporter
    restart: unless-stopped
    environment:
      REDIS_ADDR: "redis:6379"
    ports:
      - "9121:9121"
    depends_on:
      - redis
    networks:
      - app-network
      - monitoring

  # ===========================================
  # Nginx Exporter
  # ===========================================
  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:latest
    container_name: app-nginx-exporter
    restart: unless-stopped
    command:
      - '-nginx.scrape-uri=http://nginx:80/nginx_status'
    ports:
      - "9113:9113"
    depends_on:
      - nginx
    networks:
      - app-network
      - monitoring

  # ===========================================
  # Alertmanager - Уведомления
  # ===========================================
  alertmanager:
    image: prom/alertmanager:latest
    container_name: app-alertmanager
    restart: unless-stopped
    volumes:
      - ./monitoring/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    ports:
      - "9093:9093"
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus-data:
  grafana-data:
  alertmanager-data:
```

#### monitoring/prometheus/prometheus.yml

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter (Host metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  # cAdvisor (Container metrics)
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  # MySQL
  - job_name: 'mysql'
    static_configs:
      - targets: ['mysql-exporter:9104']

  # Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Nginx
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  # Laravel application (custom metrics)
  - job_name: 'laravel'
    metrics_path: /api/metrics
    static_configs:
      - targets: ['nginx:80']
    scheme: http
```

#### monitoring/prometheus/rules/alerts.yml

```yaml
groups:
  - name: app-alerts
    rules:
      # ===========================================
      # Доступность сервисов
      # ===========================================
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Сервис {{ $labels.job }} недоступен"
          description: "Сервис {{ $labels.instance }} не отвечает более 1 минуты"

      # ===========================================
      # CPU
      # ===========================================
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Высокая загрузка CPU ({{ $value }}%)"
          description: "CPU загружен более 80% на протяжении 5 минут"

      - alert: CriticalCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 95
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Критическая загрузка CPU ({{ $value }}%)"

      # ===========================================
      # Memory
      # ===========================================
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Высокое использование памяти ({{ $value }}%)"

      - alert: CriticalMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 95
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Критическое использование памяти ({{ $value }}%)"

      # ===========================================
      # Disk
      # ===========================================
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes) * 100 < 20
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Мало места на диске ({{ $value }}% свободно)"
          description: "На диске {{ $labels.mountpoint }} осталось менее 20% места"

      - alert: DiskSpaceCritical
        expr: (node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes) * 100 < 10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Критически мало места на диске ({{ $value }}% свободно)"

      # ===========================================
      # Container
      # ===========================================
      - alert: ContainerHighCPU
        expr: (sum(rate(container_cpu_usage_seconds_total{name!=""}[3m])) BY (name) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Контейнер {{ $labels.name }} использует много CPU ({{ $value }}%)"

      - alert: ContainerHighMemory
        expr: (container_memory_usage_bytes{name!=""} / container_spec_memory_limit_bytes{name!=""}) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Контейнер {{ $labels.name }} использует много памяти ({{ $value }}%)"

      - alert: ContainerRestarting
        expr: increase(container_restart_count{name!=""}[1h]) > 3
        labels:
          severity: warning
        annotations:
          summary: "Контейнер {{ $labels.name }} перезапускается слишком часто"

      # ===========================================
      # MySQL
      # ===========================================
      - alert: MySQLDown
        expr: mysql_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "MySQL недоступен"

      - alert: MySQLTooManyConnections
        expr: mysql_global_status_threads_connected / mysql_global_variables_max_connections > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "MySQL: много подключений ({{ $value }}%)"

      - alert: MySQLSlowQueries
        expr: rate(mysql_global_status_slow_queries[5m]) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "MySQL: много медленных запросов"

      # ===========================================
      # Redis
      # ===========================================
      - alert: RedisDown
        expr: redis_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis недоступен"

      - alert: RedisHighMemory
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis использует много памяти ({{ $value }}%)"

      # ===========================================
      # HTTP / Application
      # ===========================================
      - alert: HighErrorRate
        expr: sum(rate(nginx_http_requests_total{status=~"5.."}[5m])) / sum(rate(nginx_http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Высокий процент ошибок ({{ $value }}%)"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, sum(rate(nginx_http_request_duration_seconds_bucket[5m])) by (le)) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Высокое время ответа (p95 = {{ $value }}s)"
```

#### monitoring/alertmanager/alertmanager.yml

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'telegram'

  routes:
    - match:
        severity: critical
      receiver: 'telegram'
      repeat_interval: 15m

    - match:
        severity: warning
      receiver: 'telegram'
      repeat_interval: 1h

receivers:
  - name: 'telegram'
    telegram_configs:
      - bot_token: 'YOUR_BOT_TOKEN'
        chat_id: YOUR_CHAT_ID
        api_url: 'https://api.telegram.org'
        parse_mode: 'HTML'
        message: |
          {{ range .Alerts }}
          <b>{{ .Status | toUpper }}</b>: {{ .Labels.alertname }}
          <b>Severity:</b> {{ .Labels.severity }}
          <b>Summary:</b> {{ .Annotations.summary }}
          <b>Description:</b> {{ .Annotations.description }}
          {{ end }}

  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts'
        send_resolved: true
        title: '{{ .Status | toUpper }}: {{ .CommonLabels.alertname }}'
        text: '{{ .CommonAnnotations.summary }}'

  - name: 'email'
    email_configs:
      - to: 'admin@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'your@gmail.com'
        auth_password: 'your-app-password'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname']
```

---

### Loki + Promtail (Логи)

#### Добавить в docker-compose.monitoring.yml

```yaml
services:
  # ===========================================
  # Loki - Хранение логов
  # ===========================================
  loki:
    image: grafana/loki:latest
    container_name: app-loki
    restart: unless-stopped
    volumes:
      - ./monitoring/loki/loki-config.yml:/etc/loki/local-config.yaml:ro
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    ports:
      - "3100:3100"
    networks:
      - monitoring

  # ===========================================
  # Promtail - Сбор логов
  # ===========================================
  promtail:
    image: grafana/promtail:latest
    container_name: app-promtail
    restart: unless-stopped
    volumes:
      - ./monitoring/promtail/promtail-config.yml:/etc/promtail/config.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/log:/var/log:ro
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
    networks:
      - monitoring
      - app-network

volumes:
  loki-data:
```

#### monitoring/loki/loki-config.yml

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/index
    cache_location: /loki/cache
    shared_store: filesystem
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h  # 7 days

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: true
  retention_period: 720h  # 30 days
```

#### monitoring/promtail/promtail-config.yml

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # Docker container logs
  - job_name: docker
    static_configs:
      - targets:
          - localhost
        labels:
          job: docker
          __path__: /var/lib/docker/containers/*/*-json.log

    pipeline_stages:
      - json:
          expressions:
            stream: stream
            log: log
            time: time
            attrs: attrs
      - labels:
          stream:
      - timestamp:
          source: time
          format: RFC3339Nano
      - output:
          source: log

  # Laravel logs
  - job_name: laravel
    static_configs:
      - targets:
          - localhost
        labels:
          job: laravel
          __path__: /var/log/laravel/*.log

    pipeline_stages:
      - multiline:
          firstline: '^\[\d{4}-\d{2}-\d{2}'
          max_wait_time: 3s
      - regex:
          expression: '^\[(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (?P<env>\w+)\.(?P<level>\w+): (?P<message>.*)'
      - labels:
          level:
          env:
      - timestamp:
          source: timestamp
          format: '2006-01-02 15:04:05'

  # Nginx access logs
  - job_name: nginx-access
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          type: access
          __path__: /var/log/nginx/access.log

    pipeline_stages:
      - regex:
          expression: '^(?P<remote_addr>[\d.]+) - (?P<remote_user>\S+) \[(?P<time_local>[^\]]+)\] "(?P<request>[^"]+)" (?P<status>\d+) (?P<body_bytes_sent>\d+) "(?P<http_referer>[^"]*)" "(?P<http_user_agent>[^"]*)"'
      - labels:
          status:
          remote_addr:

  # Nginx error logs
  - job_name: nginx-error
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx
          type: error
          __path__: /var/log/nginx/error.log
```

---

### Laravel Logging

#### config/logging.php

```php
<?php

return [
    'default' => env('LOG_CHANNEL', 'stack'),

    'channels' => [
        'stack' => [
            'driver' => 'stack',
            'channels' => ['daily', 'stderr'],
            'ignore_exceptions' => false,
        ],

        'daily' => [
            'driver' => 'daily',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 14,
        ],

        'stderr' => [
            'driver' => 'monolog',
            'level' => env('LOG_LEVEL', 'debug'),
            'handler' => StreamHandler::class,
            'formatter' => env('LOG_STDERR_FORMATTER'),
            'with' => [
                'stream' => 'php://stderr',
            ],
        ],

        // JSON формат для Loki/ELK
        'json' => [
            'driver' => 'daily',
            'path' => storage_path('logs/laravel-json.log'),
            'level' => 'debug',
            'days' => 7,
            'formatter' => \Monolog\Formatter\JsonFormatter::class,
        ],
    ],
];
```

#### app/Http/Middleware/LogRequests.php

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LogRequests
{
    public function handle(Request $request, Closure $next)
    {
        $startTime = microtime(true);

        $response = $next($request);

        $duration = round((microtime(true) - $startTime) * 1000, 2);

        Log::channel('json')->info('HTTP Request', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'status' => $response->getStatusCode(),
            'duration_ms' => $duration,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'user_id' => auth()->id(),
        ]);

        return $response;
    }
}
```

#### Prometheus Metrics Endpoint

```php
<?php
// routes/api.php

use Prometheus\CollectorRegistry;
use Prometheus\RenderTextFormat;
use Prometheus\Storage\Redis;

Route::get('/metrics', function () {
    $adapter = new Redis([
        'host' => env('REDIS_HOST', 'redis'),
        'port' => env('REDIS_PORT', 6379),
    ]);

    $registry = new CollectorRegistry($adapter);

    // Request counter
    $counter = $registry->getOrRegisterCounter(
        'myapp',
        'http_requests_total',
        'Total HTTP requests',
        ['method', 'endpoint', 'status']
    );

    // Response time histogram
    $histogram = $registry->getOrRegisterHistogram(
        'myapp',
        'http_request_duration_seconds',
        'HTTP request duration',
        ['method', 'endpoint'],
        [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
    );

    $renderer = new RenderTextFormat();
    $result = $renderer->render($registry->getMetricFamilySamples());

    return response($result, 200)
        ->header('Content-Type', RenderTextFormat::MIME_TYPE);
});
```

---

### Grafana Dashboards

#### monitoring/grafana/provisioning/datasources/datasources.yml

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
```

#### Полезные запросы для Grafana

```promql
# CPU Usage по контейнерам
sum(rate(container_cpu_usage_seconds_total{name!=""}[5m])) by (name) * 100

# Memory Usage по контейнерам
container_memory_usage_bytes{name!=""} / 1024 / 1024

# Запросы в секунду (Nginx)
sum(rate(nginx_http_requests_total[5m])) by (status)

# Ошибки 5xx
sum(rate(nginx_http_requests_total{status=~"5.."}[5m]))

# MySQL Queries per second
rate(mysql_global_status_queries[5m])

# Redis Memory
redis_memory_used_bytes / 1024 / 1024

# Disk Usage
100 - ((node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes) * 100)
```

#### LogQL запросы для Loki

```logql
# Все логи Laravel
{job="laravel"}

# Ошибки Laravel
{job="laravel"} |= "ERROR"

# Nginx 5xx ошибки
{job="nginx", type="access"} | json | status >= 500

# Поиск по тексту
{job="laravel"} |~ "(?i)exception"

# Медленные запросы (> 1s)
{job="laravel"} | json | duration_ms > 1000

# Запросы конкретного пользователя
{job="laravel"} | json | user_id = "123"

# Статистика по статус-кодам
sum by (status) (count_over_time({job="nginx"}[5m] | json))
```

---

### Health Check API

#### backend/routes/api.php

```php
<?php

Route::get('/health', function () {
    $checks = [];
    $healthy = true;

    // Database check
    try {
        DB::connection()->getPdo();
        $checks['database'] = [
            'status' => 'ok',
            'latency_ms' => round((microtime(true) - LARAVEL_START) * 1000, 2)
        ];
    } catch (\Exception $e) {
        $checks['database'] = ['status' => 'error', 'message' => $e->getMessage()];
        $healthy = false;
    }

    // Redis check
    try {
        $start = microtime(true);
        Cache::store('redis')->put('health_check', true, 10);
        Cache::store('redis')->get('health_check');
        $checks['redis'] = [
            'status' => 'ok',
            'latency_ms' => round((microtime(true) - $start) * 1000, 2)
        ];
    } catch (\Exception $e) {
        $checks['redis'] = ['status' => 'error', 'message' => $e->getMessage()];
        $healthy = false;
    }

    // Disk check
    $diskFree = disk_free_space('/');
    $diskTotal = disk_total_space('/');
    $diskUsedPercent = round((1 - $diskFree / $diskTotal) * 100, 2);
    $checks['disk'] = [
        'status' => $diskUsedPercent < 90 ? 'ok' : 'warning',
        'used_percent' => $diskUsedPercent,
        'free_gb' => round($diskFree / 1024 / 1024 / 1024, 2)
    ];

    // Memory check
    $memInfo = [];
    if (is_readable('/proc/meminfo')) {
        $data = file_get_contents('/proc/meminfo');
        preg_match_all('/^(\w+):\s+(\d+)/m', $data, $matches, PREG_SET_ORDER);
        foreach ($matches as $match) {
            $memInfo[$match[1]] = (int)$match[2];
        }
        $memUsedPercent = round((1 - $memInfo['MemAvailable'] / $memInfo['MemTotal']) * 100, 2);
        $checks['memory'] = [
            'status' => $memUsedPercent < 90 ? 'ok' : 'warning',
            'used_percent' => $memUsedPercent
        ];
    }

    return response()->json([
        'status' => $healthy ? 'healthy' : 'unhealthy',
        'timestamp' => now()->toISOString(),
        'version' => config('app.version', '1.0.0'),
        'checks' => $checks
    ], $healthy ? 200 : 503);
});

Route::get('/health/live', fn() => response('OK', 200));
Route::get('/health/ready', function () {
    try {
        DB::connection()->getPdo();
        return response('OK', 200);
    } catch (\Exception $e) {
        return response('NOT READY', 503);
    }
});
```

---

### Запуск мониторинга

```bash
# Запуск всего стека мониторинга
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Проверка статуса
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml ps

# Доступ к сервисам:
# - Grafana:      http://localhost:3001 (admin/admin)
# - Prometheus:   http://localhost:9090
# - Alertmanager: http://localhost:9093
# - Loki:         http://localhost:3100

# Проверить targets в Prometheus
curl http://localhost:9090/api/v1/targets

# Проверить алерты
curl http://localhost:9090/api/v1/alerts
```

---

### Чек-лист мониторинга

- [ ] Настроен сбор логов (json-file driver)
- [ ] Развёрнут Prometheus
- [ ] Настроены exporters (node, cadvisor, mysql, redis, nginx)
- [ ] Развёрнут Grafana с дашбордами
- [ ] Настроен Alertmanager с уведомлениями
- [ ] Развёрнут Loki + Promtail для логов
- [ ] Настроен health check endpoint
- [ ] Созданы правила алертов
- [ ] Настроена ротация логов

---

## Troubleshooting (Частые ошибки)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ДИАГНОСТИКА ПРОБЛЕМ                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   1. Проверить логи:     docker compose logs -f [service]              │
│   2. Проверить статус:   docker compose ps                             │
│   3. Войти в контейнер:  docker compose exec [service] sh              │
│   4. Перезапустить:      docker compose restart [service]              │
│   5. Пересобрать:        docker compose build --no-cache [service]     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Docker & Docker Compose

#### Ошибка: "Cannot connect to the Docker daemon"

```bash
# Причина: Docker daemon не запущен

# Решение (Linux):
sudo systemctl start docker
sudo systemctl enable docker

# Проверка:
docker info
```

#### Ошибка: "Permission denied while trying to connect to Docker"

```bash
# Причина: пользователь не в группе docker

# Решение:
sudo usermod -aG docker $USER
newgrp docker

# Или перелогиниться
```

#### Ошибка: "port is already allocated"

```bash
# Причина: порт уже занят другим процессом

# Найти процесс:
sudo lsof -i :80
sudo lsof -i :3306

# Остановить процесс:
sudo kill -9 <PID>

# Или изменить порт в docker-compose.yml:
ports:
  - "8080:80"  # вместо 80:80
```

#### Ошибка: "no space left on device"

```bash
# Причина: закончилось место на диске

# Очистка Docker:
docker system prune -a --volumes

# Удалить неиспользуемые образы:
docker image prune -a

# Удалить остановленные контейнеры:
docker container prune

# Удалить неиспользуемые volumes:
docker volume prune

# Проверить использование:
docker system df
```

#### Ошибка: "network not found"

```bash
# Причина: сеть была удалена или не создана

# Решение:
docker compose down
docker compose up -d

# Или создать сеть вручную:
docker network create app-network
```

---

### Laravel (Backend)

#### Ошибка: "SQLSTATE[HY000] [2002] Connection refused"

```bash
# Причина: Laravel не может подключиться к MySQL

# Проверить что MySQL запущен:
docker compose ps mysql

# Проверить переменные в .env:
DB_HOST=mysql          # НЕ localhost, а имя сервиса!
DB_PORT=3306
DB_DATABASE=myapp
DB_USERNAME=app_user
DB_PASSWORD=secret_password

# Проверить healthcheck MySQL:
docker compose logs mysql

# Подождать пока MySQL полностью запустится:
docker compose exec mysql mysqladmin ping -h localhost -u root -p
```

#### Ошибка: "The stream or file could not be opened: Permission denied"

```bash
# Причина: неправильные права на storage/logs

# Решение внутри контейнера:
docker compose exec backend chmod -R 775 storage bootstrap/cache
docker compose exec backend chown -R www-data:www-data storage bootstrap/cache

# Или в Dockerfile добавить:
RUN chown -R www-data:www-data /var/www/backend/storage
```

#### Ошибка: "Class not found" после деплоя

```bash
# Причина: autoload не обновлён

# Решение:
docker compose exec backend composer dump-autoload
docker compose exec backend php artisan clear-compiled
docker compose exec backend php artisan optimize:clear
```

#### Ошибка: "419 Page Expired" (CSRF)

```bash
# Причина: проблема с сессиями или CSRF токеном

# Для API - отключить CSRF для api routes (уже сделано по умолчанию)
# Проверить app/Http/Middleware/VerifyCsrfToken.php:

protected $except = [
    'api/*',
];

# Очистить кэш:
docker compose exec backend php artisan cache:clear
docker compose exec backend php artisan config:clear
```

#### Ошибка: "Maximum execution time exceeded"

```bash
# Причина: долгий запрос превышает лимит

# Решение в php.ini:
max_execution_time = 300

# Или в docker/php.ini:
[PHP]
max_execution_time = 300

# Перезапустить:
docker compose restart backend
```

---

### Nuxt (Frontend)

#### Ошибка: "ECONNREFUSED" при запросах к API

```bash
# Причина: неправильный API URL или backend недоступен

# Проверить переменную окружения:
NUXT_PUBLIC_API_BASE=http://backend:9000/api  # Для SSR внутри Docker
# или
NUXT_PUBLIC_API_BASE=http://api.app.local/api  # Через Nginx

# Проверить что backend работает:
docker compose exec frontend curl http://backend:9000/api/health

# В nuxt.config.ts для SSR:
runtimeConfig: {
  public: {
    apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://nginx/api'
  }
}
```

#### Ошибка: "FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed"

```bash
# Причина: недостаточно памяти для Node.js

# Решение - увеличить лимит памяти:
# В Dockerfile или docker-compose.yml:
environment:
  NODE_OPTIONS: "--max-old-space-size=4096"

# Или в package.json:
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' nuxt build"
}
```

#### Ошибка: HMR (Hot Module Replacement) не работает

```bash
# Причина: WebSocket соединение блокируется

# 1. Проверить что порт 24678 проброшен:
ports:
  - "24678:24678"

# 2. В nuxt.config.ts:
vite: {
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 24678
    }
  }
}

# 3. В nginx добавить поддержку WebSocket:
location /_nuxt/ {
    proxy_pass http://frontend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

#### Ошибка: "Cannot find module" при билде

```bash
# Причина: node_modules не синхронизированы

# Решение:
docker compose exec frontend rm -rf node_modules .nuxt .output
docker compose exec frontend npm ci
docker compose exec frontend npm run build

# Или пересобрать контейнер:
docker compose build --no-cache frontend
```

---

### Nginx

#### Ошибка: "502 Bad Gateway"

```bash
# Причина: upstream сервис недоступен

# Проверить что backend/frontend работают:
docker compose ps

# Проверить логи nginx:
docker compose logs nginx

# Проверить что имена сервисов правильные в конфиге:
# nginx/conf.d/backend.conf
fastcgi_pass backend:9000;  # имя сервиса из docker-compose

# nginx/conf.d/frontend.conf
proxy_pass http://frontend:3000;  # имя сервиса из docker-compose

# Перезагрузить nginx:
docker compose exec nginx nginx -s reload
```

#### Ошибка: "413 Request Entity Too Large"

```bash
# Причина: файл превышает лимит загрузки

# В nginx.conf или server block:
client_max_body_size 100M;

# В php.ini:
upload_max_filesize = 100M
post_max_size = 100M

# Перезапустить:
docker compose restart nginx backend
```

#### Ошибка: "SSL: error:0A000086:SSL routines::certificate verify failed"

```bash
# Причина: проблема с SSL сертификатом

# Проверить сертификаты:
docker compose exec nginx ls -la /etc/letsencrypt/live/

# Проверить срок действия:
docker compose exec nginx openssl x509 -enddate -noout -in /etc/letsencrypt/live/example.com/fullchain.pem

# Обновить сертификат:
docker compose run --rm certbot renew

# Перезагрузить nginx:
docker compose exec nginx nginx -s reload
```

---

### MySQL

#### Ошибка: "Access denied for user"

```bash
# Причина: неправильные credentials

# Проверить переменные в .env:
DB_USERNAME=app_user
DB_PASSWORD=secret_password

# Войти как root и проверить пользователя:
docker compose exec mysql mysql -u root -p

# В MySQL:
SELECT user, host FROM mysql.user;
SHOW GRANTS FOR 'app_user'@'%';

# Пересоздать пользователя:
DROP USER IF EXISTS 'app_user'@'%';
CREATE USER 'app_user'@'%' IDENTIFIED BY 'secret_password';
GRANT ALL PRIVILEGES ON etu.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
```

#### Ошибка: "MySQL server has gone away"

```bash
# Причина: соединение разорвано из-за таймаута или большого пакета

# В mysql/my.cnf:
[mysqld]
wait_timeout = 600
interactive_timeout = 600
max_allowed_packet = 256M

# Перезапустить MySQL:
docker compose restart mysql
```

#### Ошибка: "Table doesn't exist" после миграций

```bash
# Причина: миграции не применились

# Проверить статус миграций:
docker compose exec backend php artisan migrate:status

# Запустить миграции:
docker compose exec backend php artisan migrate --force

# Если нужно откатить и заново:
docker compose exec backend php artisan migrate:fresh --seed
# ⚠️ ВНИМАНИЕ: удалит все данные!
```

---

### CI/CD

#### Ошибка: "Permission denied (publickey)" при SSH деплое

```bash
# Причина: SSH ключ не настроен или неправильный

# 1. Сгенерировать ключ (если нет):
ssh-keygen -t ed25519 -C "deploy@example.com"

# 2. Добавить публичный ключ на сервер:
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@your-server.com

# 3. Добавить приватный ключ в GitHub Secrets:
# Settings → Secrets → PROD_SSH_KEY
# Скопировать содержимое ~/.ssh/id_ed25519

# 4. Проверить подключение:
ssh -i ~/.ssh/id_ed25519 deploy@your-server.com
```

#### Ошибка: "docker: command not found" в CI/CD

```bash
# Причина: Docker не установлен в runner

# GitHub Actions - использовать правильный runner:
runs-on: ubuntu-latest

# Или установить Docker:
- name: Install Docker
  run: |
    curl -fsSL https://get.docker.com | sh
```

#### Ошибка: "Rate limit exceeded" при pull образов

```bash
# Причина: лимит Docker Hub

# Решение 1 - залогиниться:
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}

# Решение 2 - использовать GitHub Container Registry:
image: ghcr.io/your-org/your-image:latest
```

#### Ошибка: Health check failed после деплоя

```bash
# Причина: приложение не успело запуститься

# Увеличить таймаут в CI/CD:
sleep 30  # вместо 10

# Добавить retry логику:
for i in {1..5}; do
  curl -sf http://localhost/api/health && break
  echo "Attempt $i failed, retrying..."
  sleep 10
done

# Проверить логи:
docker compose -f docker-compose.prod.yml logs backend
```

---

### Полезные команды для диагностики

```bash
# Общая информация о Docker
docker info
docker system df

# Статус всех контейнеров
docker compose ps -a

# Логи конкретного сервиса (последние 100 строк)
docker compose logs --tail=100 backend

# Логи в реальном времени
docker compose logs -f

# Войти в контейнер
docker compose exec backend bash
docker compose exec frontend sh
docker compose exec mysql mysql -u root -p

# Проверить сеть
docker network ls
docker network inspect app-network

# Проверить volumes
docker volume ls
docker volume inspect app-docker_mysql-data

# Статистика ресурсов
docker stats

# Проверить конфигурацию nginx
docker compose exec nginx nginx -t

# Тест подключения между контейнерами
docker compose exec frontend ping backend
docker compose exec backend ping mysql

# Проверить открытые порты
docker compose exec nginx netstat -tlnp
```

---

### Быстрые решения (Quick Fixes)

```bash
# 🔄 Полный перезапуск (сброс всего):
docker compose down -v
docker compose build --no-cache
docker compose up -d

# 🧹 Очистка и перезапуск:
docker system prune -af
docker compose up -d --force-recreate

# 🔧 Пересоздать один сервис:
docker compose up -d --force-recreate --no-deps backend

# 📦 Обновить зависимости Laravel:
docker compose exec backend composer install
docker compose exec backend php artisan optimize:clear

# 📦 Обновить зависимости Nuxt:
docker compose exec frontend npm ci
docker compose exec frontend npm run build

# 🔑 Сбросить кэш Laravel:
docker compose exec backend php artisan cache:clear
docker compose exec backend php artisan config:clear
docker compose exec backend php artisan route:clear
docker compose exec backend php artisan view:clear

# 🗃️ Сбросить базу данных (ОСТОРОЖНО!):
docker compose exec backend php artisan migrate:fresh --seed
```

---

## Чек-лист Docker деплоя

### Базовая настройка
- [ ] Установлен Docker и Docker Compose
- [ ] Создана структура проекта
- [ ] Настроен .env файл
- [ ] Созданы Dockerfile для backend и frontend
- [ ] Настроен Nginx
- [ ] Настроен MySQL
- [ ] Проверена работа в development
- [ ] Созданы production конфигурации
- [ ] Получены SSL сертификаты
- [ ] Настроены скрипты деплоя и бэкапа
- [ ] Настроен автоматический бэкап (cron)

### CI/CD Pipeline
- [ ] Выбрана платформа (GitHub Actions / GitLab CI)
- [ ] Созданы workflow/pipeline файлы
- [ ] Настроены secrets (SSH ключи, токены)
- [ ] Настроен health check endpoint
- [ ] Тесты запускаются при каждом push/PR
- [ ] Docker образы собираются автоматически
- [ ] Автодеплой на staging (develop branch)
- [ ] Деплой на production (main branch)
- [ ] Настроен rollback скрипт
- [ ] Настроены уведомления (Telegram/Slack)

---

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      DOCKER АРХИТЕКТУРА MyApp                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                         NGINX :80/:443                          │   │
│   │                    (Reverse Proxy + SSL)                        │   │
│   └────────────────────────┬──────────────────┬─────────────────────┘   │
│                            │                  │                         │
│              example.com    │                  │   api.example.com      │
│                            ▼                  ▼                         │
│   ┌─────────────────────────────┐  ┌─────────────────────────────┐      │
│   │     FRONTEND (Nuxt)         │  │     BACKEND (Laravel)       │      │
│   │     Container :3000         │  │     Container :9000         │      │
│   │     Node.js 18              │  │     PHP-FPM 8.1             │      │
│   └─────────────────────────────┘  └──────────────┬──────────────┘      │
│                                                   │                     │
│                            ┌──────────────────────┼──────────────┐      │
│                            │                      │              │      │
│                            ▼                      ▼              ▼      │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│   │     MYSQL       │  │     REDIS       │  │    CERTBOT      │        │
│   │   Container     │  │   Container     │  │   Container     │        │
│   │   :3306         │  │   :6379         │  │   (SSL renew)   │        │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│                                                                         │
│                         Docker Network: app-network                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```
