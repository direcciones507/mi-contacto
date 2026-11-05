# Estado vigente — entorno Railway accesible y verificado

- [x] Sección de fotografías visible desde el inicio: principal gratuita, cuatro espacios de Destacado bloqueados sin vigencia, vista previa, reemplazo y retirada. [Detalle](PHOTO-FORM-20261105.md).

Corrección del acceso del 4 noviembre, noche de Panamá: [ACCESS-FIX-20261105.md](ACCESS-FIX-20261105.md). Formulario con política same-origin y controles CSRF conservados.

4 noviembre 2026. Costo de USD 0.50–1.50 estimado para 48 horas aprobado por el propietario. Informe y evidencias: [RAILWAY-LIVE-20261104.md](RAILWAY-LIVE-20261104.md). Este bloque sustituye los estados históricos inferiores.

- [x] Node 24 y PostgreSQL 18 exclusivos activos, HTTPS temporal funcional.
- [x] Migraciones 001–012 verificadas y catálogo persistido.
- [x] PostgreSQL con TLS verificado; respaldo pg_dump y restauración real comprobados.
- [x] Perfil, fotografía, enlace y QR conservados tras reinicios de PostgreSQL y aplicación.
- [x] Acceso privado temporal del propietario, sesión revocable y protección CSRF; cuenta preparada para crear su perfil.
- [x] Ficha técnica, fotografía y QR de verificación eliminados mediante flujo usuario/ADMIN.
- [x] Límites por servicio: 0.25 vCPU, 0.5 GB RAM, una réplica. Seguimiento cada seis horas programado.
- [x] Cierre de cómputo programado para 6 noviembre 2026 a las 14:02:48 de Panamá; volúmenes conservados.
- [x] CI del commit desplegado: 135 pruebas Node, nueve grupos PostgreSQL y tres recorridos Chromium aprobados; auditoría sin vulnerabilidades conocidas.
- [ ] Google, R2, Yappy UAT y correo reales: faltan credenciales exclusivas. Fotos actuales en volumen privado; pagos y correo desactivados.
- [ ] Aceptación del propietario en dispositivos físicos y revisión territorial/legal.

No se modifica main, DNS, otros proyectos ni se activan cobros reales. La estimación no es un límite de facturación; el almacenamiento conservado puede generar cargos menores tras detener cómputo.

---

# Estado vigente — infraestructura de aceptación, 4 noviembre 2026

Base `33ba696`, rama `work/infrastructure-acceptance-20261104`. Este bloque actualiza los bloqueos técnicos inferiores. Informe: [INFRASTRUCTURE-ACCEPTANCE-20261104.md](INFRASTRUCTURE-ACCEPTANCE-20261104.md). Configuración y accesos: [ACCEPTANCE-ENVIRONMENT-20261104.md](ACCEPTANCE-ENVIRONMENT-20261104.md).

- [x] Runner real Ubuntu 24.04/Node 24/PostgreSQL 16/Chromium disponible y ejecutado en GitHub Actions.
- [x] Suite Node: 133 aprobadas / cero fallidas / cero omitidas en primera ejecución integral aprobada; evidencia y commit exactos en informe.
- [x] PostgreSQL nativo: nueve grupos aprobados, migraciones 001–012, identidad previa, multiconexión, concurrencia, saldo, bloqueo ADMIN, rollback, contención, backup/restauración y reinicio.
- [x] Tres recorridos Chromium 390/820/1440 contra PostgreSQL nativo aprobados. Fotos/Google/proveedor de pagos externos no se presentan como servicios reales.
- [x] Configuración de contenedor/servicio independiente, readiness DB, origen de aceptación opt-in, enlaces/QR del entorno y secreto persistente configurable. Sin despliegue.
- [x] Preflight sin revelar valores; prueba R2 de objeto propio lista; transporte Resend de comprobantes de prueba y destinatarios explícitos preparado, apagado por defecto.
- [ ] PostgreSQL persistente del entorno accesible al propietario: aún no aprovisionado. Las pruebas nativas usan clúster descartable.
- [ ] Google/R2/Yappy UAT/correo reales: requieren recursos/credenciales exclusivos; no se conectaron ni enviaron mensajes reales.
- [ ] Servicio accesible al propietario: pendiente autorización para recursos y despliegue exclusivos; propuesta con dominio temporal sin DNS preparada.
- [ ] Revisión territorial humana, legal/retención, Android físico/Safari y aceptación del propietario.

