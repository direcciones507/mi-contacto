# Validación nativa preparada — no ejecutada

Este procedimiento es exclusivo de Mi Contacto y de datos sintéticos. No utiliza DATABASE_URL, archivos .env, credenciales de otros proyectos ni un servidor PostgreSQL existente. No instalar paquetes, cambiar UID, elevar privilegios ni crear infraestructura para hacerlo funcionar en el entorno actual.

## Requisitos en un entorno ya compatible

- Usuario ordinario, Node >=24 y dependencias del lockfile disponibles.
- Binarios existentes del mismo PostgreSQL: initdb, pg_ctl, pg_dump y pg_restore; extensión pgcrypto disponible en esa instalación. Objetivo inicial de validación: PostgreSQL 17; no se afirma compatibilidad nativa hasta ejecutar el procedimiento.
- Directorios privados locales, espacio descartable y posibilidad de escuchar en loopback. No usar carpetas de otro proyecto.
- La carpeta de evidencia indicada debe ser nueva. El script rechaza root antes de iniciar procesos PostgreSQL. No cambia usuarios ni instala herramientas.

## Comandos

El plan se puede consultar sin servidor ni credenciales:

```bash
node scripts/native-validation.mjs --plan
```

Solo en el entorno compatible ya existente, como usuario no root:

```bash
node scripts/native-validation.mjs --run \
  --pg-bin /ruta/absoluta/binarios-postgresql \
  --evidence /ruta/absoluta/nueva-evidencia-mi-contacto
```

No pasar URLs PostgreSQL. El script crea su propio cluster mediante initdb en una carpeta temporal privada y escucha únicamente en 127.0.0.1 en un puerto libre. Genera una contraseña sintética en archivo 0600 y no la imprime; no lee contraseñas ajenas. Antes de crear bases verifica que data_directory coincide con la carpeta que acaba de crear. No abre conexiones a dominios ni a bases productivas.

## Nueve grupos preparados

1. pgcrypto y migraciones 001–009 ordenadas, con un perfil anterior sintético y comparación de identidad.
2. PIDs de backend distintos; ocho activaciones concurrentes de una confirmación y una sola acreditación/evento.
3. Ocho pausas y reanudaciones concurrentes, ejemplo 24h/12h/pausa tres días, consumo de 123 ms y agotamiento exacto.
4. Bloqueo ADMIN compitiendo con reanudación; estado bloqueado y saldo pausado.
5. Cambio de saldo dentro de transacción revertida; huella anterior idéntica.
6. Retención deliberada de la fila de reloj; observación de wait_event_type=Lock desde otra conexión y liberación sin interbloqueo.
7. pg_dump formato custom y pg_restore en otra base nueva; huellas ordenadas de todas las tablas micontacto y consulta de saldo restaurado.
8. Downgrade sin datos 009 → 008 → 007, seguido de reaplicación 007–009.
9. Detener/reiniciar ese mismo servidor sintético y comparar datos/reloj persistidos.

El reloj determinista se instala solo dentro de esta base sintética; el runtime normal no tiene un parámetro HTTP de reloj de prueba. Se usa para comprobar aritmética exacta, no para certificar sincronización NTP, saltos hacia adelante, rendimiento o tiempos de espera del mundo real.

## Resultados, fallos y limpieza

results.json informa PASS/FAIL por grupo y notExecuted para grupos dependientes que no se alcanzaron. Un fallo detiene dependencias; no se sustituye por una prueba WASM. El plan del entorno actual está en evidence/local-hardening-20261031/native-plan-not-executed.json: **NOT_EXECUTED**, nueve grupos pendientes. Aquí solo se verificó sintaxis y generación del plan, sin lanzar PostgreSQL.

Se conservan postgres.log y synthetic.dump en la carpeta de evidencia privada. No contienen usuarios reales. El cluster temporal se elimina tras éxito y parada; ante fallo se conserva para diagnóstico. Si no se logra detener, no se eliminan sus archivos ni se actúa sobre otro servicio. Las carpetas contienen únicamente los datos sintéticos generados por este procedimiento.

Las pruebas WASM de la suite sí comprueban fallo transaccional de 007/008/009, rollback protegido, guardias de 008 y conservación de identidad. No acreditan multiconexión, pg_dump/pg_restore ni reinicio de un servidor real.
