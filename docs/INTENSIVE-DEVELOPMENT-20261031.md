# Mi Contacto — continuación intensiva, 31 de octubre de 2026

**Estado final: integración local estable comprobada; no publicado.** Rama local work/intensive-development-20261031, desde work/portada-directorio-20261030 en 5cac16c3bc23278c53a6ba2ace2f36329f565e71. GitHub confirmó repositorio/rama/commit; se clonó en copia nueva aislada y se conservaron las decisiones y pruebas anteriores.

## 1. Avance y criterio verificable

El **38%** fue el avance anterior reportado. No se recuperó una fórmula, denominador o ponderación para reproducirlo: no se finge que sea comparable exactamente con una medición nueva.

Se usa una matriz explícita de diez bloques de igual peso (10 puntos cada uno). Estado 0: no implementado; 0,5: preparación o integración parcial con un cierre material pendiente; 1: capacidad local integrada y comprobada. Los gates reales no probados se enumeran abajo. No mide porcentaje de producción ni facturación.

| Bloque, criterio de cierre local | Base recuperada 5cac16c | Entrega | Evidencia y límite |
|---|---:|---:|---|
| Aislamiento de runtime/configuración/sesiones/datos | 5 | 10 | Instancia efímera propia, rutas/marca/cookies propias, no lectura automática de credenciales/URL ajenas; infraestructura física futura pendiente |
| Autenticación completa, sesión y CSRF | 5 | 5 | OAuth, JWT firmado sintético, state/nonce/PKCE/replay, revocación; Google real todavía no probado |
| Perfiles por país, edición, propiedad e identidad | 5 | 10 | Ocho países por cuenta, un perfil por país, duplicados/permiso/versiones/URL estable comprobados |
| Directorio y geografía | 5 | 5 | API/UI/filtros/paginación/catálogos conectados; revisión oficial territorial pendiente |
| Fotografías y persistencia aislada | 0 | 5 | Compresión/privacidad/límites/reemplazo/previsualización probados; almacenamiento real duradero y retención pendientes |
| Ficha pública, enlaces, QR y privacidad | 5 | 10 | HTML adaptable, contacto/GPS por consentimiento, QR decodificado, noindex, pausa y sitemap comprobados |
| Modelo gratuito/destacados | 5 | 5 | Precios/esquema/vigencia/galería/retirada ADMIN; faltan reglas comerciales completas y confirmación de pago autorizada |
| ADMIN y moderación | 0 | 5 | Revisión, bloqueo, auditoría, catálogos, denuncias/verificación; eliminación/retención/notificación final pendientes |
| Experiencia de usuario conectada | 5 | 10 | Tres recorridos completos HTTP + DB en 390/820/1440, sin overflow/errores JS; dispositivos físicos pendientes en validación de release |
| Calidad de release y operación | 5 | 5 | Suite/migraciones/rollback locales aprobados; PostgreSQL nativo, concurrencia, infraestructura y seguridad operativa pendientes |
| **Total / 100** | **40** | **70** | Fuente numérica: PROGRESS-20261031.json |

**Base auditada: 40%; avance local nuevo: 70%.** Diferencia comparable: +30 puntos en esta matriz. El 38% reportado se conserva como antecedente, no se recalcula retroactivamente para aparentar +32 puntos. La recuperación del agente AD507 Developer no suma avance.

## 2. Funcionalidades terminadas en entorno local

- Runtime HTTP loopback, assets permitidos explícitamente, configuración/identidad propias y base/fotos efímeras aisladas. No depende de servicios ni tablas de otros proyectos.
- Registro/inicio de sesión Google preparado: state consumible ligado a cookie, nonce, PKCE, firma JWT jose, cuenta por google_subject, rol USER, sesiones mc_session revocables y CSRF en escrituras. Flujo integrado probado con claves firmadas sintéticas; proveedor real pendiente.
- Creación/edición/propiedad de perfiles, máximo un perfil por país/cuenta en ocho países; colisiones 409 sin sufijos automáticos. País, slug, cuenta e ID inmutables en DB. Otro país no altera el enlace inicial.
- Formularios Mi perfil, selección territorial, contactos/autorizaciones, foto/previsualización, estado, copia de enlace, QR, pausa y reactivación con protección de bloqueos.
- Fotografía real decodificada, WebP, eliminación de metadatos privados, validación de tamaño/formato/animación, principal única y máximo cuatro adicionales. Fotos no publicadas solo para dueño/ADMIN; todas las lecturas comprueban estado y vigencia.
- Ficha pública adaptable sin correo, contacto/GPS solo con permiso, Cómo llegar Maps/Waze/Uber cuando hay coordenadas, QR local, noindex y sitemap sin fichas.
- Directorio SQL y UI por país, región, distrito/municipio, localidad, categoría y texto, con paginación y prioridad de términos destacados vigentes; no usa GPS para buscar ni devuelve contactos privados.
- ADMIN restringido, listado gratuita/destacada/en revisión, aprobación/rechazo/bloqueo con versión y motivo, revisión de fotos, catálogos, denuncias, auditoría y retiro de destacados sin ejecutar cobros/reembolsos.
- Solicitud de verificación de foto gratuita y manual, código único, control de imagen vigente, revocación al cambiar principal. No hay recepción de documentos/videos ni aprobación automática por pagar.

