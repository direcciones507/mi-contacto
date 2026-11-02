# Mi Contacto — Destacados con pausa y saldo

Fecha: 31 de octubre de 2026. Repositorio `direcciones507/mi-contacto`.
Base recuperada: `work/intensive-development-20261031`, commit `bb3e845`, con sus antecedentes `c6726cb`, `961c540`, `11236fa` y cierre documental previo `5cac16c` en el historial. Se verificó el bundle completo anterior y se clonó a una copia separada. Rama de esta entrega: `work/featured-time-20261031`.

## Resultado local y cambio comercial vigente

La instrucción actual sustituye las reglas anteriores sobre directorio gratuito y modalidad solo por enlace. El precio gratuito es USD 0 y su acceso es exclusivamente por enlace/QR. No se introdujo otro precio por privacidad. Los documentos anteriores se conservan como evidencia histórica, no como autorización comercial vigente.

- Gratuita aprobada: disponible por el mismo enlace y QR, sin aparecer en el directorio, con teléfono/WhatsApp y coordenadas solo mediante sus consentimientos.
- Destacado: paquetes de 1/5/10/15/20/25/30 días a USD 1.69/7.99/14.99/21.99/27.99/31.99/34.99. Validación tanto en aplicación como en SQL; sin modificación de tarifas.
- Preparar un paquete conserva su cotización, pero no confirma una compra, no cobra ni inicia tiempo. El tiempo empieza únicamente con activación efectiva de un perfil aprobado, publicado, con autorización de directorio y cuenta/país habilitados.
- Pausa/reanudación separadas del estado de publicación del perfil. Saldo persistido en milisegundos para no perder fracciones entre solicitudes; API en segundos y pantalla en días y HH:MM:SS, con botón para consultar el saldo actual.
- Pausar conserva saldo y retira el perfil del directorio. Reanudar requiere aprobación y privacidad vigentes. Al agotarse el saldo, la consulta pública lo excluye inmediatamente, sin depender de un cron. La próxima consulta de detalle consolida EXPIRED y su auditoría.
- Perfiles, país, propietario, slug, URL y contenido QR conservados. Pausar/vencer Destacado no despublica la ficha gratuita. Un bloqueo ADMIN sí impide acceso público y no puede levantarse reanudando.
- Ediciones, cambios/retiro de fotos y bloqueo de perfil ADMIN congelan automáticamente un Destacado en curso. Una nueva aprobación no lo reanuda sin acción del propietario. La galería contratada puede editarse con saldo pausado, pero solo es pública mientras el Destacado está activo y el perfil aprobado.
- Mi perfil muestra modalidad, paquete, estado, activación, consumo, saldo, vencimiento estimado mientras corre y acciones. ADMIN muestra propietario, aprobación, paquetes, tiempos, vencimientos, historial y retiro con motivo. El listado de Destacados permite consultar también pausados/vencidos.
- No se agregaron borrados físicos de perfiles, fotografías, reservas, términos ni auditorías. Se mantiene el régimen lógico existente y la política de retención sigue pendiente.

## Seguridad y límites de la simulación

Las operaciones de saldo bloquean primero el perfil, después sus términos y usan transacciones. Una restricción parcial impide dos términos ACTIVE/PAUSED simultáneos por perfil. Una confirmación sintética tiene clave única, ligada al término y perfil; repetirla no vuelve a acreditar saldo. Pausa/reanudación repetidas son idempotentes respecto al saldo.

Las fechas o saldos enviados por el navegador no gobiernan el contador. Un reloj de base persistido con marca máxima impide recuperar tiempo por ajustes hacia atrás o reinicios del proceso web. La precisión efectiva es de milisegundos; no se redondea cada pausa a minutos ni a días.

**Límite de reloj:** un adelanto incorrecto del reloj del servidor puede consumir tiempo prematuramente. El sistema no puede distinguirlo de tiempo realmente transcurrido sin una fuente de tiempo confiable adicional. Debe validarse sincronización/monitorización del reloj en un entorno compatible antes de publicar. La fila global de reloj también requiere medir contención en PostgreSQL nativo; no se afirma rendimiento distribuido probado.

