# Cierre funcional privado desplegado — 6 noviembre 2026

Código desplegado: `1c2922276dc2466eb2f9c2e52971bf6b03128774`, rama `work/functional-close-20261106`, descendiente de `bd0bfa4`.

- [x] Publicación automática del perfil normal, sin aprobación ADMIN previa; consentimiento obligatorio antes de publicar.
- [x] Vista previa de primera fotografía y ficha completa; selección, reemplazo y retirada conservados.
- [x] Paquetes privados de 1/5/10 días, precios oficiales y auditoría PRUEBA SIN COBRO; duplicados concurrentes rechazados, cero órdenes de pago.
- [x] Códigos ADMIN, inventario, venta manual, canje único, vigencias, pausa/reanudación y vencimiento comprobados en PostgreSQL nativo desechable y navegador.
- [x] Galería de cuatro fotos adicionales condicionada a saldo válido; directorio y controles de acceso conservados.
- [x] Aviso de entrada independiente: modal, aceptación firmada, rechazo y política de origen corregida sin relajar CSRF.
- [x] Acceso unificado, registro/recuperación y controles de seguridad/vinculación para sesiones autenticadas restaurados.
- [x] Moderación posterior, denuncias, motivos, restricciones, apelación, auditoría y eliminación autorizada probadas en fixtures desechables.
- [x] Actions 42255523664 SUCCESS: 194 regresiones, 62 pruebas nativas y 18 recorridos Chromium; 0 fallidas/omitidas en los grupos automatizados finales.
- [x] Railway SUCCESS: `c6902eb5-1baa-4b19-9e19-32aa1b46b00e`. No se repitieron 016/017 ni se crearon servicios/bases/volúmenes. Respaldo anterior verificado por SHA y ledger.
- [x] HTTP real: salud, aviso, acceso, rechazos externos, protección de roles y arranque OAuth; correo real entregado mediante Resend existente con credencial restringida específica.
- [ ] Completar inicio Google personal y recorridos autenticados del propietario en el sitio real, conservando su perfil. No certificados todavía.
- [ ] Verificación/recuperación por correo desde el buzón del propietario y pruebas en dispositivos físicos. Transporte real entregado no equivale a completar esos recorridos.
- [ ] Apertura pública, aprobación legal y pagos reales: fuera de este cierre privado. No extender la ventana de consumo sin autorización.

**Alcance de las casillas:** los recorridos completos automatizados usan datos sintéticos y PostgreSQL desechable. La comprobación del sitio real se documenta por separado. Las secciones históricas inferiores no sustituyen este estado.

Detalle y guía: `docs/FUNCTIONAL-CLOSE-20261106.md`. Evidencia: `docs/evidence/functional-close-20261106/verified-release.json`.

---

## Avance directo sin Work: restricciones de ficha pública (6 noviembre 2026)

Rama: `work/production-benefits-20261106`, basada en el código probado `20cce3e`. Se implementaron controles de presentación para contactos, navegación, QR, compartir y fotos extra, y una restricción de servidor para el QR público sin Destacado. **Cambios guardados en GitHub, no desplegados ni certificados por CI.**

- [x] Ocultar botones, QR y compartir en HTML de perfil gratuito.
- [x] Bloquear URL pública QR si no hay Destacado vigente.
- [x] Ocultar fotos adicionales en HTML gratuito.
- [x] Aviso explicativo para el titular/visitante en ficha gratuita.
- [ ] Revisar protección de URLs directas de fotos extra, datos expuestos por API, cachés y enlaces sociales.
- [ ] Verificar que todos los datos puedan guardarse sin Destacado y que reaparezcan tras pago verificado/canje; probar vencimiento por reloj del servidor.
- [ ] Añadir pruebas de regresión específicas y ejecutar CI sobre esta nueva rama.
- [ ] Integrar reglas comerciales recientes del checklist móvil y criterios de producción.
- [ ] Preflight, respaldo Railway, migraciones 016/017, despliegue privado y pruebas reales: PENDIENTES; no tocar infraestructura hasta autorización segura de revisión consolidada.

# Cierre integral preparado — rama work/integral-close-20261106

## Verificación manual de fotografías por WhatsApp y potestades ADMIN (6 noviembre 2026)

**Decisión comercial del propietario:** ante denuncias de fotos falsas, ADMIN contacta a la persona por WhatsApp y solicita un video u otra evidencia proporcional. La plataforma NO necesita carga ni almacenamiento de videos de verificación. Registrar únicamente estado, fecha de contacto, plazo comunicado, resultado y notas mínimas; no guardar videos ni documentos sensibles.

- [ ] Desde denuncia/perfil, ADMIN puede abrir WhatsApp del titular si este proporcionó número válido; no exponer ese número al denunciante.
- [ ] Estados: pendiente de contacto, esperando verificación, verificado, no verificado, resuelto. ADMIN procurará contactar al titular dentro de aproximadamente 48 horas desde la denuncia y documentará el intento, respuesta y evidencia mínima. Las 48 horas son objetivo de contacto/revisión, no vencimiento automático para contestar ni motivo de sanción automática. Comunicar al titular un plazo razonable para aportar prueba y registrar su resultado. No presumir culpabilidad por una denuncia.
- [ ] ADMIN puede mantener perfil, pedir corrección, retirar fotografías cuestionadas, ocultar perfil, suspender o bloquear cuenta, y retirar perfil por incumplimiento, con motivo obligatorio y auditoría. Separar bloqueo reversible de borrado definitivo irreversible.
- [ ] Borrado definitivo: autorización ADMIN explícita, confirmación reforzada, respeto de solicitudes del titular, políticas de privacidad y obligaciones de conservación legal. No borrar datos probatorios necesarios para investigar de forma automática.
- [ ] Permitir apelación y revisión de sanciones; comprobar permisos ADMIN en API, nunca solo en interfaz.
- [ ] Pruebas: denuncia infundada mantiene perfil; falta de respuesta tras plazo permite medida proporcional; verificación satisfactoria cierra denuncia; bloqueo impide acceso apropiado; borrado definitivo solo con confirmación y reglas legales.

