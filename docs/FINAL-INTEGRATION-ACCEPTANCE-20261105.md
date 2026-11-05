# Mi Contacto — versión final consolidada y aceptación desplegada

5 noviembre 2026, Panamá. Rama `work/final-integration-acceptance-20261105`; **versión desplegada `826bdee9efe4912b88d7e5bdaf5020f6645f0600`**.

## Integración

`work/visual-forms-20261105` (`0fb2277`) ya contiene íntegramente `work/continuous-close-20261105` (`2928339`). Se verificó ascendencia de ambas referencias y se continuó desde ese historial, sin conflictos, sin duplicar módulos ni cambiar main.

Se conservan acceso privado, sesiones y CSRF; registro/verificación/recuperación por correo, vinculación explícita de Google, consentimientos versionados, perfil único, territorio, Maps, QR, fotografías, marca de agua, privacidad, denuncias y ADMIN. Las mejoras visuales permanecen integradas. No se modificaron reglas comerciales ni credenciales.

Cambios añadidos para cerrar la aceptación: modo nativo explícito en el arnés de pruebas; validación 001–014→015, concurrencia, reinicio y respaldo/restauración nativos; workflow exclusivo de esta rama; guardia del cierre autorizado antes de abrir PostgreSQL o ejecutar bootstrap. El ejecutor gratuito estándar usa PostgreSQL y Chrome ya instalados y no requiere agentes, infraestructura Railway nueva ni almacenamiento de artifacts de Actions.

## Validación de la versión exacta

Ejecución aprobada: https://github.com/direcciones507/mi-contacto/actions/runs/42057860326 , commit exacto `826bdee`, job `127351747256`.

| Prueba | Motor / entorno | Aprobadas | Fallidas |
|---|---|---:|---:|
| Regresión integrada | PostgreSQL WASM, GitHub runner | 169 | 0 |
| Autenticación y validación de 015 | PostgreSQL nativo, GitHub runner | 33 | 0 |
| Recorridos de interfaz y autenticación | Chrome + PostgreSQL nativo, 390/820/1440 | 6 | 0 |
| Comprobaciones HTTP públicas | Railway real | 8 | 0 |
| Aviso y formulario privado públicos | Railway real, Chrome 390/820/1440 | 3 | 0 |

No se suman de nuevo las 27 pruebas locales de autenticación repetidas para diagnóstico. Los grupos WASM y nativo son ejecuciones en motores distintos, no un conteo de pruebas únicas. No hubo casos omitidos en las suites finales.

Los casos nativos verificaron: preservación de cuenta Google, perfil y sesión anteriores al aplicar solo 015; conexiones con PIDs distintos; dos confirmaciones concurrentes con un solo resultado exitoso; unicidad y rollback real; login compitiendo con restablecimiento sin sesión residual con contraseña anterior; reinicio del servidor; respaldo custom y restauración real en una base propia del clúster descartable. Ninguna de estas pruebas usa la base de Railway ni credenciales reales.

Los seis recorridos verificaron registro, confirmación, recuperación, cambio y revocación; acceso privado multipestaña/cookies/CSRF; tres declaraciones obligatorias; borrador; principal gratuita y bloqueo de cuatro adicionales; previsualización, reemplazo y retirada; marca en píxeles; denuncia, ocultación ADMIN, apelación y auditoría. También se mantuvo la regresión de directorio/territorio, Maps, QR y privacidad. Correo y Google se prueban mediante proveedores sintéticos, sin envíos ni identidades reales.

Dos ejecuciones previas fueron sustituidas/canceladas al incorporar el cierre y evitar una descarga de navegador detenida. La ejecución enlazada arriba terminó SUCCESS completa; los resultados parciales anteriores no se presentan como su sustituto. El bloqueo nativo del ejecutor local root quedó resuelto utilizando el runner no root existente de GitHub; no se eludieron permisos locales.

## Railway existente y PostgreSQL real

Proyecto `7d9a7fb0-df2f-487c-8885-d093e1a9c9de`, entorno `acceptance` `4a65150e-8ee4-4d22-917e-3ae3de82a380`. Solo se actualizó la fuente del servicio Node existente, mediante cambios preparados y revisados del entorno: rama y commit; repositorio conservado. No se añadieron servicios, bases, volúmenes, dominios ni variables.

Despliegue **`0228d3a0-b922-4a43-abed-5f0ace24a84f`, SUCCESS**. PostgreSQL continúa en su despliegue original `a1142a43-788b-4822-94cd-ffb5b1a6c88f`; no se reinició ni reemplazó.

El bootstrap registró respaldo anterior a la migración de **4,710,650 bytes**, archivo custom legible por `pg_restore --list`, seguido de `015_email_auth.sql` aplicada y 15 migraciones totales. PostgreSQL real **18.6**, TLS verificado. El respaldo nuevo no se restauró encima de datos reales; la restauración se ejecutó en el clúster nativo descartable. Se conserva además la certificación histórica de respaldo/restauración del entorno.