No se modifica el 90% histórico de construcción local ni se interpreta como aprobación comercial. Último recorrido ampliado aprobado: ejecución 41889443037 / commit `1b6f4f5`, 133 pruebas, nueve grupos nativos y tres recorridos de navegador con checkout. Evidencias finales en el cierre del informe; las simulaciones de proveedor/componente Yappy siguen siendo simulaciones.

---

# Estado vigente — sprint final, 4 noviembre 2026

Este bloque actualiza los estados técnicos inferiores. Se preservan reglas y tarifas aprobadas. Base exacta `04204ea`; trabajo aislado en `work/final-sprint-20261104`. Informe: [FINAL-SPRINT-20261104.md](FINAL-SPRINT-20261104.md).

- [x] Recuperación y regresión completa: 126 pruebas aprobadas, cero fallidas/omitidas, proveedor y correo sintéticos, PostgreSQL WASM.
- [x] Pantalla privada de checkout UAT y enlace condicional del panel; verificados acceso, HTML, CSP y propiedad vía API.
- [x] Migración 012: órdenes UAT propias; precios aprobados; permisos/CSRF; idempotencia; inicialización incierta sin repetición de cargo.
- [x] Callback firmado: dominio/estado/firma/parámetros duplicados; éxito tardío y replay; pago/saldo/comprobante atómicos con rollback probado.
- [x] Activación UAT elegible o saldo íntegro en pausa por moderación/privacidad; sin eludir ADMIN.
- [x] Cola durable de comprobantes de prueba: lease/reintentos/clave estable/revisión manual; borrar destinatarios al eliminar el perfil.
- [x] Auditoría producción: 0 vulnerabilidades conocidas; ningún cobro/envío real ni despliegue.
- [ ] Proveedor UAT real y transporte de correo real pendientes; pantalla de checkout UAT implementada y acceso/HTML comprobados por API, sin recorrido visual actual.
- [ ] Navegador actual: lanzamiento Chromium bloqueado por permisos de sockets; no se reutilizan verdes históricos como actuales.
- [ ] PostgreSQL nativo/concurrencia/reinicio/backup-restauración: bloqueados por ausencia de binarios y permisos del gestor de paquetes.
- [ ] Google/R2 reales: sin configuración MC_* en este proceso; requiere credenciales exclusivas…7152 tokens truncated…et ni las credenciales.
- [ ] Auditar dependencias concretas del repositorio de Direcciones507 para identificar qué módulos pueden reutilizarse directamente y cuáles necesitan adaptación.
- [ ] Elegir estrategia de reutilización (módulos compartidos, librería o copia versionada) y validar licencias, seguridad y despliegue independiente.
- [ ] No declarar «solo cambio visual» como equivalencia técnica total hasta verificar diferencias de esquema, permisos, SEO y pagos.

## Principio rector confirmado — 30-oct-2026
- [x] **Mi Contacto será una adaptación del motor existente de Direcciones507/LATAM:** misma arquitectura funcional de tarjetas, panel, Google OAuth, ADMIN, enlaces, QR, coordenadas, navegación, fotografías y flujo de publicación, siempre que la auditoría confirme compatibilidad.
- [x] **La diferencia principal es la identidad visual y el contenido personal**: Mi Contacto tendrá marca, interfaz, campos y reglas comerciales propios.
- [x] Reutilizar el código probado, no desarrollar un motor paralelo ni modificar el servicio productivo de Direcciones507.
- [ ] Evaluar extracción/copia versionada de módulos y adaptación de esquema, rutas, autorización y almacenamiento aislados antes de programar.

