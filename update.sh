#!/bin/sh
cd /app
echo "Verificando si hay actualizaciones en el repositorio..."
# Restaurar cambios locales y obtener información remota
git checkout .
git fetch origin

# Obtener los hashes de los commits locales y remotos (usando la rama main, ajusta si es diferente)
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
  echo "Se han detectado cambios. Actualizando repositorio..."
  git reset --hard origin/main
  echo "Instalando dependencias..."
  npm install
  echo "Reiniciando la aplicación con PM2..."
  pm2 restart masseru_api || pm2 start index.js --name masseru_api --watch -- --port 3002
else
  echo "No hay actualizaciones. No se requiere acción."
fi
