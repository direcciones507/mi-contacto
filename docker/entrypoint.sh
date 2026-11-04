#!/bin/sh
set -eu
if [ "$(id -u)" = "0" ]; then
  if [ -L /var/lib/mi-contacto ] || [ -L /var/lib/mi-contacto/photos ] || [ -L /var/lib/mi-contacto/backups ]; then
    echo PRIVATE_VOLUME_REQUIRED >&2
    exit 1
  fi
  chown -R -h node:node /var/lib/mi-contacto
  install -d -m 700 -o node -g node /var/lib/mi-contacto /var/lib/mi-contacto/photos /var/lib/mi-contacto/backups
  exec gosu node "$@"
fi
exec "$@"
