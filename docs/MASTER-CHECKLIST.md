# MI CONTACTO | Checklist maestro

**Actualizado:** 30 de octubre de 2026  
**Estado:** documentación inicial y arranque del proyecto, sin despliegue.

## 1. Producto y directorio
- [x] Marca y repositorio independientes de Direcciones507/LATAM/LeveIA.
- [x] Reutilización conceptual de componentes de tarjetas digitales, sin afectar sistemas existentes.
- [x] Navegación país → región/provincia/departamento/estado → localidad → contactos.
- [ ] Definir países habilitados al lanzamiento, búsqueda, filtros y paginación.
- [ ] Definir qué datos personales se muestran en los listados públicos.

## 2. Tarjetas y privacidad
- [x] Tarjeta gratuita en directorio con una fotografía, enlace directo y QR.
- [x] Modalidad de pago solo por enlace, excluida de listados y búsquedas internas.
- [x] El propietario elige expresamente la modalidad; no incluirlo en el directorio sin elección.
- [x] Tarjetas individuales con `noindex` y excluidas del sitemap.
- [x] Un enlace recibido puede abrirse y reenviarse; «solo por enlace» no significa acceso autenticado.
- [ ] Definir campos exactos, permisos de edición, moderación y eliminación.
- [ ] Definir tratamiento de datos personales, consentimiento, menores y protección frente a scraping.
- [ ] Evitar que las páginas indexables del directorio expongan información personal en resultados de Google.

## 3. Oferta comercial
- [x] Registro y mantenimiento de ficha gratuita en directorio.
- [x] Destacados de pago incluyen fotos adicionales durante el destacado.
- [x] Precios aprobados: 1 día $1.69; 5 días $7.99; 10 días $14.99; 15 días $21.99; 20 días $27.99; 25 días $31.99; 30 días $34.99.
- [x] Estrategia de volumen: costo diario decreciente en plazos largos, sin prorrateo lineal exacto.
- [ ] Precio y duración del producto «solo por enlace».
- [ ] Cantidad máxima de fotos y qué ocurre al finalizar el destacado.
- [ ] Definir ubicación, rotación, cupos y criterios de los destacados.
- [ ] Definir pago, impuestos, vencimiento, reembolsos y renovación; no habilitar cobros reales.

## 4. Plataforma y desarrollo
- [x] Repositorio localizado: `direcciones507/mi-contacto`.
- [ ] Revisar y decidir visibilidad del repositorio: actualmente público.
- [ ] Definir stack, licencia y si se reutiliza código mediante copia autorizada o librería.
- [ ] Diseñar esquema y almacenamiento **aislados** de las bases de producción existentes.
- [ ] Crear interfaz responsive, autenticación, perfil, edición, enlace opaco y QR.
- [ ] Implementar directorio geográfico, búsqueda interna y modos de visibilidad.
- [ ] Implementar panel ADMIN, controles de abuso y pruebas.
- [ ] Integrar pagos solo tras definir proveedor y obtener autorización.
- [ ] Pruebas SEO/noindex, seguridad, accesibilidad, dispositivos, concurrencia y respaldos.
- [ ] Lanzamiento solo con aprobación expresa.

## 5. AD507 Developer
- [ ] Definir ejecutor autónomo DeepSeek, presupuesto máximo verificable, tiempo límite y reintentos.
- [ ] Mantener trabajo aislado y prohibir cambios productivos sin aprobación.

## Siguiente decisión
**Precio y vigencia del enlace exclusivo de pago.** También faltan campos de la tarjeta, cantidad de fotos y países del MVP.

## Registro
- 30-oct-2026: consolidación de decisiones y aprobación de toda la escala de precios.
- 30-oct-2026: inicio de documentación en el nuevo repositorio. Ningún despliegue ni integración de pagos.

