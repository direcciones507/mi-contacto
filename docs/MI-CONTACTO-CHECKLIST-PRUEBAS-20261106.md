# Mi Contacto | Checklist de pruebas reales y correcciones | 2026-11-06

**Fuente:** observaciones del propietario durante pruebas en celular y escritorio. **No declarar una casilla cerrada sin prueba funcional autenticada y despliegue SUCCESS.**

## Confirmado por el propietario
- [x] Aviso de aceptación inicial antes de ingresar.
- [x] Retirar avisos visibles de borrador/revisión jurídica, conservando versión de textos legales. La aprobación legal formal sigue siendo una tarea separada.
- [x] Mostrar fotografía de ejemplo en la tarjeta «Tu nombre aquí».
- [x] Retirar de la tarjeta normal de inicio de sesión «Vincular Google» y «Cerrar todas las sesiones».
- [x] Flujo «Guardar y revisar» → vista previa → «Publicar» confirmado por propietario.

## Perfil y ubicación
- [ ] **PRIORIDAD 1:** «Localidad» como campo de texto directo; quitar «Filtrar localidades» y selector adicional. «Referencia» opcional debajo. Guardar ambos valores en backend, sin perder vínculo territorial país/provincia/distrito ni datos anteriores.
- [ ] Verificar que localidad escrita (ej. «David centro») no bloquee guardar ni publicar; resolver ubicación territorial con seguridad y sin crear entradas duplicadas indiscriminadamente.
- [ ] Teléfono y WhatsApp opcionales; prefijo automático según país; verificar almacenamiento y que no aparezcan contactos vacíos.
- [ ] Confirmar un único perfil por cuenta y persistencia de enlace y QR al editar o cambiar de país.

## Publicación y panel
- [ ] Después de publicar, ocultar formulario y fotografía de edición, mostrar tarjeta y Destacado juntos en escritorio y apilados en celular; permitir «Editar» para volver al formulario.
- [ ] Sustituir «Actualizar saldo» por «Destacar mi perfil» que lleve a compra/canje.
- [ ] Comprobar que la tarjeta gratuita publicada se abre por enlace y QR.
- [ ] Verificar que la publicación es automática sin aprobación ADMIN.

## Directorio: incidencia reportada
- [ ] **PRIORIDAD 1:** Investigar por qué no aparece el perfil gratuito publicado en búsquedas por Panamá, Chiriquí y distrito de David.
- [ ] La implementación actual filtra el directorio a Destacado vigente (directory-query.js, featureExistsSQL). **Cambio comercial solicitado:** mostrar también perfiles gratuitos publicados, con Destacado primero.
- [ ] **Privacidad obligatoria:** el consentimiento actual dice «aparecer ... mientras tenga Destacado activo; la tarjeta gratuita se comparte solo por enlace o QR». NO exponer perfiles gratuitos antiguos por defecto. Actualizar el texto de consentimiento, solicitar aceptación afirmativa para el nuevo alcance y registrar versión/fecha antes de incluirlos.
- [ ] País solo: todos los perfiles elegibles del país; provincia: todos los de la provincia; distrito: solo los del distrito; localidad: filtro más específico; sin depender de buscar manualmente un catálogo.
- [ ] Probar resultados reales con una ficha gratuita y otra Destacada, y con la opción de ocultar ficha.

## Destacado, códigos y pagos
- [ ] Paquetes visibles y comprobados de 1, 5, 10, 15, 20 y 30 días; precios de feature-policy.js.
- [ ] Canje de código vendido/validado: activar Destacado en el único perfil existente; impedir doble canje.
- [ ] Generación ADMIN, asignación/venta manual y consulta de códigos, con trazabilidad.
- [ ] Compra de códigos: cantidad, cotización, botón de prueba, creación de solicitud sin cobro, historial. **La solicitud sin cobro no equivale a pago ni debe emitir códigos vendidos.**
- [ ] Comprobar compra directa simulada de días consecutivos, caducidad, pausa y reanudación.
- [ ] Resolver mensaje «No se pudo completar la operación. Revisa los datos y actualiza» en «Destacar mi perfil» con error técnico específico y verificación de API.
- [ ] Mantener Yappy y otros pagos reales desactivados hasta autorización; no simular confirmación de dinero.

## Pruebas finales y cierre
- [ ] Prueba autenticada de inicio Google y correo verificado.
- [ ] Prueba en celular, tableta y escritorio; revisar comportamiento de formulario, ficha, directorio, ADMIN y códigos.
- [ ] Ejecutar regresión y pruebas de PostgreSQL, verificar despliegue Railway SUCCESS y dominio.
- [ ] Registrar commits, evidencias, fallos, correcciones y fecha de cierre de cada casilla.
- [ ] No abrir acceso público general sin autorización del propietario.
