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
