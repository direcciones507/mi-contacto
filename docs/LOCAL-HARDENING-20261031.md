# Mi Contacto — continuación técnica desde el 75%

Fecha: 31 de octubre de 2026. Repositorio: direcciones507/mi-contacto.
Base recuperada del bundle completo de work/featured-time-20261031: c58830d y 264c526; historia anterior conservada. Nueva copia: mi-contacto-local-hardening; rama local work/local-hardening-20261031. La copia de la etapa anterior quedó intacta.

## Resultado y alcance

**75% anterior → 75% actual de integración local**, con la misma matriz de diez bloques de peso 10 y puntuación 0/0.5/1. Hubo avances técnicos y pruebas nuevas, pero no se cerró ninguna dependencia que permitiera elevar un bloque completo. No se sustituyó validación real por simulación para aumentar el porcentaje.

Comercial intacto: gratuita USD 0 solo por enlace/QR, fuera del directorio; Destacados 1/5/10/15/20/25/30 días por USD 1.69/7.99/14.99/21.99/27.99/31.99/34.99. Saldo exacto en milisegundos, pausa sin consumo, reanudación del remanente, agotamiento sin cambiar URL/QR y sin renovaciones automáticas. No se añadió ni activó un proveedor de pagos.

## Funciones terminadas localmente

### Persistencia privada de fotografías

Nuevo adaptador Linux local en photo-storage-local.js: directorio exclusivo 0700, archivos 0600, marcador de proyecto, claves UUID de Mi Contacto, escritura sincronizada y publicación sin sobreescribir, rechazo de symlinks y de carpetas ajenas. La primitiva de borrado físico del adaptador local está deshabilitada y se comprueba que rechaza la operación. Se comprobó conservación al reabrir el adaptador y servir desde otra instancia de aplicación, con la misma base sintética. El arranque normal conserva su modo efímero; no se activó infraestructura persistente real.

El contrato de bucket acepta solo nombre mi-contacto-*, configuración explícita isolated y métodos privados. Nunca devuelve URLs públicas a objetos. El cliente inyectado se probó mediante mapa sintético; no hay SDK R2 conectado, bucket creado ni claves reales. Siguen funcionando validación de formatos/tamaños, transformación WebP y retirada de metadatos.

**Corrección real:** un error recibido tras COMMIT no prueba que PostgreSQL no haya confirmado. Se eliminó la compensación que borraba físicamente la foto nueva ante cualquier error. Ahora se conserva un posible huérfano privado; el catálogo SQL y la autorización controlan su acceso. Un fallo SQL simulado conserva foto anterior, rollback, archivo nuevo inaccesible y ningún delete de almacenamiento. Reconciliar huérfanos requiere política aprobada, no una suposición sobre el resultado del COMMIT.

### Privacidad y solicitudes de eliminación

Nueva migración 009: privacy_hidden y removal_requests. Ocultar exige propiedad y CSRF; detiene Destacado, corta directorio/ficha/QR/fotos anónimas y conserva identidad/archivos. Mostrar de nuevo solo es posible sin solicitud pendiente ni bloqueo; no reanuda el saldo automáticamente. El consentimiento de ubicación protege región, localidad, sus identificadores y coordenadas en la ficha pública y el directorio; sin él, los filtros territoriales tampoco revelan pertenencia. El país sigue siendo parte del enlace aprobado. El consentimiento de teléfono/WhatsApp se mantiene separado.

Solicitar eliminación exige confirmación explícita, oculta y pausa, registra una sola petición ante reintentos y deja claro que no hubo borrado físico. ADMIN puede registrar revisión con motivo y auditoría. ACKNOWLEDGED no significa eliminación realizada. Solicitud pendiente impide levantar ocultación o reanudar. No hay endpoint de purga, vencimiento de retención ni notificaciones reales. La política propuesta queda pendiente de aprobación en RETENTION-PROPOSAL.md.