## Moderación ADMIN: denuncias, investigación y decisiones (6 noviembre 2026)

**Regla del propietario:** una denuncia por sí sola NO elimina ni suspende un perfil. ADMIN revisa motivo, referencias y evidencia, comprueba hechos y decide. Si la denuncia no se sustenta, desestimarla y mantener el perfil. Medidas proporcionales con motivación, auditoría y apelación; conservar salvaguardas urgentes para material ilegal o peligro grave.

**Inspección del código:** views.js ya declara pestañas ADMIN «Denuncias», «Apelaciones», «Auditoría», «Solicitudes de eliminación», «Usuarios»; dashboard.js consulta /api/admin/reports, muestra motivo/evidencia, permite revisar perfil/fotos y tiene acciones DISMISS/HIDE/SUSPEND/CORRECTION/SENSITIVE_HOLD/DELETE. No decir que no existe: verificar implementación real, controles de rol, persistencia y pruebas; mejorar UX y notificaciones pendientes.

- [ ] ADMIN: búsqueda y filtros de personas/perfiles por nombre, código, país, localidad, estado y denuncias asociadas.
- [ ] Bandeja de denuncias con contador/avisos al ADMIN, fecha, categoría, motivo, evidencia/referencia, estado y vínculo al perfil; avisos no deben exponer datos sensibles.
- [ ] Investigación: revisar perfil, fotos y antecedentes necesarios, sin divulgar datos del denunciante; registrar decisión motivada y fecha.
- [ ] Desestimar denuncia infundada manteniendo el perfil; cuando se confirme infracción, aplicar medida proporcional (solicitud de corrección, ocultación, suspensión o retirada según política). Proteger contenido grave conforme al procedimiento legal.
- [ ] Historial de moderación, apelaciones, acceso exclusivo ADMIN verificado en servidor, prevención de borrados accidentales y pruebas de roles.
- [ ] Diferenciar retirar perfil por incumplimiento de eliminación definitiva a petición del titular, con autorizaciones y retención legal apropiadas.
- [ ] Pruebas autenticadas en Railway después de despliegue seguro: denuncia de prueba, revisión ADMIN, desestimación sin pérdida de perfil; denuncia justificada, medida y apelación. No marcar completado por mera existencia del botón.

## Acceso privado del propietario y simplificación de autenticación (captura 6 noviembre 2026)

- [ ] Separar tres conceptos: acceso de clientes, puerta de pruebas privadas existente y acceso ADMIN del propietario. No mezclar enlaces «Continuar con Google», «Entrar a pruebas privadas», selector «Acción» y formulario correo en una tarjeta gigante.
- [ ] El propietario solicita enlace ADMIN independiente, no mostrado en navegación pública, con su **credencial actual sin rotarla** durante pruebas. No generar ni revelar contraseña, ni desactivar controles; comprobar en código el mecanismo ADMIN real antes de tocar rutas. No asumir que la clave privada de aceptación equivale a autenticación ADMIN.
- [ ] Tras acceso ADMIN autenticado, dirigir a panel ADMIN con generador de códigos, lotes, ventas manuales WhatsApp, auditoría, moderación. Cliente solo ve su panel de perfil y compras. Reforzar permisos en servidor y API, no solo ocultar el enlace.
- [ ] El acceso cliente debe ser tarjeta compacta estilo Empleos.pa con Google/correo y contraseña, registro y recuperación, mostrando con claridad si el proveedor de correo todavía no está conectado. No exponer modos de prueba en producción pública.
- [ ] Antes de apertura pública, revisar seguridad de credenciales y autorizar expresamente cualquier rotación. Probar accesos de propietario, cliente y anónimo, y que una URL ADMIN conocida no concede acceso.

## Cierre comercial y separación de paneles (instrucción del propietario, 6 noviembre 2026)

**Criterio de terminado:** no basta un commit. Cada cambio debe superar pruebas, desplegarse en el Railway existente y verificarse en micontacto.online desde dispositivos reales. Mantener despliegue privado hasta autorización de apertura; migración 016 solo tras preflight y respaldo íntegro verificado. No alterar datos ni pagos reales sin autorización.

- [ ] **Panel cliente**: Mi perfil, edición, foto principal, vista previa completa, solicitar publicación, Destacar mi perfil con «Ya tengo un código», «Comprar días consecutivos» y «Comprar códigos» a USD 1.90 por unidad. Mostrar únicamente funciones de cliente.
- [ ] **Panel ADMIN independiente**: usuarios, moderación, aprobaciones, generador seguro de códigos individuales y por lotes, reservas, venta manual por WhatsApp, registro de pagos manuales, historial y auditoría. Prohibir por servidor acceso a rutas y API ADMIN para usuarios comunes. No confundir el panel con la página del cliente.
- [ ] **Navegación por rol**: no mostrar ADMIN a usuarios comunes; conservar acceso ADMIN para el propietario y redirecciones correctas. Probar cuenta cliente, ADMIN y usuario sin sesión.
- [ ] **Tarjeta de acceso**: reemplazar el botón aislado por tarjeta centrada con Google, correo/contraseña, registro y recuperación, tomando referencia visual de Empleos.pa; reutilizar la autenticación existente, sin duplicar usuarios.
- [ ] **Fotografía y publicación**: comparar el flujo funcional de Direcciones507, seleccionar foto, vista previa encuadrada de tarjeta completa, guardar y solicitar publicación con moderación; sección comercial visible debajo después del guardado/publicación según estado.
- [ ] **Ciclo obligatorio**: verificar → corregir → probar → guardar en GitHub → desplegar autorizado → verificar en micontacto.online → corregir según pruebas del propietario. Reportar por separado código terminado, desplegado y comprobado en producción.

