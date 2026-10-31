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