La retirada por privacidad impide acceso público incluso por URL directa, QR o identificador de foto conocido. Propietario y ADMIN conservan acceso autenticado de revisión; ese alcance se declara expresamente, no se promete una eliminación que no ocurrió. La reserva del enlace y unicidad por país permanecen.

### OAuth y sesiones

Se conserva JOSE/RS256, PKCE S256, state/nonce y cookie por navegador. Scope reducido a openid porque la aplicación usa sub y no almacena email, nombre ni foto Google. Cancelaciones, parámetros duplicados, expiración, errores de intercambio, tokens malformados y firmas/claims inválidos se manejan sin reflejar secretos ni descripciones externas. State válido se consume una sola vez y la cookie OAuth se limpia en salida terminal.

Para navegación HTML, errores de callback ofrecen retorno seguro a Mi perfil. Nueva acción Cerrar todas las sesiones: requiere CSRF y revoca sesiones de la misma cuenta. Se verifican firma/expiración, fila SQL, cuenta activa y rol actual en cada petición. Un JWT que sugiera ADMIN no eleva a un usuario. Configuración futura exclusiva documentada en STORAGE-AND-GOOGLE-PREPARATION.md; sin credenciales ni conexión Google real.

### Interfaz

Se conserva diseño, colores y distribución existentes. Se conectan ocultar/mostrar, solicitud confirmada, estado honesto sin borrado, revisión ADMIN y cierre de todas las sesiones. El saldo conserva consulta autoritativa al servidor y presentación días/HH:MM:SS; no se confía en el reloj del cliente para acreditar tiempo.

## PostgreSQL nativo: preparado, NO ejecutado

scripts/native-validation.mjs --plan funciona sin servidor y declara NOT_EXECUTED. --run exige un entorno ya compatible no root y binarios explícitos; no instala nada, no cambia UID ni recibe DATABASE_URL. Crea su propio cluster privado, contraseña sintética, puerto loopback y bases descartables, verificando data_directory antes de crear bases. No se ejecutó --run en el entorno actual ni se repitieron intentos de privilegios.

Nueve grupos preparados: pgcrypto/migraciones/perfil anterior; PIDs distintos/activaciones simultáneas; pausas/reanudaciones y milisegundos; carrera bloqueo ADMIN/reanudar; rollback de saldo; contención del reloj observada por otra conexión; pg_dump/pg_restore y huellas; downgrade/reaplicación; reinicio del servidor con datos/reloj persistidos. Procedimiento completo: NATIVE-POSTGRES-PROCEDURE.md. Sintaxis y plan verificados; comportamiento nativo, carrera, restauración y reinicio **pendientes de ejecución**.

Reloj persistido: protección existente frente a retrocesos conservada. No se certifica tolerancia a adelantos incorrectos ni rendimiento de la fila global sin validación operativa/nativa. La suspensión de país/cuenta mientras corre un término aún requiere definición/validación de compensación; no se inventaron créditos ni reembolsos.

## Migraciones y rollback ejecutados

Suite WASM descartable: 001–009, con perfil y reserva anteriores, identidad conservada. Fallos inyectados antes de COMMIT de 007, 008 y 009 revierten esquema/datos. Downgrade vacío 009 → 008 → 007 y reaplicación comprobados. Con datos de ocultación/solicitud, rollback_009 rechaza la reversión y conserva registros. 008 mantiene sus guardias para pausas antiguas, activaciones futuras y términos superpuestos; no se reconstruye saldo histórico inexistente.

WASM tiene un solo backend serializado. Promise.all en esas pruebas comprueba idempotencia y contrato local, no acredita concurrencia PostgreSQL multiconexión. Migraciones 001–008 se preservaron sin reescribirlas en esta etapa; 009 agrega la privacidad de forma explícita.

## Auditoría territorial sin modificar catálogos