## Navegación transparente y sin redirecciones visibles — decisión 30-oct-2026
- [x] El visitante debe permanecer en `micontacto.online` durante navegación, directorio, perfil, edición y consulta de tarjetas. No enviar al usuario a `direcciones507.com` mediante redirecciones 301/302 como arquitectura principal.
- [x] Conectar la interfaz propia de Mi Contacto con el motor reutilizado de Direcciones507 mediante API/backend, proxy o módulos compartidos, según auditoría técnica. Evitar saltos de dominio, bucles y exposición de URLs internas.
- [ ] Diseñar rutas propias (`/directorio`, `/mi-perfil`, `/p/:codigo`), sesiones y callback OAuth de Google que regrese a Mi Contacto.
- [ ] Validar aislamiento de cuentas, autorización, cookies, CORS, subida de imágenes, URLs/QR estables y pruebas de navegación sin redirecciones inesperadas.
- [ ] Verificar si el core existente soporta multiaplicación de forma segura; no conectar directamente a producción ni reutilizar tokens/cookies entre sitios sin evaluación.

## Panel ADMIN y moderación — decisión 30-oct-2026
- [x] Reutilizar el panel ADMIN de Direcciones507 con presentación prácticamente idéntica, adaptada a Mi Contacto.
- [x] **Dos listados principales:** (1) Suscriptores / tarjetas destacadas pagadas; (2) No suscriptores / tarjetas gratuitas.
- [x] Permitir revisar denuncias contra perfiles de cualquiera de los dos listados y actuar como administrador.
- [ ] Flujo de denuncias: recibir motivo y perfil denunciado, consultar evidencia, revisar, descartar denuncia, bloquear/suspender perfil o eliminarlo según gravedad; mantener un estado de denuncia y notificar según política.
- [ ] Al bloquear, impedir acceso público y aparición en directorio, manteniendo registro para revisión; impedir que el usuario reactive un bloqueo administrativo.
- [ ] Eliminación con confirmación explícita, trazabilidad, autorización ADMIN y política de retención/borrado de fotos y datos; distinguir bloqueo reversible de eliminación irreversible.
- [ ] Registrar auditoría de acciones (administrador, fecha, motivo, perfil) y proteger contra abuso de denuncias.
- [ ] Probar que el estado de pago no impida moderación y que perfiles bloqueados no aparezcan por URL, QR, caché o búsquedas.

## Distintivo gratuito «Foto verificada» — decisión 30-oct-2026
- [x] Incorporar una verificación **gratuita** de fotografía principal para generar confianza, disponible para tarjetas gratuitas y destacadas, sin cargo adicional.
- [ ] ADMIN revisa y aprueba/rechaza solicitudes con criterios documentados; registrar fecha, versión de imagen y responsable.
- [ ] Mostrar distintivo **«Foto verificada»** solo tras revisión efectiva; no afirmar «Identidad verificada» sin un procedimiento real de verificación de identidad.
- [ ] Al cambiar la foto principal, retirar el distintivo y requerir nueva revisión; permitir revocación por ADMIN y ante denuncias.
- [ ] Diseñar el proceso sin exigir ni almacenar documentos de identidad salvo decisión posterior con controles de privacidad y retención.
- [ ] Verificar que el distintivo no dependa del pago ni se otorgue automáticamente a destacados.

