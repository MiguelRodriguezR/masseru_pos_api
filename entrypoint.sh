#!/bin/sh
# Inicia cron en background
crond

pm2 start index.js --name masseru_api --watch -- --port 3002 --no-daemon