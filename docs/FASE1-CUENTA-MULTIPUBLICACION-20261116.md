# Mi Contacto — Fase 1 sobre código real (16-11-2026)

## Origen confirmado
Railway proyecto `mi-contacto-acceptance`, servicio homónimo, entorno `acceptance`, fuente `direcciones507/mi-contacto`, rama `work/admin-codes-excel-20261110`. Esta rama de trabajo deriva de esa fuente, NO de main.

## Inspección
- `dashboard.js`: renderiza tarjetas desde `items=(await api('/api/profiles')).items`, usando `contact-card`, acciones «Editar datos», «Copiar enlace», «Ocultar ficha» y otras. También contiene restricción de interfaz `$('newProfile').hidden=true` y error `ACCOUNT_PROFILE_EXISTS`.
- `profile-runtime.js`: propiedad `account_id` en perfiles y operaciones identificadas por `id`; hay que verificar límites de creación y restricciones SQL.
- `publication-service.js`: lógica de publicación específica; no reemplazar sin auditar.
- `db/010_single_profile_maps.sql` y otras migraciones: revisar unicidad por cuenta antes de activar creación múltiple.

## Objetivo aprobado
1. Sección superior «Mi cuenta» con nombre completo, correo electrónico y teléfono, independiente de los anuncios.
2. Debajo «Mis publicaciones» con tarjetas originales completas, título propio por anuncio y botón «+ Nueva publicación».
3. Crear: formulario actual vacío. Editar: mismo formulario precargado para el ID seleccionado.
4. Conservar EXACTAMENTE colores, estructura, estilos, botones, animaciones y responsive de tarjetas existentes; NO crear otra versión.
5. Publicaciones ilimitadas por cuenta; fotos, ubicación, QR, enlace, estado, código y vigencia independientes.
6. Destacar por código existente; NO habilitar compra pública.
7. Mantener perfiles y datos existentes; eliminar anuncio no elimina cuenta; ocultar no elimina.
8. No publicar ni migrar producción sin pruebas.

## División de fases
**Fase 1**: diseño de cuenta, listado y reutilización de componentes, preparado sin romper rutas actuales.
**Fase 2 (Work)**: migraciones PostgreSQL, API y permisos para varios perfiles, códigos y pagos por anuncio, pruebas integrales, PR y despliegue.

## Seguridad
La rama de Railway está activa. Trabajar solamente en rama derivada y revisar diff. Evitar que una interfaz de «+ Nueva publicación» prometa persistencia antes de completar backend. No mezclar datos de distintas publicaciones.

Este documento registra el análisis y los criterios. NO implica que la funcionalidad esté implementada.