## Verificación por WhatsApp exclusivo — decisión 30-oct-2026
- [x] La verificación gratuita de la foto podrá realizarse por **videollamada de WhatsApp** o **video corto enviado a un número exclusivo** de Mi Contacto (número pendiente de definir).
- [ ] Botón «Solicitar verificación» en Mi perfil, con solicitud/código único para relacionar video o llamada con el perfil.
- [ ] ADMIN revisa coincidencia visual con foto principal, aprueba/rechaza y registra decisión sin afirmar identidad legal.
- [ ] Informar previamente finalidad, uso, privacidad, canal WhatsApp y plazo corto de eliminación de videos; no publicar ni redistribuir material de verificación. Definir retención y acceso restringido.
- [ ] Si se modifica la fotografía principal, revocar «Foto verificada» hasta nueva revisión.
- [ ] Evitar requerir documentos de identidad y no exponer el número de verificación en las fichas públicas.
- [ ] Verificación voluntaria y gratuita para ambos planes; no automatizar la aprobación.

## Pagos de Mi Contacto — decisión 30-oct-2026
- [x] Reutilizar el mismo flujo de pago existente de Direcciones507/LATAM: selección, orden, instrucciones/pasarela, confirmación administrativa o automática según proveedor, activación y registro. Adaptarlo a destacado temporal de Mi Contacto.
- [x] Precios destacados ratificados: 1 día USD 1.69; 5 días 7.99; 10 días 14.99; 15 días 21.99; 20 días 27.99; 25 días 31.99; 30 días 34.99.
- [x] Perfil gratuito y verificación de fotografía sin cobro.
- [ ] Auditar el código real de checkout, estados, confirmaciones, idempotencia, vigencia y permisos del motor antes de reutilizarlo. Evitar que un pago de Direcciones507 active servicios de Mi Contacto o viceversa.
- [ ] Reutilizar Yappy para Panamá solo tras comprobar configuración y flujo real; no habilitar PayPal ni métodos LATAM no operativos.
- [ ] Definir expiración exacta, renovación, manejo de pago pendiente/rechazado, reembolsos, cancelaciones, zona horaria, destacado vencido y comprobantes.
- [ ] Probar todo con transacciones simuladas o entorno de pruebas; no cobrar, modificar producción ni activar pasarelas sin autorización.

## Seguimiento técnico en rama aislada — 30-oct-2026
**Fuente de orden:** este checklist maestro; las decisiones más recientes prevalecen sobre casillas antiguas contradictorias. Sin despliegue ni cambios en producción.
- [x] Configuración inicial de ocho países en `countries.js`; parámetros de búsqueda y pruebas escritas.
- [x] Primer prototipo responsive `index.html`, `styles.css`, `app.js`; aún no conectado a backend.
- [x] Funciones puras de normalización, validación y URL de perfil en `profile-slug.js`; pruebas escritas.
- [ ] Ejecutar pruebas en entorno local; no declarar aprobación sin ejecución.
- [ ] Auditar catálogo territorial real de Direcciones507 y conectar región/localidad para los ocho países (actualmente deshabilitados en prototipo).
- [ ] Implementar PostgreSQL independiente con `UNIQUE` para slug, reserva atómica, comprobación previa y conflicto 409. **No asignar sufijos automáticamente**: solicitar al usuario otro nombre de enlace.
- [ ] Conectar registro Google con dominio/sesión aislados y límite un perfil por cuenta.
- [ ] Crear formulario de perfil, fotografía y tarjeta compartible con QR/noindex.
- [ ] Continuar con panel propietario, ADMIN, verificación fotográfica y pagos siguiendo el orden y dependencias de este checklist.
**Regla aprobada:** nombre real puede repetirse; nombre de enlace no. Una vez reservado, URL y QR no cambian al editar perfil.

## Avance técnico: auditoría territorial y esquema inicial (30-oct-2026)
- [x] Auditado en solo lectura el código de configuración de países, esquema propuesto y documentación de Direcciones507/LATAM en `main`.
- [x] Hallazgo: configuración de ocho países y etiquetas administrativas existente; **catálogo completo de regiones/localidades no identificado** en el árbol de código revisado. Documentado en `docs/AUDITORIA-GEOGRAFIA-Y-BASE-20261030.md`.
- [x] Preparado `db/001_initial.sql` para base PostgreSQL independiente: cuentas Google, perfil único por cuenta, slug único, estados y coordenadas. **Archivo no ejecutado**.
- [ ] Obtener y validar catálogo territorial para los ocho países; conectar filtros reales.
- [ ] Ejecutar migración y pruebas en PostgreSQL descartable, incluyendo concurrencia y privacidad.
- [ ] Implementar endpoint de disponibilidad de slug y alta transaccional, con error 409 para duplicados.

