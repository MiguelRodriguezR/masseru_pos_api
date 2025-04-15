#!/bin/sh
# Iniciar cron en background
cron
# Lanzar la app con PM2 de modo "watch" y en primer plano (no daemonizado)
pm2 start index.js --name masseru_api --watch -- --port 3002
