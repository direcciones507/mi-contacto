# Mi Contacto: cierre funcional sin cobros

## Código y despliegue

- Rama: `work/functional-close-20261106`, base `bd0bfa4` de `work/general-entry-notice-20261106`.
- Código probado y desplegado: `1c2922276dc2466eb2f9c2e52971bf6b03128774`.
- Entorno existente: mi-contacto-acceptance / acceptance, dominio https://micontacto.online/.
- Despliegue `c6902eb5-1baa-4b19-9e19-32aa1b46b00e`: SUCCESS, 6 noviembre 2026 17:08 UTC.
- No se modificó main, Direcciones507/LATAM ni Empleos.pa. No hubo nuevos servicios, bases o volúmenes, ampliación de recursos, cambio de DNS, pagos reales ni restauraciones destructivas.

## Implementación

La rama recibida ya traía publicación automática y ruta de prueba comercial. Se conservaron y completaron. El perfil gratuito se publica al confirmar la ficha y aceptar las declaraciones de publicación; ADMIN interviene posteriormente ante denuncias/incumplimientos. Guardar datos/foto no sustituye ese consentimiento.

Se corrigió el formulario del aviso en la home: Referrer-Policy same-origin evita Origin:null en solicitudes legítimas; se mantiene el rechazo de orígenes externos y las firmas de aceptación. El aviso inicial permanece separado del consentimiento por cuenta para publicar.

La selección de la primera foto volvía a crear una imagen que no se insertaba en el DOM: se restauró el marco de previsualización, ocultándolo hasta seleccionar o tener foto. Se conserva el selector compacto y las opciones de reemplazo, descarte y retirada. Solo se muestran espacios adicionales con saldo válido. Todas las entregas de fotos conservan marca de agua y validación del servidor.

Se restauró el QR gratuito y su descarga/compartir conforme a esta instrucción, sin anular privacidad, ocultación o moderación. Contactos y ubicación públicos mantienen las restricciones comerciales existentes y sus consentimientos; almacenarlos no obliga a mostrarlos. Galería adicional y directorio dependen de Destacado y elegibilidad. El QR conserva el enlace al cambiar país.

La compra directa privada ofrece 1/5/10 días a USD 1.90/8.90/16.90. Exige aceptación privada, habilitación explícita, sesión, CSRF y consentimiento de publicación. No admite proveedor conectado simultáneamente. Registra ACTIVATED_SIMULATION con motivo PRUEBA SIN COBRO; no crea payment_orders ni comprobantes de pago. Peticiones simultáneas no duplican saldo. Códigos y compra directa siguen siendo modalidades separadas.

Se conservaron generador ADMIN, lotes, reservas, venta manual sin pasarela, historial y canje único. Cada código concede un día; se rechaza reutilización y se conserva el saldo mediante pausa/reanudación y vencimiento calculado por servidor.

La simplificación visual había eliminado controles de vinculación y cierre de sesiones. Se restituyeron exclusivamente para el usuario autenticado, conservando una tarjeta simple para anónimos y la deshabilitación de operaciones sin permiso. No se cambiaron contraseñas existentes.

## Correo y proveedores

Se reutilizó el dominio de Resend ya verificado `mail.direcciones507.com`, sin cambiar DNS, dominio, plan ni otras aplicaciones. Se creó una credencial específica de envío, restringida a ese dominio, y se guardó como variable secreta en Railway; no se copió a GitHub ni se muestra en evidencias. Remitente: `Mi Contacto <mi-contacto@mail.direcciones507.com>`.

Correo de aceptación habilitado inicialmente solo para `ventas@direcciones507.com`; permanece una lista de destinatarios autorizados en el entorno privado. Se comprobó cuota disponible antes de enviar. El mensaje diagnóstico real obtuvo HTTP 200 e ID `01a1b1d6-e531-7410-aff7-e49b08b56271`; Resend confirmó delivered. No contenía OTP, contraseña ni enlace de verificación y no modificó cuentas/perfiles.

La verificación/recuperación completas se probaron en navegadores con transporte sintético y PostgreSQL nativo; falta ejecutarlas desde el buzón del propietario. No se confunde entrega del diagnóstico con certificación de todo el flujo real.

Google conserva su cliente y secreto existentes. HTTP real verifica redirección a accounts.google.com, PKCE S256 y callback exacto https://micontacto.online/auth/google/callback. No se completó la selección/validación de una cuenta personal, por lo que Google no se declara aprobado de extremo a extremo.

Se conserva el almacenamiento existente y sus fotos. No se certificaron operaciones R2 reales ni se cambiaron claves de otros proyectos. El adaptador sigue preparado; este despliegue no migra ni elimina fotos anteriores.

## PostgreSQL y respaldo