## Corrección funcional: directorio geográfico frente a direcciones GPS (30-oct-2026)
- [x] **Mi Contacto no debe tratar coordenadas GPS como mecanismo principal de búsqueda.** Direcciones507/LATAM genera enlaces de dirección desde país y coordenadas; Mi Contacto requiere búsqueda de personas por país → provincia/departamento/estado → ciudad/localidad, más nombre/profesión.
- [x] W Anuncios (`https://www.wanuncios.com/`, `https://panama.wanuncios.com/`) es **referencia de UX geográfica**, no fuente de verdad ni autorización para copiar masivamente sus datos. Su portada muestra países y provincias; el formulario de Panamá selecciona país y provincia. No se verificó catálogo completo de ciudades.
- [ ] Obtener catálogos territoriales verificables, con cobertura y licencia adecuadas, para ocho países; modelar relaciones jerárquicas, nombres y variantes locales. Validar especialmente provincias/comarcas de Panamá, no depender de una lista abreviada de clasificados.
- [ ] Implementar búsqueda en base de datos por país/región/localidad y texto, sin requerir coordenadas; GPS separado y opcional para «Cómo llegar».
- [ ] Sustituir opciones de muestra y filtros deshabilitados por datos reales; probar resultados, cambios de país y niveles vacíos.

## Avance técnico de directorio territorial — 30-oct-2026
- [x] Fuente externa candidata identificada: GeoNames, descarga por país, CC BY con uso comercial y atribución; contrastar nombres y divisiones con fuentes oficiales antes de importar. geoBoundaries gbOpen CC BY 4.0 puede complementar divisiones. **GADM no apto para uso comercial sin permiso**. Fuentes: https://www.geonames.org/export/ , https://www.geoboundaries.org/api.html , https://gadm.org/license.html .
- [x] Archivo `db/002_geography.sql` preparado con regiones jerárquicas y localidades por país, sin datos inventados. No ejecutado.
- [x] Archivo `directory-query.js` preparado con búsqueda parametrizada por país, región, localidad y texto, solo perfiles activos, sin coordenadas; pruebas escritas en `tests/directory-query.test.mjs`.
- [x] `package.json` configura Node ESM y comando de pruebas; **pruebas todavía no ejecutadas**.
- [ ] Revisar coherencia de identificadores geográficos y persistencia del perfil antes de conectar SQL al servicio (actualmente perfil almacena nombres; catálogo usa IDs).
- [ ] Importar datos con licencia y procedencia verificadas para los ocho países, resolver cambios territoriales y homónimos.
- [ ] Ejecutar pruebas locales y en PostgreSQL descartable, después conectar API y UI.

## Preparación de importación GeoNames (30-oct-2026)
- [x] Documentación de formato GeoNames y atribución contrastada con la fuente oficial.
- [x] Script offline `scripts/import-geonames.mjs` para generar CSV de localidades pobladas por país, con nombres de divisiones admin1/admin2 y sin escribir base de datos.
- [x] Prueba de muestra escrita en `tests/import-geonames.test.mjs` y guía `docs/IMPORTACION-GEONAMES.md`.
- [ ] Descargar y procesar los ocho extractos, revisar errores y homologar localidades/municipios/comarcas con fuentes oficiales.
- [ ] Ejecutar pruebas y validar CSV; no declarar cobertura completa ni importación realizada.
- [ ] Construir cargador validado de CSV a tablas territoriales aisladas y conectar filtros UI/API.

