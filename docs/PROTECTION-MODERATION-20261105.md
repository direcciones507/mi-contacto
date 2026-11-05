# Protección integral de Mi Contacto

Rama: `work/protection-moderation-20261105`, basada en `50eb6ac`. Solo el servicio Node existente en proyecto `7d9a7fb0-df2f-487c-8885-d093e1a9c9de`, entorno `4a65150e-8ee4-4d22-917e-3ae3de82a380`, servicio `11c5eb89-00ce-4928-bd4e-e2ce0c50d22a`.

## Implementación

Aviso de adultos antes de iniciar OAuth y aceptación versionada también en aceptación. Los tres controles expresan edad, autenticidad/autorizaciones y aceptación conjunta de políticas. La declaración no verifica documentalmente edad o identidad. La cuenta de pruebas existente no es un registro público nuevo y acepta el aviso en su panel antes de crear o subir fotos.

Las imágenes se normalizan como antes, sin metadatos, y permanecen privadas. `publicPhoto` marca todas las respuestas autorizadas de `/media`, incluso las fotografías antiguas: procesamiento al consultar, sin destruir originales normalizados ni necesitar una migración de archivos. No hay parámetro ni ruta de entrega original. El texto central se adapta al lado menor para conservarse en recortes cuadrados del directorio. Opacidad 30%; no garantiza impedir copias. Sharp usa un hilo y caché limitada, sin ampliar recursos.

El formulario público `/reportar/:id` ofrece nueve motivos y evidencia textual opcional; no acepta archivos de evidencia, no recupera URLs y no requiere exponer datos del denunciante. Un token por navegador, origen estricto, firma, trampa de spam, límite global y límite persistente de cinco envíos por identificador/hora reducen abuso. Duplicados por perfil/identificador/24 horas retornan la misma recepción. Estos controles no equivalen a protección total frente a atacantes distribuidos.

ADMIN puede descartar, ocultar preventivamente, suspender cuenta, solicitar correcciones, retirar acceso o restringir material sensible. El bloqueo no depende del estado de privacidad que cambie el titular. Suspensión revoca sesiones; una reautenticación queda limitada a lecturas privadas y apelaciones. La retirada impide acceso público y a sus fotos; no declara purga física inmediata. Apelar y resolver son acciones auditadas; aceptar vuelve a borrador y conserva la aprobación obligatoria previa del producto.

Un bloqueo sensible niega medios incluso a ADMIN y retiene archivos de la cola de limpieza; no descarga ni redistribuye material, no denuncia automáticamente a autoridades. El responsable y asesoría jurídica determinan fundamento, plazo y evidencia mínima que legalmente corresponda. La producción sigue bloqueada por configuración legal incompleta.

Migración aditiva 014: metadatos de denuncias, declaraciones, indicadores de restricción, apelaciones y auditoría. Respaldo previo con `pg_dump` y comprobación de lectura en el volumen existente. Se eliminó del bootstrap la ruta antigua que creaba una base temporal: exige el respaldo/restauración ya certificado del entorno y no crea bases nuevas. No modifica migraciones anteriores, credenciales, DNS, recursos, pagos reales, main ni otros proyectos.

## Verificación

155 pruebas aprobadas, cero fallidas/omitidas. Los subconjuntos repetidos no se suman. Seis recorridos locales Chromium: tres regresiones completas y tres de aviso/fotos/marca/denuncia/ocultación/apelación/auditoría; 390/820/1440, sin errores JS ni desbordamiento. Motor SQL local PostgreSQL WASM, no PostgreSQL nativo. Evidencias en `docs/evidence/protection-20261105/`.

La revisión visual detectó texto recortado por miniatura cuadrada; se redujo el tamaño proporcional y se repitió el recorrido. Textos jurídicos propios y borradores; referencias primarias consultadas: Ley 81 de 2019 (ANTAI), https://www.antai.gob.pa/wp-content/uploads/2019/09/Ley-81-de-2019-Proteccion-de-Datos-Personales.pdf y Decreto 285 de 2021, https://antai.gob.pa/wp-content/uploads/2021/05/Reglamentacio%CC%81n-de-Ley-81-de-Proteccio%CC%81n-de-Datos-Personales.pdf . No sustituyen revisión jurídica.

## Comprobación de aceptación

URL existente: https://mi-contacto-acceptance-acceptance.up.railway.app/mi-perfil . El navegador de esta sesión llega al acceso privado; no dispone de sesión del propietario. No se extraen ni restablecen credenciales. Se verificará estado del despliegue, migración y páginas públicas; la comprobación autenticada de subida y ADMIN queda pendiente de acceso autorizado. No extrapolar las pruebas locales como prueba de la versión desplegada.

Despliegue confirmado: commit `c8e8398851e82de260befff93b7131d3ec706ae9`, deployment `baa6033f-8a59-44c7-9f40-7e93a073c9f0`, estado `SUCCESS`. Log de arranque: migraciones 14, aplicada 014, TLS verificado, respaldo previo legible de 4.703.773 bytes, persistencia tras reinicio confirmada. No se cambió la base PostgreSQL ni el volumen ni los recursos. `/health/ready`, `/api/legal`, `/aviso`, `/comunidad`, `/mi-perfil` y `/acceso-pruebas` responden HTTP 200; tres casillas inicialmente sin marcar y versión 2026-11-05.1 verificadas. La prueba autenticada sigue pendiente de la sesión privada.

Intento final de acceso con formulario seguro: el navegador devolvió «No se pudo verificar el acceso». No se capturó ni registró el valor del código, no se restablecieron credenciales y no se repitió el intento. Sigue pendiente la prueba autenticada de subida y moderación en Railway.
