# Desbloqueo de infraestructura — 4 noviembre 2026

Base `33ba6969a033a80e79040a1405f029800378fb6a`. Rama aislada `work/infrastructure-acceptance-20261104`. No se modificaron main, otros proyectos, Railway, DNS ni cobros reales.

## Cambio de estado verificado

Se consiguió infraestructura de ejecución mediante GitHub Actions: Ubuntu 24.04, Node 24, PostgreSQL 16 nativo y Chromium. El workflow crea sus propios clústeres descartables y no acepta URLs de bases externas ni credenciales productivas. Instalación y pruebas ocurrieron en el runner, sin intentar eludir restricciones de esta sesión.

Primera ejecución completa aprobada: [41889090122](https://github.com/direcciones507/mi-contacto/actions/runs/41889090122), commit `6da12c9`. Resultados: **133 pruebas Node**, **9 grupos PostgreSQL nativo**, **3 recorridos Chromium contra PostgreSQL nativo** y auditoría producción sin vulnerabilidades conocidas. Los grupos/recorridos no se suman al contador de pruebas Node. Artefacto: [13352318730](https://github.com/direcciones507/mi-contacto/actions/runs/41889090122/artifacts/13352318730), retención siete días. Se conservaron además resultados de texto/JSON en el repositorio.

PostgreSQL: 001–012 en orden conservando identidad previa, pgcrypto, distintos backend PIDs, activaciones concurrentes/idempotencia, pausa/reanudación exacta al milisegundo, carrera con bloqueo ADMIN, rollback, contención del reloj sin deadlock, pg_dump/pg_restore a otra base con huellas completas iguales y reinicio conservando datos/saldo/reloj. La creación de la base de cada recorrido de navegador también ejecuta el migrador real con registro de versiones/hashes. Son datos sintéticos en servidor PostgreSQL real, no base comercial persistente desplegada.

Navegador: creación, edición, foto, revisión ADMIN, directorio, vigencia/pausa, mudanza PA→CR conservando URL y QR, pin, compartir/descargar, privacidad, borrado autorizado y revocación de sesiones en 390/820/1440. Sin errores JS ni desbordamiento en la ejecución aprobada. Chromium por tamaños no sustituye Android físico ni Safari.

Se amplió después el recorrido de navegador para probar también la pantalla de checkout y callbacks firmados repetidos usando proveedor y componente Yappy sintéticos. Su ejecución final se registra en el bloque de cierre inferior; no se considera Yappy UAT real.

## Implementación añadida

Workflow limitado a rama de aceptación, con permisos de lectura y sin despliegue; clúster nativo reutilizable por fixture de navegador; contenedor de servicio Node 24 sin root y configuración Railway preparada; health/live y readiness DB; origen de aceptación explícito con sesiones seguras y enlaces del entorno; creación/edición conservan ruta del perfil. Contenedor alternativo para reproducir pruebas; Docker no está disponible en esta sesión y sus builds no se declaran ejecutados.

Transporte Resend exclusivo y de pruebas conectado a la cola mediante opt-in, destinatarios permitidos, clave idempotente, espera y revisión antes de vencer ventana de proveedor. No se enviaron mensajes. Sonda R2 lista para recursos exclusivos: escribe/recupera/reemplaza/borra solo su objeto aleatorio y limpia ante fallo. Preflight y plantilla de variables no muestran valores de secretos.

## Estado real de integraciones

| Componente | Estado |
|---|---|
| PostgreSQL nativo | Migraciones, concurrencia, rollback, reinicio, respaldo/restauración aprobados en runner descartable. Base persistente de aceptación aún no desplegada. |
| Navegador | Tres recorridos aprobados contra PostgreSQL nativo. Pruebas de dispositivos físicos pendientes. |
| Google | Código y callback/origen de aceptación preparados; faltan cliente/secret/consentimiento exclusivos para login real. |
| R2 | Adaptador y sonda preparados; faltan bucket privado y credenciales limitadas de Mi Contacto. Sin conexión real. |
| Yappy UAT | Pantalla/API/firma preparadas; falta comercio/secret/dominio/número UAT. Proveedor/componente usados en automatización son sintéticos. |
| Correo | Adaptador real preparado y probado con HTTP sintético; no hay remitente de Mi Contacto verificado en Resend. Falta clave exclusiva y destinatario acordado. Sin envío ni entrega real. |
| Acceso propietario | Sin URL pública todavía. Propuesta concreta de servicio/base independientes preparada; despliegue y recursos requieren autorización. |

No se cambia artificialmente el 90% de construcción local anterior; sigue sin representar preparación comercial. En los cuatro grupos de integraciones externas del informe anterior, PostgreSQL pasa de pendiente a validado en entorno descartable; Google/R2/pagos-correo reales siguen pendientes. No se declara producto listo para lanzamiento.

## Incidencias y límites

Un primer intento se canceló al actualizar el código; otro falló en una prueba nueva cuyo payload omitía consentimientos obligatorios. Se corrigió el fixture, sin relajar las validaciones, y se ejecutó nuevamente la suite completa. La primera ejecución integral posterior fue aprobada. Los resultados finales corresponden al commit indicado en el cierre, no a pruebas históricas.

No hay servicio/base exclusivos de Mi Contacto entre los ocho proyectos accesibles de Railway. No se reutilizaron bases/variables ni remitentes de otros proyectos. No se hicieron cambios de DNS o infraestructura remota. Faltan revisión territorial humana, legal/retención, canal de verificación fotográfica y aceptación del propietario.

La configuración concreta, accesos y secuencia de puesta en pruebas están en [ACCEPTANCE-ENVIRONMENT-20261104.md](ACCEPTANCE-ENVIRONMENT-20261104.md). La siguiente decisión es autorizar el proyecto/servicio/PostgreSQL exclusivos de aceptación, con dominio temporal Railway y sin DNS ni pagos reales.


## Cierre de verificación final

**Verde:** [ejecución 41889443037](https://github.com/direcciones507/mi-contacto/actions/runs/41889443037), commit probado `1b6f4f565af04339b23d98e552e047ba86da9bfc`. **133 pruebas aprobadas, cero fallidas/omitidas; nueve grupos nativos aprobados; tres recorridos completos de navegador contra PostgreSQL 16 nativo, incluyendo checkout con componente/proveedor sintéticos y callback firmado repetido; cero errores JS o desbordamientos; auditoría producción con cero vulnerabilidades conocidas.**

Artefacto final: [13353850733](https://github.com/direcciones507/mi-contacto/actions/runs/41889443037/artifacts/13353850733), SHA256 `9eb0fa156a7baa98d47958a400295f0abb0cffc39c0a2bdab45b25af704fc009`, retención siete días. Texto/JSON permanentes en `docs/evidence/infrastructure-20261104/`: `remote-tests.log`, `native-results-final.json`, `browser-final.log`, `audit-final.json`, `final-summary.json` y `preflight.json`. Capturas revisadas visualmente: ficha móvil, panel tableta, directorio escritorio y checkout móvil. La imagen principal sintética no representa persona real.

El último ajuste del contenedor alternativo fija un directorio de navegadores accesible por usuario no root; ese Docker build no se ejecutó. La verificación final corresponde al código de aplicación y scripts del commit probado. El cierre posterior solo añade documentación/evidencias y ese ajuste de empaquetado del contenedor alternativo; no cambia la aplicación validada.


Captura de la pantalla de pago de prueba en móvil (confirmación sintética, base PostgreSQL nativa):

![Checkout de prueba en móvil](evidence/infrastructure-20261104/checkout-390.png)