---

## Captura escritorio: acceso desde Mi perfil (6 noviembre 2026)

- [ ] Sustituir la pantalla ancha y vacía «Mi perfil personal / Accede a tu cuenta / Entrar con Google o correo electrónico» por una tarjeta de autenticación centrada inspirada en Empleos.pa, con marca exclusiva Mi Contacto.
- [ ] Incluir Google, correo y contraseña, mostrar contraseña, registro y recuperación dentro del flujo real existente `/acceso`; no crear cuentas ni autenticación paralela. Reutilizar las rutas y componentes existentes, comprobar que el retorno lleva a Mi perfil.
- [ ] Mejorar pie de página y espaciado, sin enlaces cortados ni enormes vacíos; móvil ancho casi completo, tableta/escritorio tarjeta de ancho moderado.
- [ ] Probar estados sin sesión, con sesión, error Google, correo deshabilitado por falta de proveedor, móvil/tableta/escritorio. No declarar acceso real completado sin credenciales y pruebas.

## Pendientes visuales reportados con capturas reales de celular (5 noviembre, 23:37 Panamá)

**Origen:** cuatro capturas del propietario en micontacto.online. **Estado: PENDIENTE de implementación y pruebas**. Estas imágenes corresponden a la versión anterior desplegada 33cbcdc; no atribuirlas a la revisión 0182f88 sin verificarla. La migración 016 sigue bloqueada por preflight y respaldo no verificados. No desplegar esta rama sin autorización específica.

- [ ] **Menú móvil:** cerrar al seleccionar cualquier enlace (Crear mi perfil, Mi perfil, Directorio, Planes), al pulsar fuera del menú, al navegar/volver y con Escape. No debe quedar superpuesto al contenido ni exigir tocar de nuevo el icono. Mantener accesibilidad (aria-expanded, foco, teclado), sin bloquear desplazamiento.
- [ ] **Cabecera de Mi perfil:** reducir espacios y controles redundantes. Mostrar Sesión activa y un solo Cerrar sesión; trasladar Acceso y contraseña y Cerrar todas las sesiones a Seguridad y acceso. Mostrar Crear mi perfil solo cuando todavía no exista, sin duplicarlo al editar.
- [ ] **Home / tarjeta de ejemplo:** ampliar el ancho útil de «Tu nombre aquí» en móvil y tableta, conservar márgenes laterales y legibilidad; equilibrar escritorio sin desbordamiento. Verificar anchos 390, 820 y 1440 px.
- [ ] **Foto principal:** comparar en modo lectura el componente de Direcciones507 y reutilizar solo patrón compatible, sin tocar su repositorio. Reemplazar panel excesivo, selector nativo en inglés, «Guarda primero tu borrador» y botón separado «Guardar fotografía» por selector compacto con previsualización real, encuadre lleno (object-fit: cover), reemplazar y retirar. Crear borrador internamente al guardar si se necesita; no eliminar fotos anteriores ni saltar aprobación ADMIN.
- [ ] **Flujo de perfil:** completar datos + descripción + foto + consentimientos → Guardar → Ver vista previa de la tarjeta completa → Confirmar solicitud de publicación (revisión ADMIN). Evitar publicar sin confirmación; conservar validaciones y privacidad.
- [ ] **Destacar después de publicación:** debajo del perfil guardado/solicitado mostrar claramente «Ya tengo un código», «Comprar días consecutivos» (1/5/10/15/20/25/30 con descuento) y «Comprar códigos» (1, 2, 3 o más a USD 1.90 cada uno). No confundir códigos guardables de un día con paquetes de días corridos. Mantener pagos reales apagados.
- [ ] **Validación:** ejecutar pruebas y capturas de móvil, tableta y escritorio, registrar commit, CI, diferencias respecto a 0182f88 y estado real del despliegue. No marcar completado por estar solo en GitHub.

---


Este bloque distingue código probado de despliegue. La instrucción actual exige autorización expresa antes de publicar; no aplicar 016 ni desplegar esta rama todavía.