Las migraciones 016/017 ya estaban aplicadas. El arranque del despliegue nuevo devuelve replayed:true, preserved:true y SHA-256 del respaldo verificado `64ef15c7a215ad85c8904df548820e255b4318b4901573c5a98e1459a6bb4ead`. El array applied del informe reutilizado describe la actualización anterior; NO significa que se hayan ejecutado nuevamente. No hubo DDL nuevo ni restauración en Railway.

Pruebas nativas desechables comprobaron migración única, preservación de pedido histórico, respaldo/restauración y bloqueo ante fallo de respaldo. No equivalen a restaurar la base real, operación que no se realizó.

## Evidencia

[Actions 42255523664](https://github.com/direcciones507/mi-contacto/actions/runs/42255523664): SUCCESS, commit 1c29222.

- Regresión: 194 aprobadas, 0 fallidas, 0 omitidas.
- PostgreSQL 16 nativo desechable: 62 aprobadas, 0 fallidas, 0 omitidas, incluidas activaciones simultáneas sin duplicación.
- 18 recorridos Chromium: fotos/códigos/moderación; paquetes privados; correo; menú/acceso; investigación/apelación; recorrido integral. Seis suites por tres anchos: 390, 820 y 1440. Datos sintéticos; no dispositivos físicos ni pagos reales.
- Dockerfile existente construido y módulos cargados: Node 24, pg_dump 18.6.
- Artefacto `13522427590`, SHA-256 `f81a1ccd3447722316f294b8eeb1ca43ed735214c1a8b28981e70314d682568d`, disponible hasta 13 noviembre 2026.
- HTTP real en micontacto.online: readiness 200, aceptación firmada del aviso y cookies seguras, rechazo externo 403, cliente/ADMIN protegidos, opciones Google/correo activas, tarjeta de acceso y OAuth inicial correctos, activación anónima rechazada. Archivo `live-http-results.json`.
- Navegador cloud: home real y modal inicial visibles. No se aceptaron términos ni se utilizó la identidad del propietario mediante ese navegador. Un intento de Chromium local contra el dominio devolvió ERR_EMPTY_RESPONSE; no se considera caída porque HTTP y navegador cloud respondieron. No se presenta ese intento como recorrido aprobado del sitio real.

Fallos detectados fueron corregidos: supuestos antiguos de aprobación ADMIN en pruebas, formulario del aviso, primera vista previa de foto, nombres accesibles de selectores y controles de seguridad ocultos. Las ejecuciones fallidas previas se conservan en Actions, sin contarlas como aprobaciones.

## Pruebas del propietario

1. Abrir https://micontacto.online/ y aceptar personalmente el aviso. Pulsar Crear mi perfil gratis o Ingresar.
2. Usar su acceso existente para conservar ADMIN/perfil. Si Google/correo aún no están vinculados al acceso privado del propietario, entrar mediante el enlace privado ya entregado y vincular desde Seguridad de la cuenta; no crear una cuenta distinta para reemplazar el perfil existente.
3. Para un registro de correo de prueba autorizado usar el buzón indicado, elegir su propia contraseña y abrir el enlace recibido. Probar recuperación desde ese mismo buzón. Nunca enviar contraseñas al chat.
4. Completar profesión, país/región/localidad, descripción y foto. Guardar y publicar, revisar la ficha y confirmar las declaraciones. Debe quedar publicada sin aprobación ADMIN; comprobar enlace y QR.
5. Elegir 1, 5 o 10 días y Activar paquete de prueba sin pago. Comprobar galería adicional y directorio. Pausar/reanudar desde Estado y opciones de mi perfil.
6. En ADMIN, generar códigos, registrar venta manual de prueba y canjear con el cliente sin saldo activo. Revisar rechazo de reutilización. No simular un pago recibido de una persona real.
7. Denunciar una ficha de prueba, revisar en ADMIN, descartar un caso infundado y probar una restricción justificada y su apelación. No usar datos o denuncias de personas ajenas para estas pruebas.

## Límites y siguiente etapa

Pendientes indispensables: consentimiento y autenticación personal Google del propietario; recorridos autenticados en el entorno real, verificación/recuperación desde su buzón y pruebas físicas. No se declaran completados mediante sesiones sintéticas. No hay evidencia para pedir cambios en Google Developer sin observar primero el acceso personal.

Los pagos reales permanecen desconectados. El punto de integración posterior es `payment-runtime.js` confirm y el verificador del proveedor: firma, pedido, importe, moneda y estado confirmado antes de activar saldo. El retorno del navegador nunca confirma un pago. Debe deshabilitarse MC_COMMERCIAL_TRIAL antes de habilitar un proveedor autorizado.

La ventana de consumo aprobada termina el 6 noviembre a las 19:02:48 UTC (2:02:48 p. m. de Panamá); no se extendió. No se afirma costo cero ni factura confirmada. Mantener recursos activos puede seguir generando consumo, independientemente del estado de la aplicación.
