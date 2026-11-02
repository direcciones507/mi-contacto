# Mi Contacto — reproducir validación local

**Etapa vigente:** [LOCAL-HARDENING-20261031.md](LOCAL-HARDENING-20261031.md). 106 pruebas finales, 55 de integración como subconjunto, tres recorridos Chromium. Evidencia `evidence/local-hardening-20261031/`. Orden de migración actual 001–009; rollback vacío 009/008/007. Plan nativo preparado en [NATIVE-POSTGRES-PROCEDURE.md](NATIVE-POSTGRES-PROCEDURE.md), sin ejecución de servidor. Fotos/Google: [preparación](STORAGE-AND-GOOGLE-PREPARATION.md). Privacidad y retención: [propuesta](RETENTION-PROPOSAL.md).

Lo que sigue documenta la etapa anterior y sus dependencias/evidencias conservadas; las cifras anteriores no se suman a las actuales.

**Actualización vigente:** Destacados con saldo/pausa: [FEATURED-TIME-20261031.md](FEATURED-TIME-20261031.md), 78 pruebas y tres recorridos Chromium; evidencia en `evidence/featured-time-20261031/`. La etapa anterior del 70% y sus logs se conservan.

Esta entrega no configura un servicio activo. El único arranque incluido escucha en loopback y usa una base y fotos en memoria, sin perfiles ni credenciales predeterminados. No usar datos reales.

## Dependencias y límites

- Node comprobado: 24.22.1. package.json exige Node >=24.
- Fijadas en package-lock.json: pg 8.23.1, jose 6.2.14, sharp 0.35.5, qrcode 1.5.4; herramientas de validación PGlite 0.3.14 y jsqr 1.4.0.
- Licencias: MIT (pg, jose, qrcode), Apache-2.0 (sharp, PGlite, jsqr), registradas en evidence/20261031/dependencies.json.
- No se copió código nuevo de otros repositorios. Se integraron los módulos existentes de Mi Contacto: sesiones, Google, perfiles, slugs, adaptador PostgreSQL, países y consulta del directorio.
- La interfaz pg-compatible acepta un pool explícito; la entrega local usa exclusivamente PGlite efímero. Un esquema micontacto por sí solo no acredita una base físicamente separada: esa comprobación sigue pendiente antes de configurar infraestructura.
- Las pruebas del pool WASM están serializadas por su único backend; no acreditan concurrencia nativa, rendimiento productivo ni restauración de un servidor PostgreSQL.

## Comandos comprobados

```bash
npm test
node scripts/validate-real-catalog.mjs
```

El comando final npm test registra 78 aprobadas / 0 fallidas / 0 omitidas en evidence/featured-time-20261031/final-tests.log. Incluye firmas JWT reales sintéticas, OAuth simulado, controles HTTP, permisos, imágenes/EXIF/animaciones, galería máxima, ocho perfiles por cuenta, QR decodificado, catálogo, migraciones y rollback.

Los otros logs de tests de esta sesión son ejecuciones intermedias tras cambios; no se suman. La base de 49 pruebas ejecutada al recuperar 5cac16c está en baseline-tests.log y también está incluida en la suite actual. Las 67 de la etapa anterior se revalidaron antes de modificar reglas.

## Navegador con HTTP y base locales

Herramientas utilizadas: Playwright 1.62.1 y Chromium 153.0.8010.0, instalados fuera del repositorio. No se incluyen binarios de navegador en el respaldo. En un entorno que ya disponga de ellos:

```bash
MC_PLAYWRIGHT=/ruta/playwright \
MC_CHROMIUM=/ruta/chromium \
MC_BROWSER_EVIDENCE=/ruta/externa/capturas-locales \
node scripts/browser-validation.mjs
```

La ruta Playwright debe resolver su paquete Node; si el navegador necesita librerías locales, configurar LD_LIBRARY_PATH de ese entorno. No instalar ni desplegar servicios para ejecutar este comando.