«Terminado local» no significa almacenamiento persistente, login Google real o publicación autorizada.

## 3. Datos y fotografías

GeoNames: ocho extractos nacionales más admin1/admin2 recuperados de fuente oficial, licencia CC BY 4.0 y hashes/procedencia registrados. Constructor offline determinista que rechaza fuentes cambiadas, validador estructural e importación SQL transaccional preparados y ejecutados.

Se cargaron **4.749 divisiones y 392.717 lugares poblados** en una base descartable: CO 35.932; CR 5.781; GT 16.979; HN 12.965; MX 300.305; NI 2.629; PA 13.238; SV 4.888. Cero referencias territoriales inválidas. Cuatro registros quedaron excluidos por falta de referencia suficiente; no se inventaron divisiones. Esta validación no demuestra que nombres/jerarquías coincidan con todas las reformas nacionales actuales: reviewed=false.

Almacenamiento: memoria privada local y contrato de cliente aislado simulado, sin buckets reales. Reemplazar/retirar una foto revoca su acceso, conservando metadatos/objeto para una política futura de retención. No se declara borrado físico ni conexión R2 real. La galería vencida queda privada, sin destruirla automáticamente.

## 4. Errores y discrepancias corregidos

1. Migración 003: añadida la clave compuesta UNIQUE(id,country_code) que faltaba para crear su FK. Orden 001–007 ejecutado correctamente.
2. Buscador SQL: la cláusula ESCAPE anterior representaba dos caracteres en PostgreSQL; corregida a una expresión de un carácter y comprobada con búsquedas/literales %, filtros e IDs.
3. Flujo visual anterior: los filtros solo preparaban texto y no consultaban perfiles. Ahora ejecutan API/SQL y preservan IDs territoriales en lugar de unir homónimos por nombre.
4. Configuración OAuth: rechazados protocolos/dominios ajenos y URI con credenciales; solo origen canónico propio o HTTP loopback. Se evita truncar silenciosamente datos profesionales extensos o aceptar objetos como campos de texto.
5. Moderación: edición/fotografía cambian versión y requieren revisión; aprobación con versión vieja se rechaza. Bloqueos ADMIN no pueden levantarse desde el panel del titular.
6. Verificación/foto: ligada a MAIN vigente, retirada al sustituirla; bloqueo consistente perfil → solicitud para evitar orden inverso frente a subidas. Este orden fue revisado y probado secuencialmente; concurrencia nativa aún pendiente.
7. Documentación antigua: declaraciones de «solo por enlace» y «un perfil global» se conservan como historia, pero se señalan reemplazos/conflictos. La regla vigente es un perfil por país por cuenta y solo por enlace no habilitado.

8. Auditoría de dependencias: se detectó Sharp 0.34.5 afectado por avisos de severidad alta; actualizado a **0.35.5**, con regresión de las 67 pruebas y tres recorridos aprobada. Auditoría final completa (incluye dev): **0 vulnerabilidades conocidas**. Evidencias dependency-audit.json y dependency-audit-final.json; fuentes GHSA-f88m-g3jw-g9cj, GHSA-rgj7-g3m4-5g8c y GHSA-wq5f-xc86-pv6w. No se modificaron otros proyectos.

9. Contactos internacionales: se evita generar enlaces WhatsApp/teléfono ambiguos a partir de números locales sin país. La entrada requiere +código de país explícito; no se inventa ni antepone automáticamente un prefijo. Validación y mensaje de formulario comprobados.

No se informa ningún fallo de producción: no se consultó ni modificó producción.

## 5. Pruebas reales, sin sumar ejecuciones

| Prueba | Resultado | Evidencia autoritativa |
|---|---|---|
| Base recuperada antes de cambios | 49 aprobadas / 0 fallidas / 0 omitidas | evidence/20261031/baseline-tests.log |
| Suite final Node, incluye las anteriores | **67 aprobadas / 0 fallidas / 0 omitidas** | evidence/20261031/final-validation.log |
| Navegador con HTTP y DB reales locales | **3 recorridos completos aprobados**, 390/820/1440, sin errores JS/overflow | evidence/20261031/final-browser-validation.log |
| Catálogo completo SQL | Ocho países, 4.749 divisiones, 392.717 registros, cero padres inválidos | evidence/20261031/full-catalog-sql.log |
| Migraciones/compatibilidad/rollback | Incluidas en las 67: 001–007, reserva/perfil anterior, fallo transaccional, rechazo de rollback con datos, rollback sin datos y reaplicación | tests/migrations.test.mjs |
| JWT, QR e imágenes | Incluidas en las 67: JWT firmado/PKCE/state/replay; QR rasterizado/decodificado; JPG/PNG/WebP, EXIF eliminado y animación rechazada | tests/runtime.test.mjs, tests/photo-engine.test.mjs |
| Sintaxis/diff | node --check y git diff --check aprobados | Comprobación local antes del commit |