## Separación de producto aprobada (30-oct-2026)
- La tercera tarjeta del mockup («solo por enlace», ejemplo de consultor) **no se desarrollará en Mi Contacto** como esa propuesta visual.
- El diseño de perfil profesional se reserva para **Empleos.pa**, con nombre de servicio provisional «Perfil Profesional Público», ficha indexable y compartible, sujeto a consentimiento del titular.
- Mantener por ahora la decisión comercial anterior de Mi Contacto «solo por enlace de pago» como **pendiente de reconciliar**: el usuario indicó retirar la tercera tarjeta del diseño, pero no confirmó expresamente si elimina por completo esa modalidad comercial. No implementarla hasta aclararlo.
- Ningún cambio en el repositorio ni producción de Empleos.pa por esta nota.

## Diseño visual aprobado — 30 de octubre de 2026
- [x] El usuario aprobó el mockup con directorio móvil, ficha personal y comparación de tarjeta gratuita/destacada, estética azul y blanco.
- [x] **Solo dos tipos de tarjeta:** gratuita en directorio y destacada de pago. **Eliminar completamente** la modalidad de tarjeta privada de pago «solo por enlace» de Mi Contacto; el concepto de perfil profesional de la tercera tarjeta se documentó aparte en Empleos.pa.
- [x] **No mostrar correo electrónico** ni botón de correo en las fichas de Mi Contacto.
- [x] Tarjeta gratuita: una foto de perfil, nombre, profesión/oficio, localidad, descripción y contacto WhatsApp/llamada según autorización del titular; enlace/QR compartible.
- [x] Tarjeta destacada: mismo contenido más cuatro fotos adicionales (**cinco en total contando la principal**), distintivo Destacado y prioridad en directorio durante vigencia contratada.
- [x] Precios destacados aprobados sin cambios: 1/5/10/15/20/25/30 días = USD 1.69/7.99/14.99/21.99/27.99/31.99/34.99.
- [x] Fichas individuales con noindex; el directorio puede ser público y rastreable, con consentimiento.
- [ ] Diseñar componentes responsive a partir del mockup aprobado y validar en dispositivos.
- [ ] Definir el comportamiento al vencer el destacado: volver a una foto visible sin borrar las cuatro adicionales sin política aprobada.
- [ ] Resolver en documentación anterior cualquier mención a la modalidad solo por enlace como producto vigente: **esta decisión posterior la reemplaza**.

## Panel, navegación y pausa — 30 de octubre de 2026
- [x] Reutilizar como referencia el flujo «Mi cuenta» de Direcciones507: acceso con Google, tarjetas administrables, editar, copiar enlace, QR y estado; sin acoplar producción.
- [x] Tarjeta personal: botón desplegable **Cómo llegar** con Google Maps, Waze y Uber donde corresponda, usando ubicación proporcionada con consentimiento. No mostrar correo electrónico.
- [x] Control **Pausar / Volver a publicar** desde el panel: al pausar, retirar la ficha de listados y deshabilitar su vista pública; conservar datos para restauración por propietario. Debe excluirse del sitemap y búsquedas internas mientras esté pausada.
- [x] Pausar no implica reembolso ni congelación de los días pagados de destacado; el reloj de vigencia continúa.
- [ ] Definir si se permite **uno o dos perfiles** por cuenta (no permitir creación ilimitada); imponer límite en servidor y panel.
- [ ] Aclarar frase «cada vez que lo generan se paga» frente a la regla previamente aprobada de **tarjeta básica gratuita y destacado de pago**. No introducir cobro de creación hasta aprobación expresa.
- [ ] Definir si se permite reactivar después de vencer el destacado: propuesta volver a tarjeta básica sin recuperar prioridad ni fotos extra visibles.
- [ ] Diseñar flujo OAuth Google, recuperación de estado, propiedad, edición, revisión ADMIN, auditoría y protección contra abuso.
- [ ] Confirmar tratamiento de la URL/QR cuando se pausa: se recomienda página de ficha no disponible, sin revelar datos personales.