- [x] Formulario en orden: datos, descripción, foto, consentimientos y Guardar y publicar. Borrador interno, foto seleccionable antes de guardar; revisión ADMIN conservada.
- [x] Una foto gratuita, cuatro adicionales solo con saldo Destacado; archivos anteriores conservados.
- [x] Cuenta privada puede vincular Google conservando perfil y ADMIN, solo tras correo verificado, contraseña correcta, sesión y OAuth comprobados; enlace auditado y sin fusión automática.
- [x] Usuarios y compras consultables por ADMIN; ayuda y mostrar contraseña disponibles.
- [x] Seguridad de sesiones separada en /acceso. Encabezado compacto y opciones secundarias plegadas.
- [x] Generador ADMIN de 1–100 códigos, lotes, copia individual/lote, inventario, reserva, venta manual con referencia de pago, anulación, historial paginado y exportación de registros visibles.
- [x] Código de un día a USD 1.90, sin vencimiento mientras se guarda. Generar/vender no activa; canje único crea saldo y respeta revisión/consentimiento.
- [x] Pedidos de 1/2/3 o cantidades mayores; precio validado en servidor, entrega tras confirmación Yappy TEST y reintentos idempotentes. Comprobante en outbox con reintento y clave estable.
- [x] Migración 016 aditiva: inventario y pedidos; corrige incompatibilidad de tarifas nuevas con CHECK histórico sin reescribir compras anteriores.
- [x] CI 0182f88 SUCCESS: 185/185 de regresión, 51/51 en PostgreSQL nativo y nueve recorridos de navegador; respaldo/restauración e inventario cifrado comprobados.
- [x] 185 pruebas locales aprobadas; recorridos de correo y fotos/moderación/códigos en Chromium local. Los proveedores de pago/correo son de prueba.
- [ ] Aplicar 016 y desplegar después de autorización, preflight y respaldo verificado del PostgreSQL existente.
- [ ] Google real: el titular debe completar la autorización y verificar retorno/perfil; no se reemplazan ni fusionan identidades automáticamente.
- [ ] Correo real: falta MC_RESEND_API_KEY, configuración de habilitación y destinatarios de ensayo; reutilizar Resend existente, sin cuenta nueva.
- [ ] R2 real: faltan MC_R2_ACCOUNT_ID, MC_R2_ACCESS_KEY_ID, MC_R2_SECRET_ACCESS_KEY y activación controlada de MC_STORAGE=r2. Preservar fallback local y prefijo mi-contacto/.
- [ ] Yappy UAT real y posteriormente Live requieren credenciales/autorización exclusivas. Live sigue desactivado.
- [ ] Aprobación legal final, pruebas en dispositivos físicos y verificación posdespliegue. No se declara producción lista.

## Orden definitivo de Mi perfil aprobado por el propietario (5 nov 2026)

- [ ] Encabezado compacto: **Mi perfil**, estado **Sesión activa** y un solo botón **Cerrar sesión**. Quitar de esta pantalla **Cerrar todas las sesiones**, **Crear mi perfil** redundante y el enlace visible **Acceso y contraseña de mi cuenta**; conservar gestión de seguridad en su pantalla correspondiente.
- [ ] Formulario único: nombre completo, enlace personal, profesión/oficio, categoría, país, provincia/departamento/estado, distrito/municipio, localidad, teléfono/WhatsApp, pin Google Maps y coordenadas opcionales, **descripción**, inmediatamente **subir fotografía principal** (casilla única con vista previa/reemplazo/eliminación), luego los tres consentimientos **Autorizo**, y al final **Guardar y publicar**.
- [ ] Eliminar la sección independiente inferior **Fotografías de tu perfil**, su encabezado, textos y botones redundantes. No eliminar las fotografías almacenadas ni las validaciones y consentimiento legales del servidor.
- [ ] Debajo del formulario, sección **Destacar mi perfil**: **Ya tengo un código** (canje de un día), compra de días consecutivos (1/5/10/15/20/25/30) y compra de códigos independientes (5/10/20); distinguir claramente ambos productos, con precios aprobados y Yappy Live apagado.
- [ ] Corregir el flujo para que el usuario pueda seleccionar la foto antes de pulsar **Guardar y publicar**. Si es perfil nuevo, crear primero el registro internamente, subir la foto y solicitar revisión sin pasos visibles redundantes; no marcar publicado hasta aprobación ADMIN.
- [ ] Comprobar vista y controles en celular, tableta y computadora, guardar en GitHub, desplegar al Railway existente y verificar el dominio real por cada corrección. No crear servicios nuevos ni tocar Direcciones507 o pagos Live.

## Corrección Home — tarifas comerciales (5 nov 2026)

- [x] **Código guardado:** `index.html` muestra $1.90 como precio inicial, siete precios actualizados para días consecutivos y paquetes de 5/10/20 códigos independientes a $1.90 por código. Commit `2b11dd1`.
- [x] Fuente de tarifas del backend `feature-policy.js` actualizada y expectativas del checkout de prueba ajustadas en `tests/payment-runtime.test.mjs` (commits `3e43992` y `0f50c71`).
- [ ] **PENDIENTE:** ejecutar pruebas CI de estos commits, desplegar la nueva revisión en el Railway existente y comprobar visualmente la Home y el checkout en `micontacto.online`. No declarar publicada por estar en GitHub. Yappy Live sigue desactivado.

## Regla operativa obligatoria — guardar, probar y publicar (5 nov 2026)

- [ ] **Cada corrección:** implementar → guardar commit en GitHub → ejecutar pruebas → desplegar en el Railway EXISTENTE → verificar el cambio en `https://micontacto.online` → registrar evidencia y estado en este checklist. Repetir por cada cambio; un commit sin despliegue verificado **NO está terminado**.
- [ ] Preservar usuarios, perfiles, fotografías, PostgreSQL, sesiones, dominio y seguridad; no crear infraestructura nueva ni modificar Direcciones507/LATAM. Si falla una prueba o despliegue, detener el cierre de esa corrección y reportar el bloqueo, sin declarar éxito.
- [ ] **Yappy Live:** preparar y probar sin cobros reales, pero NO activar hasta autorización explícita del propietario.

# DECISIONES VIGENTES DEL PROPIETARIO — 5 NOV 2026 (PRIORIDAD SOBRE TARIFAS Y UX HISTÓRICAS)

> **Estado:** requisitos aprobados para implementar y verificar, NO equivalen a funcionalidades ya desplegadas. Las tarifas históricas y referencias a espacios fotográficos bloqueados más abajo quedan sustituidas por este bloque. No activar Yappy Live ni cobros reales sin autorización expresa. No crear otra infraestructura, borrar fotos ni modificar Direcciones507/LATAM. Trabajar en el Railway y rama existentes; preservar PostgreSQL, perfiles y sesiones.