Los logs intermedios se conservan, pero no se suman a los finales. PostgreSQL WASM es un único backend serializado: **no hay aprobación de concurrencia nativa**. No se ejecutó una prueba de Google real, R2 real, Safari o dispositivo físico; no figuran como pruebas «omitidas aprobadas». Los tres recorridos no son 51 escenarios de Direcciones507: son evidencia nueva e independiente de Mi Contacto.

No hay perfiles personales reales en ninguna prueba; los únicos sujetos son fixtures explícitamente sintéticos. Los catálogos territoriales sí proceden de GeoNames.

## 6. Parciales, bloqueos y decisiones necesarias

- Google real: faltan cliente/redirect/secret exclusivos de Mi Contacto y validación autorizada; el arranque local muestra acceso no habilitado, sin botón roto ni cuenta de prueba pública.
- Persistencia/R2: falta base física independiente y bucket/cliente real exclusivo, revisión de permisos, CORS, cuotas y costos. No se reutilizaron credenciales ni bucket de otro proyecto.
- PostgreSQL nativo/concurrencia, rendimiento y restauración: pendientes; no se intentó eludir la restricción del entorno ya conocida. El adaptador pg y las migraciones están preparados, pero no acreditan por sí solos operación nativa.
- Destacados: precios exactos conservados, quotes y estados preparados; faltan expiración contractual/zona horaria, renovación/reembolsos/comprobantes y conexión de pagos autorizada. No hay endpoint de activación de pago; términos ACTIVE de pruebas se insertan solo en su DB sintética.
- Solo por enlace: el pedido actual lo menciona, el checklist anterior lo había retirado; no hay precio/vigencia reconciliados. No se habilitó esta modalidad ni una alternativa gratuita.
- Verificación: número WhatsApp exclusivo, privacidad, acceso y retención del video aún sin definir. No se almacenan videos ni documentos.
- Fotos/eliminación de perfiles: falta política de retención/borrado físico y de extras vencidas. Se ofrece retirada lógica y bloqueo seguro, no eliminación irreversible sin política.
- Moderación de ediciones, denuncias y notificaciones: criterio local conservador aplicado; falta ratificación operacional de plazos, notificación y tratamiento de menores/datos personales.
- Catálogo: revisión humana con fuentes nacionales de reformas territoriales y homónimos; la fuente/licencia y pertenencia estructural no equivalen a aprobación oficial.
- Directorio/SEO: fichas siempre noindex; el runtime local mantiene noindex global hasta aprobar privacidad/indexación del directorio. No se prometió invisibilidad absoluta en Internet.
- Dominio micontacto.online elegido, compra/DNS/SSL no comprobados. No se configuró infraestructura ni se publicó.

No se detuvieron las tareas independientes por estos bloqueos. No se preparó un flujo de cobro real ni se decidió unilateralmente una política comercial faltante.

## 7. Commits y respaldo

- Implementación: **c6726cb**, base 5cac16c. Incluye código, esquema, datos/licencia/procedencia, dependencias fijadas y tests.
- Corrección de seguridad: **961c540**, Sharp 0.35.5 y lockfile actualizado.
- Validación de contactos internacionales: **11236fa**.
- Commit documental posterior: informe, checklist actualizado, matriz y evidencia, indicado en la entrega final.
- Respaldo completo mi-contacto-intensive-20261031.bundle, verificado con git bundle verify; contiene la historia necesaria y no necesita importar una base anterior. No incluye node_modules, binarios, secretos, sesiones, bases de datos ni capturas del navegador.
- Restaurar en una copia nueva con `git clone --branch work/intensive-development-20261031 /ruta/mi-contacto-intensive-20261031.bundle mi-contacto-recuperado` y ejecutar `npm ci` bajo Node 24+. No hacer push ni conectar un servicio por restaurarlo.
- Instrucciones detalladas: LOCAL-VALIDATION.md.

## 8. Próxima etapa recomendada

Revisar decisiones de privacidad/retención, destacados y solo por enlace; homologar catálogos nacionales. Después validar Google/R2/PostgreSQL nativo en infraestructura exclusivamente de pruebas y expresamente autorizada. Completar dispositivos físicos, auditoría de permisos/operación y preflight de publicación antes de solicitar activación.

**Cero cambios a Direcciones507/LATAM, Empleos.pa o LeveIA. Cero Railway, PR, push, Actions, despliegues, pagos, suscripciones o mensajes reales.**
