# Cierre del acceso privado de Mi Contacto

Base desplegada: `c8e8398`. Rama nueva: `work/private-access-close-20261105`.

## Diagnóstico comprobado

Los registros HTTP del intento anterior muestran GET 200 y POST 401, unos 167 segundos después. Esto descarta aquel rechazo de origen 403 y no demuestra vencimiento de diez minutos. La versión anterior agrupaba en la misma respuesta falta/duplicidad de cookie, firma/caducidad, token de otro formulario y código incorrecto; sin diagnóstico retrospectivo no se puede asignar una de esas causas al intento real.

Sí se reprodujo un defecto concreto con credencial exclusivamente sintética: abrir dos formularios en el mismo navegador reemplaza la cookie del primero; al enviarlo, aun con el código correcto, responde 401 antes de consultar la cuenta. Evidencia: `baseline.json`.

## Corrección

- Reutilizar la validación firmada del navegador mientras esté vigente; refrescar o abrir otra pestaña no invalida formularios previos. No amplía los diez minutos de la firma.
- Un código incorrecto no borra la cookie válida de otra pestaña. Una cookie inexistente, duplicada, adulterada, expirada o distinta del formulario sigue rechazada.
- Una sesión ya autenticada de la cuenta ADMIN autorizada permite volver al panel desde el acceso, sin volver a pedir código.
- Desactivar autocapitalización/autocorrección del campo para celular/tableta, sin recortar ni normalizar el código.
- Diagnóstico del servidor limitado a `PRIVATE_ACCESS` y un motivo enumerado: sin códigos, hashes, cookies, tokens, cuerpos, IP ni identificadores de cuenta. No se publica un endpoint de diagnóstico.
- Se conservan origen exacto, rechazo cross-site/Origin opaco, HMAC y comparación constante, Secure/HttpOnly/SameSite, caducidad, límite de diez intentos/minuto, cuenta fija y rol activo.

No se modifican credenciales, variables, PostgreSQL, esquema, datos existentes, almacenamiento, recursos, DNS, pagos ni otros proyectos. El único despliegue autorizado es el servicio Node existente de aceptación.

## Pruebas

159 pruebas automatizadas aprobadas; cero fallidas, canceladas u omitidas. Cuatro regresiones nuevas cubren pestañas/refresco, error de código, cookies, caducidad, diagnóstico sin secretos y origen/proxy. Los subconjuntos repetidos no se suman.

El script `scripts/private-access-browser.mjs` usa exclusivamente códigos y cuentas sintéticas en PostgreSQL WASM local; inicia sesión por el formulario real en lugar de inyectar cookies. Emula Android, iPad y escritorio. Cubre dos pestañas, cookies, rechazo de CSRF sin token, consentimiento, creación, subida/vista previa/reemplazo/eliminación, marca en píxeles, denuncia pública, revisión/ocultación ADMIN, apelación y auditoría. No representa dispositivos físicos ni un recorrido autenticado contra Railway.

## Verificación desplegada

Pendiente de registrar el estado terminal y la repetición con el acceso original del propietario. No se extraerá ni restablecerá ese código. Si la sesión solo puede abrirla el propietario, la prueba autenticada de Railway se mantendrá pendiente de ese paso.