Se revisó offline el snapshot con hash fdad820c15abf4595594333bef1c73e9e2738f39055bfc53d96ead14970e051f, conservando procedencia GeoNames y CC BY 4.0. Validación estructural aprobada: 4.749 divisiones, 392.717 localidades, cero padres inválidos, IDs duplicados o conflictos de ID entre países. Cero grupos de divisiones con mismo nombre normalizado dentro del mismo padre.

| País | Divisiones | Localidades | Solo relación nivel 1 | Grupos de localidades homónimas dentro de la misma región |
|---|---:|---:|---:|---:|
| PA | 96 | 13.238 | 159 | 573 |
| CO | 1.155 | 35.932 | 2.927 | 1.572 |
| CR | 89 | 5.781 | 3.483 | 360 |
| GT | 362 | 16.979 | 8.183 | 889 |
| SV | 58 | 4.888 | 4.886 | 390 |
| HN | 316 | 12.965 | 813 | 453 |
| NI | 170 | 2.629 | 1.654 | 62 |
| MX | 2.503 | 300.305 | 29.279 | 19.050 |

Son 51.384 localidades sin relación municipal completa y 23.349 grupos de homónimos candidatos a revisión; **no son 23.349 errores confirmados ni una autorización para fusionar lugares**. Ejemplos con IDs en catalog-audit.json. Cuatro lugares previamente excluidos por falta de región siguen documentados en el manifiesto, fuera de esos totales.

No se consultaron fuentes nacionales nuevas ni se certificó nomenclatura oficial actual. Cada país requiere validar versión, nombres/códigos oficiales, equivalencia admin1/admin2 y relación local; especialmente las coberturas municipales incompletas detectadas. No se inventaron municipios, se cambiaron nombres ni se deduplicó por homonimia. La carga SQL completa conserva evidencia válida anterior; no se repitió innecesariamente. La suite actual sí revalida estructura del catálogo y su carga parcial CR.

## Pruebas y evidencias

| Ejecución | Aprobadas | Fallidas | Omitidas |
|---|---:|---:|---:|
| Base recuperada sin cambios | 78 | 0 | 0 |
| Suite final Node + PostgreSQL WASM | 106 | 0 | 0 |
| Subconjunto de integración con entorno mínimo | 55 | 0 | 0 |
| Recorridos Chromium 390/820/1440 px | 3 | 0 | 0 |

Las 78 de base y las 55 de integración están incluidas en las 106 finales. No se suman ni se añaden ejecuciones intermedias. Los tres recorridos contienen múltiples comprobaciones y se cuentan como recorridos, no como un número inventado de escenarios unitarios.

Nueve grupos nativos NO ejecutados por limitación conocida del entorno. Tampoco se ejecutaron Google real, R2 real, proveedores de pago, pruebas en dispositivos físicos ni otros navegadores. No forman parte de aprobaciones ni de omisiones de la suite Node.

Los recorridos visuales verifican alta, edición, foto/vista previa, revisión, ficha/QR/contacto consentido, directorio, pausa/reanudación/saldo, ocultar/mostrar, solicitud de eliminación y acuse ADMIN, catálogos, sesión ausente, acceso ADMIN denegado y cierre de sesiones. Sin desbordamiento horizontal ni errores JavaScript, con tráfico ajeno al loopback bloqueado. Capturas de inspección fuera del repositorio y respaldo.

Evidencia autoritativa: docs/evidence/local-hardening-20261031/{baseline-78.log,final-tests.log,integration-subset.log,browser-final.log,catalog-audit.json,native-plan-not-executed.json}. No se borraron pruebas, evidencias, decisiones o informes anteriores. No se modificaron dependencias ni lockfile; se conserva auditoría previa, sin presentarla como una auditoría nueva.

Durante la iteración visual hubo un timeout del harness porque esperaba el enum técnico ACKNOWLEDGED después de traducir el estado ADMIN al español. Se actualizó el selector a «Revisión registrada; borrado pendiente», sin retirar la comprobación. El log se conserva como browser-intermediate-label-timeout.log; la tabla usa únicamente el recorrido final completo, no suma ni oculta ese intento intermedio.