No existe endpoint HTTP que active compras, acepte comprobantes o modifique saldo. `activateSimulation` solo opera dentro del proceso cuando el harness habilita expresamente `simulation:true`; está deshabilitado por defecto y el arranque local ordinario no lo habilita. No representa un adaptador de pagos reales listo. El futuro adaptador deberá verificar origen, firma, importe, moneda e identidad del pago, con su propia validación de seguridad.

## Pruebas y evidencia real

| Ejecución autoritativa | Aprobadas | Fallidas | Omitidas |
|---|---:|---:|---:|
| Base sin modificaciones | 67 | 0 | 0 |
| Suite final Node + PostgreSQL WASM | 78 | 0 | 0 |
| Recorridos completos Chromium, 390/820/1440 px | 3 | 0 | 0 |

No se suman las 67 de base ni las ejecuciones intermedias a las 78 finales. Cada recorrido de navegador contiene múltiples comprobaciones; se cuenta como un recorrido, no se inventa un total de escenarios independientes.

Evidencias en `docs/evidence/featured-time-20261031/`: `baseline-67.log`, `final-tests.log`, `browser-final.log`, `base-bundle-verify.log`. Se conservan intactos los logs y el catálogo de la etapa anterior. No se repitió la carga completa de 392.717 localidades: mantiene su evidencia anterior; la regresión carga el catálogo CR y verifica pertenencia territorial. Las capturas de inspección permanecen fuera de Git y del respaldo.

La suite cubre siete paquetes activados sintéticamente con duración/precio exactos; espera antes de activación sin consumo; 24 h menos 12 h, pausa de tres días, reanudar con 12 h; ciclos de 123 ms; reloj atrasado; varias sesiones; reintentos de activación y de pausa; confirmación reutilizada en otro perfil rechazada; agotamiento al milisegundo; QR idéntico antes/después; privacidad; permisos; bloqueo ADMIN con saldo congelado y sin reanudación; galería; auditoría; migraciones/rollback. La suite anterior se adapta solo donde las reglas nuevas sustituyen explícitamente sus expectativas de directorio gratuito y pausa de la ficha.

La validación visual usa HTTP de loopback, base nueva y datos sintéticos por tamaño; creación/edición/foto/revisión, ficha/QR, directorio, pausa/reanudación, historial ADMIN, catálogo, sesión ausente y acceso ADMIN denegado. No hubo desbordamiento horizontal ni errores JavaScript. Tráfico ajeno al origen local bloqueado.

No ejecutadas: concurrencia multiconexión PostgreSQL nativo, Google real, almacenamiento R2 real, proveedor de pagos real, navegadores distintos de Chromium y dispositivos físicos. Son validaciones externas a la suite actual, **no aprobaciones ni omisiones contabilizadas como éxitos**.

## Migraciones y compatibilidad

001 → 008 ejecutadas en motores WASM nuevos y descartables. 008 agrega saldo, ancla, reloj persistido, confirmación única e historial. Un término anterior ACTIVE conserva solo el tiempo remanente de su ventana, con máximo de lo contratado; uno ya agotado pasa a EXPIRED. No se restaura un paquete completo ni se altera identidad de perfiles.

Se probaron fallo inyectado y rollback transaccional en 007 y 008, actualización desde esquema anterior, rollback 008/007 sin datos de runtime y reaplicación. `rollback_008.sql` bloquea tablas y rechaza cualquier término/historial existente: no borra registros para permitir un downgrade. Con datos hace falta respaldar/restaurar o diseñar una conversión revisada, no ejecutar una reversión destructiva.

008 aborta y conserva los datos si encuentra perfiles PAUSED del modelo anterior, activaciones futuras o términos ACTIVE superpuestos. No deduce el saldo histórico de pausas que el modelo anterior no registraba. Su reconciliación requiere revisar datos y evidencia antes de migrar un entorno persistente; no hubo tales datos reales en esta copia local.

## Avance con la misma matriz

Se conserva la matriz de diez bloques iguales y puntuaciones 0/0.5/1 del informe anterior. El bloque comercial pasa de 0.5 a 1 por el modelo local confirmado e integrado y su simulación probada. Los otros nueve bloques conservan su puntuación y sus pendientes: **70% → 75% de integración local**, no preparación productiva ni porcentaje de pagos reales.