El harness crea una base nueva por tamaño 390/820/1440. Genera cuentas/cookies sintéticas dentro del proceso y las añade al navegador; **no existe una ruta HTTP de inicio de sesión de prueba**. Bloquea tráfico ajeno al origen loopback. Ejecuta alta, edición territorial, consentimiento, foto/previsualización, solicitud, revisión ADMIN, tarjeta/QR, directorio, pausa y estados anónimo/no ADMIN. Resumen final actual: evidence/featured-time-20261031/browser-final.log. Las capturas de inspección permanecen fuera del respaldo Git.

No se probaron Safari, teléfonos/tabletas físicos, Google ni buckets reales. No se envió WhatsApp: solo se comprobó el enlace autorizado por el perfil sintético.

## Base y migraciones

- Orden 001 → 008, únicamente en motores descartables en memoria. El arranque web no ejecuta DDL sobre un pool externo; start-local crea su propio motor nuevo y después migra ese motor.
- Se corrigió 003: la referencia compuesta a localidades requería UNIQUE(id,country_code) antes de crear la FK. Su integridad se comprueba también al usar país/localidad incorrectos.
- La prueba migrations.test.mjs introduce un perfil/reserva anterior, aplica el resto, comprueba estabilidad y revierte un fallo inyectado antes del COMMIT de 007.
- db/rollback_007.sql permite únicamente preactivación sin registros runtime ni cambios de consentimiento/roles. Bloquea tablas, rechaza datos y no usa CASCADE ni borra personas para forzar rollback. Prueba negativa y positiva ejecutadas; después se reaplica 007.
- Las migraciones anteriores siguen siendo forward. No se ofrece un downgrade que quite unicidad por país a perfiles ya existentes o elimine reservas para hacer pasar una reversión.
- No se conectó PostgreSQL nativo: las limitaciones del entorno ya estaban documentadas. Su validación sigue pendiente, no se presenta como una omisión aprobada de la suite Node.

## Datos geográficos verificables