## Validación territorial, seguimiento (30-oct-2026)
- [x] Existe `scripts/validate-geonames-csv.mjs`, validador offline de cabecera, códigos, duplicados y divisiones faltantes.
- [x] Existe `tests/validate-geonames.test.mjs`, prueba escrita para un CSV válido y uno con identificador duplicado.
- [ ] Ejecutar todas las pruebas Node y corregir cualquier fallo encontrado; las pruebas escritas no equivalen a pruebas aprobadas.
- [ ] Resolver antes de integrar la API la discrepancia entre filtros por IDs de región/localidad y columnas de texto en perfiles; no permitir homónimos o cruces de país.
- [ ] Obtener extractos territoriales reales de ocho países y realizar revisión humana, sin cargar datos de muestra a producción.

## Regla de calidad obligatoria: TODO VERDE (30-oct-2026)
**Aprobado por el propietario:** no confundir código guardado con código validado. Mantener semáforo y evidencia por componente y etapa.
- **VERDE:** prueba ejecutada, aprobada, con fecha, comando, resultado y referencia de commit/entorno.
- **PENDIENTE:** código sin prueba ejecutada, integración faltante, o servicio aún no desplegado.
- **ROJO:** error confirmado, prueba fallida, migración incompatible o regresión. Corregir antes de cerrar la etapa afectada.
- GitHub: verificar estado de rama, cambios, comprobaciones y CI cuando esté permitido; no abrir PR ni ejecutar workflows que disparen despliegues sin autorización.
- Local: ejecutar suites de pruebas y registrar resultados; pruebas escritas no cuentan como verdes hasta ejecutarlas.
- PostgreSQL: probar migraciones, unicidad, permisos, aislamiento y reversibilidad en base descartable; nunca en base productiva.
- Railway: revisar estado y despliegue **solo lectura** cuando haya entorno de Mi Contacto autorizado; sin reconectar servicios, activar despliegues ni gastar minutos por iniciativa propia.
- UI: comprobar móvil, tableta, escritorio, navegación, búsquedas, privacidad, noindex, errores y QR antes de cerrar cada fase.
- Mantener un registro de bloqueos y pendientes. No afirmar «todo verde» si existe una etapa sin pruebas o sin despliegue.
- Puerta de salida: no avanzar a integración o lanzamiento si hay fallos críticos en componentes dependientes; sí se puede trabajar en tareas aisladas sin ocultar pendientes.

## Corrección de integridad del buscador (30-oct-2026)
- [x] Detectada y corregida en código la unión ambigua por nombres entre perfiles y localidades: `directory-query.js` ahora une mediante `region_id` y `locality_id` y filtra país/estado activo.
- [x] Preparada `db/003_profile_geo_ids.sql` para agregar referencias de región/localidad a perfiles en PostgreSQL independiente.
- [ ] **Validación pendiente:** ejecutar migraciones en base descartable, comprobar que la localidad pertenezca a la región seleccionada y evitar homónimos; no desplegar todavía.
- [ ] Ejecutar suite Node. El entorno de ejecución disponible no pudo acceder a GitHub por DNS; no declarar verde la suite sin prueba real.

## Integridad territorial reforzada (30-oct-2026)
- [x] Preparada `db/004_geo_integrity.sql`: una región hija no puede pertenecer a otro país; una localidad seleccionada en perfil debe pertenecer exactamente a la región y país del perfil. Se refuerza en PostgreSQL con claves foráneas compuestas.
- [ ] Ejecutar 001→004 en PostgreSQL descartable y probar casos negativos: región de otro país, localidad de otra región, localidad de otro país y región hija incompatible.
- [ ] Verificar disponibilidad de catálogo real, importación y filtros en UI.
- [ ] Suite Node sin ejecutar: la máquina de pruebas no resuelve `github.com`; **no afirmar verde** sin evidencia.