Desglose: aislamiento 10, autenticación 5, perfiles 10, directorio 5, fotos/almacenamiento 5, ficha/privacidad 10, comercial local 10, ADMIN 5, experiencia 10, release 5. Total 75/100. Matriz verificable: `PROGRESS-20261031.json`.

## Pendientes exactos y siguiente etapa

1. PostgreSQL nativo descartable como usuario no root: aplicar 001–008, abrir conexiones independientes y comprobar carreras de activación/pausa/reanudación/cancelación, bloqueos, contención del reloj y restauración de un respaldo completo. El entorno anterior limita usuarios/cambio de UID; no se repitieron intentos de privilegios ni se conectó ninguna base externa.
2. Revisión del reloj y política operativa de ajustes hacia adelante; validación de cuentas/países deshabilitados mientras corre un término y política de compensación si se necesitara. No se prometen créditos o reembolsos automáticos.
3. Persistencia física exclusiva de Mi Contacto, almacenamiento de fotos dedicado y Google real, únicamente en una futura fase autorizada. El arranque actual es efímero; el bundle respalda código/evidencia, no constituye un backup de datos productivos.
4. Retención/borrado físico, canal y evidencia de verificación de foto, revisión territorial nacional y permisos operativos ADMIN pendientes de decisión/validación previas.
5. Proveedor de pagos, comprobantes, reembolsos y eventuales reglas de acumulación/cambio de paquetes: pendientes de especificación y autorización. Por ahora se rechaza otro paquete con término activo/pausado; no se implementan renovaciones ni acumulación silenciosa.
6. Futura publicación/control de acceso solo con autorización expresa. Ningún push, PR, Actions, deploy, cambio Railway, cobro, suscripción, aviso real ni modificación de otros proyectos fue realizado.

Recomendación: validar primero PostgreSQL nativo y persistencia aislada, conservando pagos deshabilitados. No publicar todavía.

## Incidencias resueltas y commits

Implementación y evidencias: `c58830d` (`feat: preserve featured balance across pauses and keep free cards link-only`). El siguiente commit documental conserva este informe, la matriz y el checklist; consultar `git log -2` en el respaldo para ambos identificadores exactos.

Se corrigieron los dos comportamientos comerciales anteriores (gratuita en directorio y pausa que despublicaba enlace/QR), el consumo por calendario durante pausas y la falta de saldo/historial conectado. Se evita seguir descontando durante nueva revisión de contenido o bloqueo de perfil.

Durante la iteración fallaron dos aserciones nuevas del harness: el reemplazo JavaScript reducía `$$` en el fallo SQL sintético, y una aserción escogía la primera cotización histórica de un perfil en lugar de la identificada. Se corrigieron las pruebas sin suprimirlas ni relajar sus condiciones. La primera ejecución del navegador no arrancó por ausencia del binario anterior; se recuperó Chromium en herramientas separadas, sin modificar dependencias de la app ni servicios. Los resultados finales de la tabla corresponden únicamente a ejecuciones posteriores completas.

`npm run test:integration` también aprobó sus 27 pruebas (subconjunto de las 78, no se suman), con entorno mínimo sin credenciales heredadas. La copia base del proyecto quedó sin modificaciones.

## Recuperación y dependencias

Se entregará un bundle Git completo de `work/featured-time-20261031`, sin requerir el bundle anterior. Conserva historial, decisiones, código, lockfile y evidencias textuales. No incluye node_modules, binarios de navegador, fotos de pruebas ni capturas.

```bash
git clone --branch work/featured-time-20261031 mi-contacto-feature-time-20261031.bundle mi-contacto-local
cd mi-contacto-local
npm ci
npm test
```

Node >=24 (validado 24.22.1); dependencias fijadas en `package-lock.json`, sin cambios respecto a la etapa 70%. Navegador: Playwright externo y Chromium 153.0.8010.0; comandos y límites en `LOCAL-VALIDATION.md`. El bundle no ejecuta comandos ni activa servicios al recuperarlo.
