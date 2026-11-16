# Mi Contacto — Fase 1: cuenta y múltiples publicaciones

## Alcance aprobado (16 noviembre 2026)
- Una sola cuenta autenticada con nombre completo, correo electrónico y teléfono.
- Panel «Mis publicaciones» bajo la cuenta, con títulos propios por publicación.
- Botón «+ Nueva publicación» abre el MISMO formulario existente en modo creación, vacío.
- Al abrir una publicación existente, reutilizar el MISMO formulario en modo edición con sus datos.
- Reutilizar SIN REDISEÑAR la tarjeta actual del panel, con colores, botones, estilos, efectos y responsive idénticos en móvil, tablet y escritorio.
- Controles existentes observados en captura: Editar datos, Copiar enlace, Ocultar ficha, Destacar mi perfil, Abrir ficha y QR, Eliminar mi perfil definitivamente. Mantener «Tengo un código» en el flujo de destacar; compra pública deshabilitada.
- Cada publicación tiene título, fotos, descripción, contacto, ubicación, enlace, QR, estado, destacado y vigencia independientes.
- Publicaciones ilimitadas por cuenta; perfiles existentes conservados.

## Separación técnica obligatoria
- Cuenta y publicación son entidades distintas. No replicar cuenta ni autenticación por anuncio.
- La cuenta debe ser dueña de una colección de publicaciones, no de una sola ficha.
- Reutilizar el componente de formulario y el de tarjeta actuales, pasando identificador de publicación y modo creación/edición.
- La vista «Mis publicaciones» debe cargar solo publicaciones del usuario autenticado.
- Ocultar/mostrar, editar, destacar y eliminar afectan únicamente al anuncio elegido.
- Eliminar una publicación no equivale a eliminar la cuenta; preservar confirmaciones y reglas de moderación.
- No copiar fotos ni datos de otra publicación al crear una nueva.
- No desplegar cambios ni migrar datos sin pruebas y respaldo.

## Límite de esta fase
Preparar interfaz y adaptación de componentes existentes; la persistencia, rutas de publicación múltiple, migración PostgreSQL, integración de pagos/códigos, pruebas end-to-end y despliegue corresponden a fase 2.

## Criterios de aceptación
1. Cuenta muestra solo nombre completo, correo y teléfono.
2. Botón «+ Nueva publicación» abre formulario original vacío.
3. Seleccionar publicación abre tarjeta original con todos sus controles y editar carga sus datos.
4. Tarjetas y formularios conservan exactamente el diseño y responsive existentes.
5. No se alteran registros ni producción existente.

**IMPORTANTE:** Este documento es una especificación de trabajo. No demuestra implementación funcional. Antes de programar localizar los componentes y rutas reales en el repositorio.