## Decisión de secuencia de trabajo (30-oct-2026)
- [x] El propietario autoriza **seguir construyendo todos los módulos antes de la etapa integral de pruebas previa a publicación**. Esta decisión sustituye la idea de detener cada avance hasta ejecutar todas las pruebas, **pero no autoriza publicar, desplegar, activar CI que despliegue ni ejecutar migraciones productivas**.
- [x] Preparada lógica `profile-service.js` para crear un borrador, normalizar slug, validar país y manejar conflictos de unicidad con HTTP 409. Pruebas escritas en `tests/profile-service.test.mjs`.
- [ ] Conectar adaptador transaccional real a PostgreSQL aislado y autenticar el `accountId` en servidor; no confiar en un ID enviado por navegador.
- [ ] Antes de publicar: pruebas integrales Node, PostgreSQL, seguridad, UI, privacidad, SEO, Railway y regresiones, con evidencias y semáforo verde. **No confundir pruebas escritas con ejecutadas.**

## Autenticación aislada, fase de construcción (30-oct-2026)
- [x] `profile-postgres.js` preparado: inserción de perfil y reserva de slug en una sola transacción, rollback y liberación de conexión; pruebas escritas en `tests/profile-postgres.test.mjs`.
- [x] `auth-session.js` preparado: cookie propia `mc_session`, firma HMAC-SHA256, expiración, verificación temporal constante y secreto obligatorio; pruebas escritas en `tests/auth-session.test.mjs`.
- [ ] Conectar OAuth Google real, verificar ID token/estado/nonce, establecer cuenta autenticada en servidor y proteger CSRF; no habilitar login hasta auditar el flujo completo.
- [ ] Evaluar revocación de sesiones y rotación de secretos, protección de endpoints y pruebas de seguridad.
- [ ] Pruebas Node y PostgreSQL pendientes de ejecución; Railway y producción sin cambios.

## Decisión aprobada: enlace único por país (30-oct-2026)
- [x] Cada país tiene su propio espacio de nombres: `micontacto.online/pa/ana-sofia` y `/cr/ana-sofia` son enlaces distintos y válidos.
- [x] Preparada migración aislada `db/005_country_scoped_slugs.sql`: unicidad `(country_code,slug)` en perfiles y reservas; preserva reservas previas asignándoles el país del perfil.
- [x] Actualizados `profile-slug.js`, `profile-postgres.js`, `profile-service.js` y sus pruebas para usar el país en URL, reserva y respuesta.
- [ ] Antes de publicar: ejecutar migraciones 001-005 y pruebas de duplicados dentro de país, reutilización entre países, cambios de país, colisiones simultáneas, QR y rutas web.
- [ ] Definir política de cambio de país para perfiles ya publicados: conservar URL anterior mediante redirección o mantener país del enlace fijo; nunca romper enlaces existentes.

## Comprobación de nombre por país (30-oct-2026)
- [x] `slug-availability.js`: verificación previa por país y slug normalizado, con mensaje de duplicado aprobado y sin renombrado automático.
- [x] `tests/slug-availability.test.mjs`: casos escritos para ocupado en Panamá/libre en Costa Rica, duplicado local, entradas inválidas y consulta parametrizada.
- [ ] Conectar consulta al formulario y endpoint autenticado, con límites de solicitudes; la comprobación previa es orientativa y el índice UNIQUE por país decide al guardar para evitar carreras.
- [ ] Ejecutar pruebas en PostgreSQL descartable antes de publicar.

## Aviso inmediato al solicitar publicación en otro país (30-oct-2026)
- [x] `publication-service.js`: prepara solicitud de publicación con país, región, localidad y nombre de enlace. Si PostgreSQL detecta nombre ocupado en ese país, devuelve HTTP 409, campo `linkName` y mensaje de duplicado sin modificar automáticamente el nombre.
- [x] `tests/publication-service.test.mjs`: cuatro pruebas escritas de duplicado, solicitud a revisión, ubicación obligatoria y protección de URL publicada.
- [ ] Implementar adaptador transaccional `requestPublication`, comprobar propiedad de cuenta, validar pertenencia territorial y conectar formulario para mostrar el aviso junto al campo de enlace.
- [ ] Conservar URL y QR publicados al cambiar ubicación; la publicación en otro país requiere un flujo explícito sin romper el enlace original.
- [ ] Ejecutar pruebas y validar UI/SQL en entorno descartable antes de publicar.