## A. Acceso y tarjeta «Mi perfil»

- [ ] Una sola tarjeta de acceso centrada, limpia, adaptable a móvil/tableta/escritorio, basada visualmente en el login de Empleos.pa pero con logo, azul y nombre **Mi Contacto**. Google, correo/contraseña, mostrar contraseña, registro y recuperación operativos; sin enlaces de pruebas privadas ni elementos técnicos para clientes. Verificar inicio Google real, persistencia y vinculación sin perfiles duplicados.
- [ ] Corregir botones y acciones que actualmente no funcionan en la edición de «Mi perfil». Un solo botón principal **Guardar y publicar**, sin botón duplicado «Guardar tu perfil» ni opción visible «Guardar como borrador»; conservar guardado seguro interno si fuera necesario.
- [ ] Orden definitivo del formulario: **nombre completo → nombre del enlace → profesión u oficio → categoría → país → provincia/departamento/estado → distrito/municipio/cantón → ciudad/localidad → teléfono con prefijo internacional → WhatsApp → enlace del pin de Google Maps → coordenadas opcionales en UN campo (latitud, longitud) → descripción breve → fotografía principal gratuita → Guardar y publicar**. Adaptar dinámicamente etiquetas y jerarquías territoriales por país. «Buscar por localidad» es del directorio, no un control confuso en edición.
- [ ] Foto principal con una sola casilla compacta, pulsable, similar a Direcciones507, selector de archivo, vista previa, reemplazo y eliminación. Las **cuatro fotos adicionales** aparecen solo con Destacado vigente; no mostrar casillas bloqueadas al perfil gratuito. Preservar fotos existentes.
- [ ] Quitar avisos redundantes de «leer antes de subir foto», mayoría de edad, términos y políticas en el editor cuando ya se aceptaron en registro; **mantener y verificar** consentimientos legales obligatorios, mayoría de edad y validaciones del backend.

## B. Destacado: dos modalidades diferentes, tarifas aprobadas

**Compra de vigencia consecutiva (días corridos desde activación confirmada):**

| Días | Precio USD |
| ---: | ---: |
| 1 | 1.90 |
| 5 | 8.90 |
| 10 | 16.90 |
| 15 | 24.50 |
| 20 | 31.50 |
| 25 | 35.90 |
| 30 | 39.00 |

**Compra de códigos independientes (cada código activa UN día, USD 1.90 por unidad):**

| Códigos | Precio USD |
| ---: | ---: |
| 5 | 9.50 |
| 10 | 19.00 |
| 20 | 38.00 |

- [ ] **Los códigos comprados/generados se guardan sin vencimiento por almacenamiento**; no inician vigencia hasta su canje. Cada código único se canjea **una sola vez**, en la fecha que el titular elija; permite días no consecutivos. Registrar emisión, estado, canje y vigencia. No confundir un paquete de 5 códigos con 5 días corridos.
- [ ] Cliente: sección Destacado separada del perfil gratuito, con **Comprar días consecutivos**, **Comprar códigos** y **Ya tengo un código**. Mostrar estado y vigencia, códigos disponibles y usados, sin inventar pagos aprobados.
- [ ] ADMIN: **localizar y reutilizar el generador de códigos ya desarrollado** antes de crear otro. El propietario introduce una cantidad libre (p. ej. 1, 5, 10, 20), genera ese número de códigos únicos de un día, copia uno o todo el lote y los comparte/vende por **WhatsApp**, sin depender de Yappy. Llevar registro de lotes, inventario disponible, entregado, canjeado, usuario/perfil y fechas; permisos ADMIN, prevención de duplicados y reutilización. Códigos sin vender siguen disponibles.
- [ ] Actualizar la fuente única de tarifas, interfaz, cálculo de pedidos, comprobantes, pruebas, documentación y checkout de ensayo; **$1.69 y la tabla anterior quedan reemplazados**. Mantener el perfil gratuito y la verificación de foto sin cobro.

## C. Condición de producción y pagos

- [ ] Dejar todo lo demás **operativo y comprobado en micontacto.online**: Google, correo y recuperación reales (Resend), R2 aislado, perfil, fotos, directorio territorial, Maps/QR, códigos, ADMIN, denuncias/moderación, seguridad, PostgreSQL, sesiones y pruebas en celular/tableta/escritorio. No dar por cerrado un proveedor sin prueba real ni aprobación necesaria.
- [ ] Preparar **Yappy como ÚLTIMA integración**, con órdenes, selección de modalidad, códigos, callbacks verificados, idempotencia, pagos fallidos/reintentos, activación, vencimientos y comprobantes; pruebas sin cobros reales. **Yappy Live desactivado hasta autorización expresa del propietario**. La venta y canje manual de códigos ADMIN sí deben funcionar antes.
- [ ] Cierre verificable: cambios en commit, CI, pruebas reales, despliegue Railway existente, checklist actualizado y reporte claro de cualquier paso que solo pueda autorizar el propietario.

---

# Origen oficial — estado vigente

Informe: [OFFICIAL-ORIGIN-CLOSE-20261106.md](OFFICIAL-ORIGIN-CLOSE-20261106.md).

- [x] Dominio micontacto.online verificado, certificado válido y puerto 3000 configurado.
- [x] MC_ORIGIN oficial y acceso privado de aceptación preservado con opción explícita; usuarios, sesiones y datos separados.
- [x] Dominio temporal limitado a salud técnica y redirección de navegación; escrituras rechazadas.
- [x] Dominio oficial real: tres tamaños de navegador, acceso privado/ADMIN/logout, origen/CSRF, HTTPS/HSTS y salud; cero errores JS, 15 migraciones y TLS remoto, sin cambios de datos.
- [x] 178 pruebas locales aprobadas, cero fallidas/omitidas. CI 42141575097 SUCCESS, PostgreSQL nativo y seis recorridos aprobados. e38d1ce desplegado SUCCESS.
- [ ] Configurar valores privados existentes Google/R2/Resend y callback oficial de Google; sin cuentas nuevas.
- [ ] Certificar Google, R2, recepción de correo/notificaciones y recorridos físicos reales; pendientes por falta de configuración externa.

