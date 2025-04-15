#!/bin/sh
# Inicia cron en background
crond
exec pm2-runtime start index.js --name masseru_api --watch -- --port 3002