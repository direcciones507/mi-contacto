# Mi Contacto — botones, consentimientos y fotografías

Base real `2928339`, rama `work/visual-forms-20261105`. Se conserva toda la construcción anterior; no se desplegó la presentación nueva.

## Cambios

- Enlaces legales separados en un grupo accesible, con espacio propio y subrayado. Las tres declaraciones mantienen literalmente sus textos, están sin marcar y tienen espaciado uniforme y etiquetas táctiles.
- «ACEPTO Y CONTINUAR» azul, «NO ACEPTO» secundario. Se conservan los mismos destinos, comprobación obligatoria, versión, digest y petición de consentimiento. En `protection-gate.js` solo cambia el HTML; no cambia la validación del aviso ni las cookies.
- Botones compactos con altura mínima de 44 px, foco visible, texto adaptable y estados deshabilitados legibles. Retirada diferenciada visualmente.
- Cinco tarjetas de fotografías, con una principal gratuita identificada y cuatro adicionales de Destacado. Marcos de vista previa uniformes, acciones agrupadas y mensajes de bloqueo asociados al selector de archivo mediante `aria-describedby`.
- Instrucciones de guardar borrador visibles y destacadas. Se mantienen selección nativa de archivo, vista previa privada, descarte, reemplazo y retirada.
- Una columna en celular; dos desde 700 px y tres desde 1100 px. Campos y botones no fuerzan anchos mínimos que generen desbordamiento.
- Preferencia de movimiento reducido respetada. No se incorporan dependencias, fuentes remotas ni servicios nuevos.

## Validación final

**24 pruebas funcionales aprobadas, 0 fallidas y 0 omitidas**, en los módulos pertinentes de fotos, consentimiento versionado, protección/moderación y acceso privado. Registro: [functional-tests.log](evidence/visual-forms-20261105/functional-tests.log).

**Tres recorridos Chromium aprobados: 390, 820 y 1440 px.** El script verifica columnas 1/2/3, casillas inicialmente desmarcadas, rechazo sin las tres declaraciones, aceptación posterior, enlaces separados, etiquetas táctiles, botones de fotografía de 44–70 px, foco de teclado, borrador, selector bloqueado antes de guardar, vista previa, subida, reemplazo, retirada y cuatro adicionales bloqueadas sin Destacado. También comprueba marca, denuncia, ocultación ADMIN, apelación y auditoría. Sin errores JS ni desbordamiento horizontal.

Motor de pruebas: HTTP y PostgreSQL WASM locales; cuenta, código y fotos sintéticos. No son pruebas autenticadas de Railway ni dispositivos físicos. La primera aserción de foco se ejecutaba sobre un botón deshabilitado; se corrigió el arnés para comprobar el selector habilitado con modalidad de teclado, sin debilitar el estilo de foco.

Reproducción:

```sh
node --test --test-concurrency=2 tests/protection-moderation.test.mjs tests/photos-gallery-unification.test.mjs tests/unification-consent-territory.test.mjs tests/private-access-close.test.mjs
node scripts/visual-forms-browser.mjs
```

## Evidencia visual

| Formato | Consentimiento | Fotos guardadas | Antes del borrador |
|---|---|---|---|
| Celular, 390 px | [Ver](evidence/visual-forms-20261105/consent-390.jpg) | [Ver](evidence/visual-forms-20261105/photos-390.jpg) | [Ver](evidence/visual-forms-20261105/photos-before-draft-390.jpg) |
| Tableta, 820 px | [Ver](evidence/visual-forms-20261105/consent-820.jpg) | [Ver](evidence/visual-forms-20261105/photos-820.jpg) | [Ver](evidence/visual-forms-20261105/photos-before-draft-820.jpg) |
| Escritorio, 1440 px | [Ver](evidence/visual-forms-20261105/consent-1440.jpg) | [Ver](evidence/visual-forms-20261105/photos-1440.jpg) | [Ver](evidence/visual-forms-20261105/photos-before-draft-1440.jpg) |

También se conserva el aviso previo y la regresión de moderación. La barra fija se oculta solamente durante la captura para que no tape los controles fotografiados; la aplicación conserva su encabezado. Las capturas se revisaron visualmente.

## Límites

Sin cambios de autenticación, base de datos, permisos, contenidos/versión legales ni reglas de elegibilidad de Destacado. Sin pagos, Actions, infraestructura o despliegues. El aspecto publicado de Railway no cambia: la revisión física y el despliegue de esta rama permanecen pendientes. No hay un bloqueo técnico de esta mejora local.