Fuente: [GeoNames](https://www.geonames.org/export/) y [formato de descarga](https://download.geonames.org/export/dump/readme.txt), CC BY 4.0. data/catalog-provenance.json conserva URLs, SHA-256, Last-Modified y conteos. El archivo derivado gzip se conserva con el código; no contiene datos personales.

Se recuperaron los ocho archivos nacionales y admin1/admin2. El constructor preserva IDs de origen y jerarquía, no une por homónimos y no inventa nombres. Cuatro lugares sin referencia territorial suficiente quedaron excluidos, con conteos en el manifiesto. Algunos registros solo tienen división admin1; no se fabrica un municipio para completarlos. La nomenclatura y reformas administrativas requieren revisión de fuentes nacionales antes de lanzar.

Para reconstruir offline con **los mismos archivos fuente y hashes**:

```bash
python3 scripts/build-catalog.py /ruta/extractos-originales
```

Si una descarga diaria cambió, el constructor rechaza su hash; no sustituye silenciosamente el catálogo. La importación load-catalog valida país/parentesco/duplicados, usa una transacción y parámetros, y registra la fuente como reviewed=false. No habilita automáticamente una infraestructura ni marca los datos como aprobados para producción.

La validación completa cargó 4.749 divisiones y 392.717 lugares poblados en PostgreSQL WASM, ocho países, cero referencias padre inválidas. full-catalog-sql.log no demuestra que todos los nombres sean denominaciones oficiales actuales.

## Política de seguridad y decisiones pendientes

- Google: flujo preparado con endpoints oficiales y verificador jose. Validación actual con claves/códigos sintéticos; no se proporcionaron claves reales. Fuente técnica: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).
- Administración: el registro OAuth siempre asigna USER. ADMIN solo se asignó a cuentas sintéticas dentro del harness. No se incluye credencial predeterminada, cambio público de rol ni aprovisionamiento de administrador en el arranque.
- Almacenamiento: contrato aislado y cliente simulado probado; no se leyó configuración R2 de otros proyectos ni se firmaron solicitudes a un bucket real. Falta un cliente S3/R2 real y una configuración dedicada revisada.
- Fotos: límite técnico 5 MB, JPG/PNG/WebP estáticos, 20 millones de píxeles de entrada, WebP hasta 1600 px, metadatos eliminados. La retirada y reemplazo impiden acceso a las versiones antiguas. Son bajas lógicas: falta aprobar retención/borrado físico y manejo de galería después del destacado. No prometer borrado físico realizado.
- La galería adicional solo se sirve si existe término ACTIVE vigente; no se borran sus archivos al expirar. La pausa congela saldo; edición/fotos/bloqueo del perfil también pausan y requieren aprobación antes de reanudar.
- Ediciones públicas retiran la ficha a DRAFT y requieren nueva revisión. Reactivar una pausa no permite levantar un bloqueo ADMIN. Este criterio conservador debe revisarse con la política final de moderación antes de publicación.
- Verificación de foto: gratuita, manual y ligada a la imagen principal vigente; cambio de principal revoca distintivo. No certifica identidad legal. Número exclusivo, tratamiento de video y plazos de eliminación aún pendientes; no se reciben videos/documentos ni se envían mensajes.
- Directorio: lista solo perfiles ACTIVE aprobados con saldo Destacado activo, consentimiento y cuenta/país habilitados. Gratuitos, pausados y vencidos quedan fuera. Devuelve nombre, profesión, ubicación y foto principal; no teléfonos ni coordenadas. Las fichas individuales y APIs son noindex y no-store, y no entran al sitemap. El runtime local también mantiene noindex global hasta revisar política de indexación del directorio/privacidad antes del lanzamiento.
- Los límites en memoria de consultas/escrituras son protección local básica, no un sistema distribuido antiabuso validado en producción.
- Destacados: precios aprobados, preparación sin cobro, saldo y pausa/reanudación probados. Activación únicamente en simulador interno habilitado explícitamente por el harness; ningún endpoint de activación ni proveedor real. Reembolsos y acumulación siguen pendientes; un término activo/pausado impide acreditar otro paquete.
- Solo por enlace: modalidad gratuita USD 0 conforme a la instrucción nueva. Fichas aprobadas conservan enlace/QR al pausar o agotar Destacado; bloqueo ADMIN continúa aplicando. No se inventa una tarifa adicional.
- db/rollback_008.sql se ejecuta antes de rollback_007 y rechaza términos/historial. Revisar pausas del esquema anterior, ventanas futuras y términos superpuestos antes de aplicar 008 a datos persistentes.
- El reloj de base protege retrocesos; adelantos incorrectos y contención del marcador de tiempo requieren validación nativa y operativa previa. No se declara probada concurrencia de múltiples backends con el pool WASM.


No hay despliegue, push, PR, Actions, cambios a otros proyectos, cobros, suscripciones ni correos reales.

## Auditoría de dependencias

La auditoría inicial encontró avisos altos para Sharp 0.34.5: [libvips](https://github.com/advisories/GHSA-f88m-g3jw-g9cj), [libheif](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c), [librsvg](https://github.com/advisories/GHSA-wq5f-xc86-pv6w). Se actualizó solo Mi Contacto a Sharp 0.35.5. `npm audit --json` final, incluyendo desarrollo, reporta cero vulnerabilidades conocidas. No acredita ausencia de riesgos desconocidos ni sustituye la revisión operativa. Tras actualizar se repitieron imágenes, OAuth/SQL y los recorridos HTTP de navegador; los logs autoritativos son final-validation.log y final-browser-validation.log.

Los campos teléfono y WhatsApp requieren +código de país y número completo. No se infiere un prefijo a partir de una entrada ambigua. La validación local no certifica titularidad ni que el número exista.
