FROM node:14-alpine

# Instalar git y cron
RUN apk update && apk add --no-cache git cron

# Instalar PM2 para la gestión del proceso
RUN npm install -g pm2

WORKDIR /app

# Clonar el repositorio de GitHub; si ya existe, continúa
RUN git clone https://github.com/MiguelRodriguezR/masseru_pos_api.git . || true

# Instalar las dependencias iniciales
RUN npm install

# Copiar el script de actualización forzada
COPY update.sh /app/update.sh
RUN chmod +x /app/update.sh

# Copiar el archivo cron (se ejecutará cada minuto)
COPY cronjob /etc/cron.d/update-cron
RUN chmod 0644 /etc/cron.d/update-cron && crontab /etc/cron.d/update-cron

# Copiar el script entrypoint (que lanza cron y la app)
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Exponer el puerto que usará la app (3002)
EXPOSE 3002

CMD ["/entrypoint.sh"]