## Estado de la misma matriz

| Bloque | Antes | Ahora | Límite pendiente |
|---|---:|---:|---|
| Aislamiento | 10 | 10 | Conservado |
| Autenticación | 5 | 5 | Google real y operación autorizada |
| Perfiles | 10 | 10 | Conservado |
| Directorio/geografía | 5 | 5 | Revisión territorial nacional |
| Fotos/almacenamiento | 5 | 5 | Bucket/cliente real, operación y política de retención |
| Ficha/privacidad | 10 | 10 | Controles reforzados; eliminación física sigue deshabilitada |
| Comercial local | 10 | 10 | Modelo aprobado conservado; pagos reales separados |
| ADMIN | 5 | 5 | Resolución final de eliminación/retención y reglas operativas |
| Experiencia | 10 | 10 | Verificada en tres tamaños |
| Release | 5 | 5 | PostgreSQL nativo, restauración/infraestructura y revisión operativa |
| **Total local** | **75** | **75** | **Sin afirmar preparación productiva** |

## Pendientes, autorizaciones y siguiente etapa

1. Ejecutar el procedimiento nativo en un entorno compatible ya disponible. Corregir fallos reales y conservar resultados, sin conectar bases externas ni forzar el entorno actual.
2. Revisar catálogos por país con fuentes nacionales y completar equivalencias, sin fabricar jerarquías ni tratar homónimos como duplicados automáticos.
3. Aprobar política de retención/eliminación, eventual cancelación de solicitudes, tratamiento de galerías/huérfanos/backups y permisos internos. No hay plazo ni purga aprobados.
4. Cualquier conexión futura a Google/R2/base persistente necesita autorización expresa, recursos y credenciales exclusivos, permisos y límites revisados, y validación conjunta de base/archivos/backups. No se solicita crear recursos de pago ahora.
5. Aprobar y verificar operación de reloj/compensaciones y aprovisionamiento ADMIN sin credenciales predeterminadas. Validar límites de abuso, capacidad y observabilidad antes de publicar.
6. Pagos, suscripciones, renovaciones automáticas y notificaciones reales permanecen deshabilitados; ninguna integración posterior supone autorización para cobrarlos.
7. Push, PR, workflows, despliegue, conexión Railway o publicación requieren autorización posterior; **esta entrega no la otorga**. No se modificó ningún otro repositorio ni servicio.

Recomendación: priorizar validación nativa y revisión de retención/geografía; conservar el modo local sin servicios reales. Lo preparado localmente no justifica publicar todavía.

## Commits locales

Implementación y evidencias: `da55d9b` (`feat: harden local privacy storage OAuth and prepare native validation`). El siguiente commit documental incluye este informe, procedimientos, propuesta, matriz y checklist; ambos identificadores exactos se obtienen con `git log -2` al recuperar el bundle.

## Recuperación

El respaldo de esta etapa es un bundle Git completo, sin depender de los anteriores. Incluye código, migraciones, pruebas, procedimientos, lockfile e historial de evidencias textuales; no incluye node_modules, fotos de prueba, capturas, binarios de navegador, buckets o una base productiva. Se verifica con clonación y git fsck antes de entregarse.

```bash
git clone --branch work/local-hardening-20261031 mi-contacto-local-hardening-20261031.bundle mi-contacto-recuperado
cd mi-contacto-recuperado
npm ci
npm test
node scripts/native-validation.mjs --plan
node scripts/audit-catalog.mjs
```

Node validado 24.22.1; dependencias fijadas sin cambios en package-lock.json. Chromium 153.0.8010.0 y Playwright externos al bundle; instrucciones en LOCAL-VALIDATION.md. La prueba de clonación valida integridad del código/evidencia, no restauración de una base PostgreSQL productiva.