La cuenta de aceptación conserva su identidad/fingerprint tras reiniciar la aplicación (bootCount 8). Los volúmenes y las fotos no se sustituyeron. Aplicación y PostgreSQL online, una réplica activa cada uno, cero fallos recientes y cero trabajo pendiente al cierre de las comprobaciones.

Después de aplicar 015 no se debe ejecutar un downgrade SQL automático ni restaurar sobre los usuarios para volver a la versión anterior. Cualquier corrección debe conservar compatibilidad con 015; la nueva autenticación externa sigue apagada por defecto y se mantiene el acceso privado existente.

## Recursos, presupuesto y cierre

Se conserva en cada servicio el límite de 0.25 vCPU, 500,000,000 bytes de memoria y una réplica. La autorización existente cubre la ventana de 48 horas desde 4 noviembre 2026 19:02:48 UTC, con consumo estimado aprobado USD 0.50–1.50.

Se verificaron métricas de ambos servicios y la supervisión existente. Proyección de CPU/RAM/almacenamiento al ritmo observado: aproximadamente **USD 0.11 para 48 horas**. Es una extrapolación; la factura y el crédito exactos no son accesibles. No incluye suscripción existente, tráfico no medido ni picos futuros. No se configura ni promete un tope monetario nuevo. Tarifas primarias verificadas: https://docs.railway.com/pricing/plans . Runner estándar de repositorio público: https://docs.github.com/en/actions/reference/runners/github-hosted-runners . No se utilizan runners de pago ni Railway Agent.

El arranque real confirmó `stopAt=authorizedEnd=2026-11-06T19:02:48.000Z`: **6 noviembre, 2:02:48 p. m. de Panamá**. La guardia nueva rechaza valores ausentes, inválidos, vencidos o que extiendan esa autorización antes de abrir la base. Se conservan el timer de Node y el cierre configurado de PostgreSQL. No se extendió la ventana. Los volúmenes conservados pueden seguir generando almacenamiento tras detener cómputo.

## Verificación pública real y capturas

URL: https://mi-contacto-acceptance-acceptance.up.railway.app/acceso-pruebas . Panel: https://mi-contacto-acceptance-acceptance.up.railway.app/mi-perfil . Se conserva el código original del propietario.

Se comprobaron `/health/ready`, `/api/session`, `/api/auth-options`, `/api/legal`, `/api/countries`, `/api/directory?country=PA`, `/runtime.css` y `/dashboard.js`. La sesión anónima devuelve 401; los demás 200. CSS y JS entregados coinciden byte por byte con Git. Las capturas reales verifican tres declaraciones inicialmente sin marcar y obligatorias, enlaces separados, acción azul, formulario privado, ausencia de desbordamiento y cero errores JS. No se introdujo ningún código ni se creó una sesión alternativa.

Chrome usa el proxy de red del ejecutor con la CA pública proporcionada fijada por SPKI; las comprobaciones Node HTTPS mantienen verificación de certificados. No se desactivó la validación TLS global ni se cambió TLS en la aplicación o PostgreSQL.

| Formato | Aviso real | Formulario privado real |
|---|---|---|
| Celular | [Captura](evidence/final-integration-20261105/live-consent-390.jpg) | [Captura](evidence/final-integration-20261105/live-private-access-390.jpg) |
| Tableta | [Captura](evidence/final-integration-20261105/live-consent-820.jpg) | [Captura](evidence/final-integration-20261105/live-private-access-820.jpg) |
| Escritorio | [Captura](evidence/final-integration-20261105/live-consent-1440.jpg) | [Captura](evidence/final-integration-20261105/live-private-access-1440.jpg) |

Evidencias JSON: [CI](evidence/final-integration-20261105/ci-results.json), [PostgreSQL y despliegue](evidence/final-integration-20261105/railway-deployment.json), [HTTP y navegador reales](evidence/final-integration-20261105/live-smoke.json), [recursos y proyección](evidence/final-integration-20261105/resource-preflight.json).

## Intervención exclusiva del propietario

1. Abrir su acceso privado original y ejecutar la prueba autenticada real de creación/carga, marca, QR/Maps y ADMIN desde sus dispositivos. Los recorridos autenticados automatizados anteriores son contra PostgreSQL nativo aislado; no son la sesión real del propietario en Railway.
2. Configurar Google OAuth y el correo/remitente verificado exclusivos para probar identidades y entrega reales. El HTTP real confirma `googleEnabled=false` y `emailEnabled=false`; el código está integrado, pero estos accesos externos todavía no están habilitados. R2 real también requiere configuración exclusiva; las fotos actuales usan el volumen privado existente.
3. Aceptación en dispositivos físicos y revisión territorial/jurídica para producción. No se desplegó producción ni se activaron cobros o envíos reales.

La versión consolidada está desplegada y verificable para la aceptación privada. No se declara completada la autenticación real de Google/correo ni la aceptación comercial del propietario.