Los bloques previos son históricos. No se declara producción aprobada por conectar el dominio.

---

# Reutilización de proveedores existentes — 5 noviembre 2026

Informe vigente: [REUSE-EXISTING-PROVIDERS-20261105.md](REUSE-EXISTING-PROVIDERS-20261105.md).

- [x] Comparadas implementaciones Google/R2/correo de Direcciones507 con Mi Contacto, sin cambios productivos.
- [x] Preparado uso de cuentas existentes, bucket con espacio mi-contacto/ y remitente específico bajo dominio verificado; sin cuentas o recursos nuevos.
- [x] Usuarios, sesiones, base y archivos de Mi Contacto separados; rutas ajenas rechazadas antes de tocar R2.
- [x] Transición desde volumen privado preserva originales y permite limpieza en ambos destinos.
- [x] 176 pruebas locales aprobadas, cero fallidas/omitidas. CI 42132276508 SUCCESS: PostgreSQL nativo y seis recorridos de navegador aprobados; 6f74acf desplegado SUCCESS.
- [ ] Añadir callback en Google existente y trasladar valores por canal privado: Railway devuelve secretos ocultos, no permite su lectura/traslado al agente.
- [ ] Pruebas externas reales de OAuth, R2 y correo, una vez configurados los valores y destinatario autorizado.

Este bloque sustituye la exigencia histórica de cuentas/bucket/dominio nuevos. Se permite reutilizar los existentes según las opciones explícitas aprobadas por el propietario. No convierte pruebas sintéticas en reales.

---

# Terminación técnica — estado verificable 5 noviembre 2026

Informe vigente: [TECHNICAL-COMPLETION-20261105.md](TECHNICAL-COMPLETION-20261105.md). Conserva integración final, base, datos y recursos existentes.

- [x] Construcción de acceso Google/correo, verificación, recuperación, vinculación, sesiones y perfil único conservada.
- [x] Plantillas HTML/texto y remitente exclusivo; transporte confirmado, validación e idempotencia. Trabajo de contraseña concurrente acotado.
- [x] Preflight admite Google o correo configurado; política de privacidad actualizada para ambos.
- [x] Código 9f2a26a desplegado con SUCCESS; CI exacto 42130842667 SUCCESS; 173 pruebas locales, PostgreSQL nativo y seis recorridos de navegador aprobados; auditoría cero vulnerabilidades.
- [x] Logout de sesión de prueba verificado en Railway; cuenta/perfiles/datos conservados.
- [x] Acceso privado original y sesión ADMIN reales comprobados en tres tamaños de navegador, con CSRF y rechazo externo, sin cambios de datos.
- [x] Perfiles, directorio, QR/Maps, fotografías/marca/permisos, denuncia, moderación, apelación, consentimientos, auditoría y eliminación cubiertos por regresión existente.
- [ ] Google/R2/correo reales: requieren credenciales exclusivas y remitente verificado. No se sustituyen por proveedores simulados.
- [ ] Pruebas físicas y aceptación legal/territorial del propietario; Yappy y dominio definitivo pendientes de su conexión.

Los bloques siguientes son históricos; no convierten simulaciones en integraciones externas verificadas ni sustituyen los resultados del informe vigente.

---

# Integración final y aceptación desplegada — 5 noviembre 2026 (Panamá)

Rama consolidada `work/final-integration-acceptance-20261105`, versión desplegada `826bdee`. Contiene `2928339` y `0fb2277` por historial directo; sin conflictos. Informe: [FINAL-INTEGRATION-ACCEPTANCE-20261105.md](FINAL-INTEGRATION-ACCEPTANCE-20261105.md).

- [x] Autenticación construida, mejoras visuales y funcionalidades anteriores reunidas sin reconstrucción. Código de acceso privado y secretos conservados.
- [x] Migración 015 validada en PostgreSQL nativo: datos anteriores, sesión, identidad y perfil preservados; conexiones distintas, confirmación concurrente de un uso, unicidad/rollback, carrera login/restablecimiento, reinicio y pg_dump/pg_restore reales aprobados.
- [x] CI exacto `826bdee`: 169 pruebas WASM + 33 pruebas nativas, cero fallidas/omitidas; seis recorridos Chrome contra PostgreSQL nativo en 390/820/1440. Google y correo de prueba sintéticos.
- [x] Presupuesto estimado original y recursos comprobados; proyección observacional aproximada USD 0.11/48 h, no factura ni tope garantizado. No ampliación de recursos ni servicios.
- [x] Cierre original 6 noviembre 2026 14:02:48 Panamá, confirmado por el arranque real; guardia previa a DB impide extensión no autorizada.
- [x] Railway existente: despliegue `0228d3a0-b922-4a43-abed-5f0ace24a84f`, SUCCESS; respaldo previo de 4,710,650 bytes, archivo legible, migración 015 aplicada sobre PostgreSQL 18.6 con TLS verificado.
- [x] Persistencia de la cuenta de aceptación tras reinicio confirmada; aplicación y PostgreSQL online, una réplica cada uno, sin trabajo pendiente. PostgreSQL no reiniciado ni reemplazado en esta entrega.
- [x] Railway público real: ocho comprobaciones HTTP esperadas, incluidos sesión 401 y recursos CSS/JS idénticos a Git; tres recorridos de aviso y acceso privado, sin introducir código, sin errores JS ni desbordamiento. Capturas guardadas.
- [ ] Propietario: recorrido autenticado en Railway con su código original y dispositivos físicos; carga real de fotos/marca/ADMIN con esa sesión aún no certificada.
- [ ] Configuración exclusiva del propietario: Google OAuth, correo/remitente verificado y R2 real. Siguen desactivados; volumen privado existente activo. Pagos reales apagados.
- [ ] Aprobación territorial y jurídica final para producción; producción sin cambios.