## Confirmación de edición de perfil — 30-oct-2026
- [x] El titular entra a **Mi perfil personal** desde su cuenta con Google y puede editar directamente foto principal, nombre, profesión/oficio, descripción, ubicación y datos de contacto.
- [x] Guardar cambios sin generar una tarjeta nueva ni cobrar por cada edición; mantener enlace y QR estables.
- [x] La tarjeta básica sigue siendo gratuita y permite una foto. El destacado de pago habilita cuatro fotos adicionales mientras esté vigente.
- [x] Desde el mismo panel puede consultar estado, copiar enlace/QR, pausar y reactivar.
- [ ] Definir límites de edición y moderación, almacenamiento de fotos extra tras vencer destacado y límite de uno o dos perfiles por cuenta.

## Dominio y límite de cuenta — 30-oct-2026
- [x] **Exactamente un perfil personal por cuenta Google**; imponer unicidad en base de datos y servidor, no solo en interfaz.
- [x] El propietario puede actualizar el mismo perfil cuantas veces necesite: foto, teléfono/WhatsApp, descripción y coordenadas GPS cuando se traslade, sin crear otro perfil ni alterar su URL/QR.
- [x] No cobrar por editar o cambiar coordenadas; la ficha básica sigue gratuita, solo se cobra el destacado.
- [x] **Dominio elegido: `micontacto.online`**; mostrado en búsqueda de Namecheap con promoción de USD 0.98/año para clientes elegibles. **Compra, titularidad y DNS no verificados**; no asumir dominio adquirido.
- [ ] Confirmar compra y precio de renovación, luego preparar DNS y SSL solo con autorización.
- [ ] Validar consentimiento para mostrar ubicación exacta; permitir ubicación aproximada cuando corresponda y prevenir exposición involuntaria de domicilios.

## Investigación de almacenamiento Railway / R2 — 30-oct-2026
- [x] Inspección **solo lectura** de Railway: proyecto `amused-enchantment`, servicio `ad507-core`, PostgreSQL independiente.
- [x] El servicio `ad507-core` tiene nombres de variables `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`, `R2_BUCKET`, `AD507_R2_CONFIGURATION_VERIFIED`. **No se leyeron ni copiaron valores secretos**.
- [x] `ad507-core` no tiene volumen montado para fotos; PostgreSQL dispone de volumen para datos de base, no para archivos de imágenes.
- [ ] Revisar en código la integración actual de subida/lectura R2 y su compatibilidad con las fotos de Mi Contacto.
- [ ] Verificar en Cloudflare la política del bucket, cuotas, costos, CORS, acceso público/privado y organización de objetos; Railway por sí solo no acredita estos detalles.
- [ ] Decidir entre **bucket R2 separado (recomendado)** o prefijo aislado en bucket existente, con permisos mínimos, sin reutilizar credenciales de producción.
- [ ] Definir límites, compresión, borrado, protección contra abuso, fotos del destacado al expirar y consentimiento del titular.
- [ ] Mantener la base de datos, servicio y despliegue de Mi Contacto independientes de Direcciones507; cero cambios en producción.

## Decisión arquitectónica ratificada — 30-oct-2026
- [x] **Reutilizar el mismo motor funcional de Direcciones507/Direcciones LATAM** para Mi Contacto; no construir de cero autenticación, panel, tarjetas, fotos, enlaces, QR, coordenadas, navegación ni ADMIN cuando se puedan adaptar componentes existentes.
- [x] El principal cambio será la **presentación visual** y la adaptación de reglas específicas de personas: una cuenta Google = un perfil, básica con una foto, destacada con cinco fotos, sin correo visible, botón Cómo llegar, noindex individual.
- [x] Reutilización de código **sin modificar producción**, manteniendo dominio, servicio, base de datos, permisos y almacenamiento lógicamente aislados. La integración R2 existente se auditará para reaprovechar el adaptador, no necesariamente el bucket ni las credenciales.
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
