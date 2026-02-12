#!/bin/bash
# ============================================
# EuroBot — Первоначальная настройка SSL
# ============================================
# Запускать ОДИН раз после первого деплоя.
# Получает SSL-сертификаты Let's Encrypt для обоих доменов.
#
# Использование:
#   chmod +x init-ssl.sh
#   ./init-ssl.sh
# ============================================

set -e

# Домены
DOMAINS="-d eurobot-noc.ru -d www.eurobot-noc.ru -d xn--90abi1bbjr.xn--p1ai -d www.xn--90abi1bbjr.xn--p1ai"
EMAIL="eurobotrussia@yandex.ru"
COMPOSE_FILE="docker-compose.prod.yml"

echo "============================================"
echo "  EuroBot SSL Setup"
echo "============================================"

# Шаг 1: Создаём временный nginx конфиг (только HTTP, без SSL)
echo "[1/5] Создаю временный nginx конфиг (HTTP only)..."

cat > frontend/nginx.init.conf << 'NGINX_CONF'
server {
    listen 80;
    server_name eurobot-noc.ru www.eurobot-noc.ru xn--90abi1bbjr.xn--p1ai www.xn--90abi1bbjr.xn--p1ai;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'EuroBot SSL setup in progress...';
        add_header Content-Type text/plain;
    }
}
NGINX_CONF

# Шаг 2: Создаём временный Dockerfile для init
cat > frontend/Dockerfile.init << 'DOCKERFILE'
FROM nginx:alpine
COPY nginx.init.conf /etc/nginx/conf.d/default.conf
RUN mkdir -p /var/www/certbot
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
DOCKERFILE

# Шаг 3: Запускаем nginx с HTTP-only конфигом
echo "[2/5] Запускаю nginx (HTTP only) для ACME challenge..."

# Останавливаем всё если запущено
docker-compose -f $COMPOSE_FILE down 2>/dev/null || true

# Запускаем временный nginx
docker run -d --name eurobot-nginx-init \
    -p 80:80 \
    -v eurobot-network_certbot_www:/var/www/certbot \
    -v "$(pwd)/frontend/nginx.init.conf:/etc/nginx/conf.d/default.conf:ro" \
    nginx:alpine

echo "[3/5] Ожидаю запуска nginx..."
sleep 3

# Шаг 4: Получаем сертификаты
echo "[4/5] Получаю SSL-сертификаты от Let's Encrypt..."

docker run --rm \
    -v eurobot-network_certbot_conf:/etc/letsencrypt \
    -v eurobot-network_certbot_www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    -w /var/www/certbot \
    $DOMAINS \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal

# Шаг 5: Останавливаем временный nginx
echo "[5/5] Убираю временные файлы..."
docker stop eurobot-nginx-init && docker rm eurobot-nginx-init

# Удаляем временные файлы
rm -f frontend/nginx.init.conf frontend/Dockerfile.init

echo ""
echo "============================================"
echo "  SSL сертификаты получены!"
echo "============================================"
echo ""
echo "Теперь запусти полный стек:"
echo "  docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "Сайт будет доступен по:"
echo "  https://eurobot-noc.ru"
echo "  https://евробот.рф"
echo "============================================"