Este bloque sustituye los pendientes históricos de integración/migración/despliegue inferiores; no sustituye las validaciones exclusivas del propietario.

---

# Mejora visual — 5 de noviembre de 2026 (Panamá)

Rama `work/visual-forms-20261105`, base `2928339`, conserva la construcción de acceso por correo de la rama anterior sin desplegarla.

- [x] Consentimientos: enlaces legales separados, tres declaraciones con separación uniforme y etiquetas táctiles; acción principal azul y rechazo secundario. Textos, versión, digest, API y obligatoriedad conservados.
- [x] Fotografías: botones compactos con mínimo táctil de 44 px, acciones agrupadas, previsualización uniforme, identificación de principal gratis y adicionales Destacado; instrucciones de borrador y bloqueo visibles.
- [x] Rejilla adaptable: 390 px una columna, 820 px dos y 1440 px tres; sin desbordamiento ni errores JS en Chromium.
- [x] 24 pruebas funcionales pertinentes aprobadas, cero fallidas/omitidas. Tres recorridos visuales/funcionales con consentimiento obligatorio, borrador, vista previa, reemplazo, retirada y bloqueo de galería; también denuncia y moderación sin regresión.
- [x] Evidencias y reproducción: `docs/evidence/visual-forms-20261105/` y `scripts/visual-forms-browser.mjs`.
- [x] **CIERRE VISUAL EN ACEPTACIÓN (5-nov-2026):** los ajustes de botones, enlaces legales, consentimientos y cinco tarjetas fotográficas del commit `0fb2277` están incluidos por ascendencia directa en `826bdee`, desplegado en Railway con estado SUCCESS. Los recursos `/runtime.css` y `/dashboard.js` coincidieron byte por byte con Git; tres recorridos públicos reales (390/820/1440 px) confirmaron enlaces separados, acción principal azul, consentimientos obligatorios, ausencia de desbordamiento y errores JS. Los flujos autenticados de fotografías conservaron validación automatizada en PostgreSQL nativo aislado.
- [ ] **Aceptación física restante:** comprobar la presentación y acciones autenticadas de las fotografías con la sesión original del propietario en celular y tableta reales. No confundir esta validación con la mejora visual ya integrada y desplegada.

Sin cambios de autenticación, PostgreSQL, permisos, políticas legales, reglas de Destacado ni recursos. No se activaron pagos, infraestructura ni despliegues.

---

# Cierre verificable vigente — 5 de noviembre de 2026 (Panamá)

Rama `work/continuous-close-20261105`, base remota real `3b4a8a5` posterior a `c8e8398`. Código nuevo: `3a1b7a5`. Este bloque sustituye las casillas históricas contradictorias para los componentes comprobados. Informe: [CONTINUOUS-CLOSE-20261105.md](CONTINUOUS-CLOSE-20261105.md).

- [x] Acceso privado existente: corrección de pestañas/refresco conservada; origen, cookie, CSRF, caducidad, credencial y ADMIN conservados. Versión desplegada `3b4a8a5`, Railway `SUCCESS` y ambos servicios online comprobados en lectura.
- [x] Construidos registro por correo, verificación previa a habilitar la identidad, login, recuperación de un uso, cambio y revocación de sesiones; envío desactivado por defecto.
- [x] Vinculación explícita Google/correo comprobando titularidad y misma sesión; no fusiona identidades de cuentas distintas ni duplica el perfil de la cuenta vinculada.
- [x] Corregida confirmación desde el enlace en la misma pestaña; se procesa hashchange y se retira el token de la barra de dirección.
- [x] Migración aditiva 015 preparada; checksum, startup y respaldo previo actualizados. No aplicada a PostgreSQL remoto.
- [x] Regresión final: 168 pruebas aprobadas, 0 fallidas/omitidas; PostgreSQL WASM local. Auditoría de producción: 0 vulnerabilidades conocidas.
- [x] Tres recorridos Chromium 390/820/1440: acceso privado mediante formulario, multipestaña, CSRF, consentimientos, fotografías principal/galería bloqueada, vista previa, reemplazo/retirada, marca, denuncia, ADMIN, apelación y auditoría.
- [x] Tres recorridos Chromium 390/820/1440: registro, verificación en la misma pestaña, login, recuperación, cambio y revocación. Correo sintético, sin envíos reales.
- [x] Directorio/territorio, perfil/QR estable, Maps, privacidad y persistencia local cubiertos por regresión. PostgreSQL remoto responde readiness; logs de la versión desplegada confirman TLS y persistencia tras reinicio.
- [ ] Nueva rama y migración 015 aún no desplegadas; Google/correo/R2 reales continúan sin configuración exclusiva. No presentar el nuevo acceso por correo como disponible en Railway.
- [ ] Migración 015 y concurrencia en PostgreSQL nativo actual: pendientes; el ejecutor disponible es root y el arnés nativo exige entorno no root existente. No sustituir esta prueba por WASM.
- [ ] Recorrido autenticado de Railway: requiere que el propietario abra su sesión original; no se leyó, generó ni restableció su código.
- [ ] Aprobación jurídica/territorial y pruebas en Android/iPad físicos siguen pendientes del propietario.