## Arquitectura de motor reutilizado e identidad independiente (30-oct-2026)
- [x] Decisión: reutilizar patrones y componentes auditados de Direcciones507, adaptados a Mi Contacto, sin referencias visibles ni atribución de marca al usuario final.
- [ ] Auditar licencias, dependencias y módulos antes de copiar código; no reutilizar credenciales, tokens ni datos de usuarios.
- [ ] Motor propio de Mi Contacto con PostgreSQL, almacenamiento de fotos, OAuth, sesiones, administración, QR y URLs aislados.
- [ ] Comprobar que HTML, metadatos, emails, Open Graph, QR, rutas, errores y panel ADMIN no muestran Direcciones507.
- [ ] Integración entre plataformas solo mediante interfaces explícitas y autorizadas; no conectar directamente a producción de Direcciones507.
- [ ] Pruebas de aislamiento, regresión, permisos y marca antes de publicar.

## Motor independiente, configuración inicial (30-oct-2026)
- [x] `platform-config.js`: contrato de dominio, esquema, cookie y prefijo de almacenamiento propios.
- [x] `tests/platform-config.test.mjs`: cuatro pruebas escritas, no ejecutadas.
- [ ] La comprobación de configuración NO demuestra que la base de datos sea físicamente independiente; verificar infraestructura y credenciales antes de conectar.
- [ ] Resolver modelo de múltiples países por cuenta: el esquema actual permite solo un perfil por cuenta; no afirmar que se pueden publicar varios países hasta diseñar esa ampliación y su protección de URLs/QR.
- [ ] Integrar OAuth, almacenamiento, API, formularios, pagos, panel ADMIN y ejecutar pruebas integrales.

## Tercera etapa: perfiles de una cuenta en múltiples países
- [x] Migración `db/006_account_profiles_by_country.sql`: sustituye unicidad global de cuenta por `(account_id,country_code)`; una cuenta, máximo un perfil por país.
- [x] `profile-service.js`: respuesta de conflicto específica para cuenta y país.
- [x] `tests/multi-country-account.test.mjs`: prueba escrita de enlaces PA/CR de una misma cuenta; actualizada prueba de colisión local.
- [ ] Ejecutar SQL en PostgreSQL descartable, incluyendo 001-006, validar constraints y regresión de reservas.
- [ ] Conectar registro, Mi perfil y publicación; una segunda publicación no debe modificar el enlace o QR del primer país.
- [ ] Comprobar interacción con estados de revisión y límites de ocho perfiles por cuenta.

## Revisión de continuidad autónoma (31-oct-2026)
- [x] Inspección solo lectura del servicio Railway `ad507-developer` en `leveia-staging`: el panel está desplegado, su dominio corresponde al servicio y el inicio de sesión verifica un hash `scrypt` de `AD507_OWNER_PASSWORD_HASH`.
- [ ] Acceso del propietario al panel: bloqueado por `INVALID_LOGIN`; restablecimiento de contraseña pendiente de decisión y operación manual segura. No se modificaron variables ni se reinició Railway.
- [ ] Antes de encargar Mi Contacto al agente, comprobar que el registro de proyectos autorizados incluya `direcciones507/mi-contacto`, que tenga permisos mínimos y que el límite de presupuesto/tiempo no active CI ni despliegues. La existencia del panel no demuestra que pueda trabajar de forma desatendida.
- [ ] No contar como avance funcional de Mi Contacto la recuperación del panel o la preparación del agente; las suites Node y SQL siguen pendientes de ejecución.
