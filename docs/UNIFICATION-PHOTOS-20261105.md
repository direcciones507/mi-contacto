# Mi Contacto — unificación y fotografías

## Base conservada

Rama de origen `work/infrastructure-acceptance-20261104`, HEAD `1febb25`, contiene `161d178`, la corrección de fotografías `1dc619d` y sus pruebas posteriores. Servicio existente `mi-contacto-acceptance`, proyecto `7d9a7fb0-df2f-487c-8885-d093e1a9c9de`, entorno `acceptance`, servicio `11c5eb89-00ce-4928-bd4e-e2ce0c50d22a`. Se conserva dominio, PostgreSQL, volumen fotográfico, código privado, caducidad, recursos y pagos reales deshabilitados.

Rama de integración `work/photos-unification-20261105`. Mejoras de `1487ee1` incorporadas por archivos y adaptación selectiva; no se fusionó esa rama completa ni se reemplazó su servidor por el servidor anterior sin aceptación. `acceptance-access.js` y `origin-policy.js` conservan la corrección del 403 y el rechazo de orígenes externos.

## Funcionalidad

- Cinco espacios de fotografías visibles al entrar. La principal es gratuita; cuatro adicionales requieren Destacado con saldo/vigencia, comprobado también en servidor. Se conservan JPG/PNG/WebP estáticos hasta 5 MB y acceso privado.
- Botón directo «Crear borrador para subir mi foto», instrucciones por pasos, vista previa, descartar selección, reemplazar y retirar. Reemplazar una galería completa no crea una sexta fotografía. Fotos sustituidas quedan revocadas y en cola de eliminación.
- Aviso adaptado a Mi Contacto: mayoría de edad, derechos y consentimiento para imágenes; prohibición de pornografía, explotación, abuso infantil, trata y violencia. Aviso largo desplegable para no ocultar el control de subida. No se incorporó exoneración total ni promesa de denuncias automáticas.
- Privacidad/términos en borrador y consentimiento versionado; se respeta el acceso de aceptación sin exigir aprobación jurídica ficticia. Producción conserva revisión humana pendiente.
- Se preserva `012_sandbox_payments.sql`; consentimiento usa **013_legal_consent.sql**, sin reescribir migraciones previas.
- Antes de aplicar 013 en aceptación se requiere el reporte de respaldo/restauración existente y se crea otro pg_dump privado en el mismo volumen. Se comprueba que el archivo es legible con pg_restore --list; no se crea ni restaura otra base.
- Capa territorial pequeña: agrega dos cantones y corrige solo localidades verificadas sin perfiles referenciados. Si hay perfiles, preserva su ubicación y registra pendiente. No repite toda la importación ni mueve personas.

## Verificación

145 pruebas automatizadas aprobadas, 0 fallidas, 0 omitidas. Incluye el flujo de aceptación/403, pagos exclusivamente sintéticos ya existentes, consentimiento, integridad territorial y galería al límite con expiración y permisos. Auditoría de dependencias de producción sin vulnerabilidades conocidas.

Tres recorridos Chromium con HTTP local y PostgreSQL WASM: 390/820/1440, sin errores JS ni desbordamiento. Se probó el botón directo, subida, reemplazo, retirada y rechazo de galería gratuita, además del recorrido previo completo. No son dispositivos físicos ni login Google real. El navegador completo no pudo abrir su socket local; Headless Shell funcionó. Se ampliaron esperas a 60 s por latencia del entorno tras comprobar que los estados de éxito aparecían después del timeout de 30 s.

Evidencias: `docs/evidence/unification-photos-20261105/`. Las pruebas de aviso repetidas son subconjunto y no se suman a las 145. No se afirma que las imágenes se analizaran automáticamente por contenido sexual: la moderación conserva revisión ADMIN.

## Verificación pública

URL existente: https://mi-contacto-acceptance-acceptance.up.railway.app/acceso-pruebas . El formulario de código responde y el intento de ingreso mediante formulario seguro fue rechazado por el sitio. No se cambió ni reconstruyó el código. La subida real de esta integración requiere recuperar esa sesión; el informe no la declara aprobada a partir de pruebas locales o de la evidencia histórica de `1febb25`.

El despliegue autorizado se limita al servicio Node existente. No se crean proyectos, servicios, bases, DNS ni se amplían recursos. El resultado real del despliegue y la conservación de PostgreSQL se registrarán después de la actualización.