No se desplegó a producción ni se modificaron infraestructura, recursos, credenciales, datos, pagos u otros proyectos. No se ejecutaron Actions ni se activaron envíos reales.

---

# Unificación vigente — fotografías y aceptación existente

Rama `work/photos-unification-20261105`, derivada de `1febb25` en `work/infrastructure-acceptance-20261104` (contiene `161d178`). Integración selectiva de `1487ee1`. Informe: [UNIFICATION-PHOTOS-20261105.md](UNIFICATION-PHOTOS-20261105.md).

- [x] Conservar acceso privado, corrección del 403, servidor, PostgreSQL, volúmenes, sandbox existente y límites de recursos.
- [x] Cinco espacios visibles desde inicio; botón directo de borrador, foto principal gratuita, adicionales restringidas, vista previa/reemplazo/retirada.
- [x] Aviso de edad/derechos de imágenes/contenido prohibido adaptado y textos legales en borrador. Sin exoneración total ni denuncia automática.
- [x] Consentimiento versionado en migración 013; 012 de sandbox conservada.
- [x] Respaldo privado previo preparado, sin crear otra base; actualización territorial con preservación de perfiles referenciados.
- [x] 145 pruebas aprobadas / 0 fallidas y tres recorridos Chromium locales. Auditoría de producción sin vulnerabilidades conocidas.
- [ ] Confirmar actualización únicamente en el Railway existente y reporte de persistencia/migración.
- [ ] Recuperar sesión privada para subir una foto desde el enlace actualizado: el código introducido no fue aceptado; no se modificaron credenciales.
- [ ] Revisión legal definitiva y dispositivos físicos siguen a cargo del propietario.

No crear infraestructura, modificar main/DNS/otros proyectos ni activar cobros reales.

---

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

## Protección y moderación — 4 de noviembre de 2026 (Panamá)

Esta sección sustituye estados históricos contradictorios para este alcance. Base conservada: `50eb6ac`, descendiente del entorno que contiene `161d178`; las mejoras selectivas de `1487ee1` ya estaban integradas. Se mantiene un perfil por cuenta y enlace/QR estable al mudarse.

- [x] Aviso previo al acceso Google, tres declaraciones sin marcar y rechazo sin continuar.
- [x] Consentimiento también obligatorio en aceptación con textos en borrador; versión, digest, declaraciones y fecha persistidos.
- [x] Políticas de comunidad, fotografías, menores, identidad, denuncias, suspensión y apelación; borradores jurídicos de Panamá.
- [x] Foto principal gratuita y cuatro espacios condicionados a Destacado; vista previa, reemplazo, eliminación y continuación al guardar borrador.
- [x] Marca de agua central en los píxeles de cada entrega, incluyendo imágenes anteriores y miniaturas. Original normalizado privado; no existe entrega HTTP sin marca.
- [x] Denuncia pública con motivos, descripción y evidencia textual opcional; CSRF, límites persistentes, duplicados y privacidad.
- [x] ADMIN: revisión, ocultación, suspensión de cuenta, solicitud de correcciones, descarte, retirada de acceso y retención sensible.
- [x] Apelaciones privadas y auditoría; aceptar apelación devuelve a borrador, sin publicación automática.
- [x] Retención sensible impide entrega incluso a ADMIN y detiene limpieza de esos archivos; escalamiento humano sin envío automático a autoridades.
- [x] 155 pruebas automatizadas aprobadas, 0 fallidas; tres recorridos de regresión Chromium y tres nuevos recorridos de protección en 390/820/1440. PostgreSQL WASM local, no dispositivos físicos.
- [x] Auditoría de dependencias de producción: cero vulnerabilidades conocidas.
- [ ] Confirmar despliegue terminal SUCCESS y migración 014 en el servicio de aceptación existente.
- [ ] Completar recorrido autenticado en Railway con sesión/código privado del propietario; no restablecer credenciales ni crear accesos alternativos.
- [ ] Antes de producción: aprobación jurídica, responsable, contacto, retención/plazos y escalamiento; Google/R2 reales y dispositivos físicos.

## Cierre de acceso privado — 5 de noviembre de 2026

- [x] Base funcional `c8e8398`, sin alterar infraestructura ni código privado.
- [x] POST anterior identificado como 401; no confundir con rechazo de origen 403. Causa exacta histórica no determinable por el mensaje genérico.
- [x] Reproducción con código sintético: la segunda pestaña invalidaba la primera aun con código correcto; corregido conservando caducidad y protecciones.
- [x] Diagnósticos enumerados del servidor sin secretos; mensajes de recuperación de cookies/formulario sin exponer el código.
- [x] 159 pruebas aprobadas; cero fallidas. Tres recorridos autenticados Chromium locales por formulario: Android, iPad y escritorio; fotos, marca, denuncias y ADMIN.
- [ ] Registrar despliegue SUCCESS y persistencia del servicio existente.
- [ ] Completar recorrido autenticado Railway con el acceso original del propietario, sin generar ni recuperar credenciales alternativas.

## Corrección de acceso y fotografías — 6 noviembre 2026
- [x] Formulario previo a Google usa Referrer-Policy same-origin; conserva validación estricta de Origin y token firmado.
- [x] Un solo acceso a /acceso con Google, correo, registro y recuperación; correo sin proveedor se muestra deshabilitado.
- [x] Una casilla gratuita; cuatro adicionales solamente con Destacado vigente, sin borrar fotografías almacenadas.
- [ ] Google: completar inicio de sesión real con autorización del titular; no confundir el acceso privado con Google.
