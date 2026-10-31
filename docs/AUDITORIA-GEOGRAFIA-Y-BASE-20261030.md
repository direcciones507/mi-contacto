# Auditoría territorial y base de datos independiente

**Fecha:** 30-oct-2026. **Alcance:** solo lectura del repositorio `direcciones507/direcciones507` en `main`; desarrollo aislado en Mi Contacto.

## Hallazgos comprobados
- `core/runtime/country-configuration.ts` contiene ocho países iniciales PA, CO, CR, GT, SV, HN, NI, MX y etiquetas administrativas por país. PE y EC aparecen como FUTURE.
- El código observado define etiquetas, prefijos y permisos de publicación comercial, **no un catálogo exhaustivo de localidades**.
- `docs/reviews/latam-country-foundation-20261011.md` indica expresamente que los catálogos territoriales completos son trabajo posterior.
- La búsqueda de rutas de archivos relacionadas con geografía, provincias, municipios y localidades en el árbol de `main` no identificó un catálogo territorial reutilizable. Esto **no demuestra** que no exista información en otros servicios, datos persistidos, ramas o fuentes externas.
- El motor comercial LATAM no es directamente reutilizable para perfiles personales sin adaptar modelo, autorización y sesiones.

## Implementación preparada
- `db/001_initial.sql`: esquema `micontacto` diseñado para **base PostgreSQL separada**, una cuenta Google por perfil, slug único, país y localidad, estados de publicación y coordenadas.
- `profiles.slug` UNIQUE y `profile_slug_reservations.slug` PRIMARY KEY; los conflictos deben devolverse como HTTP 409 con mensaje aprobado.
- No hay ejecución SQL, instancia creada, despliegue, conexión OAuth ni perfiles persistidos.

## Próximo trabajo por orden
1. Determinar fuente verificable de provincias/departamentos/estados y ciudades/localidades para ocho países; cargarla en tablas de catálogo independientes y validar integridad.
2. Crear pruebas PostgreSQL descartables para unicidad concurrente de slug, un perfil por Google, edición sin cambiar slug y visibilidad ACTIVE/PAUSED/BLOCKED.
3. Implementar API de disponibilidad y creación transaccional; integrar formulario.
4. Reutilizar OAuth de forma aislada, luego tarjetas y QR; nunca conectar a producción de Direcciones507.
