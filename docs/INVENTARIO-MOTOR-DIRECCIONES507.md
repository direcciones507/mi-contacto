# Fase 2 — Inventario inicial de reutilización del motor Direcciones507

Fecha: 30 de octubre de 2026. **Solo investigación de estructura GitHub**; no se han conectado servicios ni inspeccionado aún los contratos internos de todos los módulos.

## Hallazgos confirmados en el árbol de `direcciones507/direcciones507` (`main`)

| Necesidad Mi Contacto | Módulos existentes para auditar | Estado |
|---|---|---|
| Servicio HTTP y rutas | `core/runtime/server.ts`, `request-routes.ts`, `core/postgres/shadow-runtime.ts` | Localizados, sin integración |
| Inicio de sesión Google | `core/postgres/google-auth.ts`, `core/runtime/general-auth.ts` | Localizados, evaluar callback/sesión multi-dominio |
| Mi perfil y edición | `core/runtime/user-panel.ts`, `address-editing.ts`, `address-edit-ui.ts` | Localizados, requieren adaptación a persona |
| ADMIN y moderación | `core/runtime/request-admin-ui.ts`, `core/postgres/place-moderation-handler.ts` | Localizados, faltan denuncias personales |
| Fotografías y R2 | `core/runtime/r2-storage.ts`, `r2-signing.ts`, `r2-media-authorization.ts`, `request-media.ts`, `image-processing.ts` | Localizados, no reutilizar secretos |
| Cobros y Yappy | `core/runtime/payment-routes.ts`, `payment-policy.ts`, `payment-repository.ts`, `yappy-provider.ts` | Localizados, verificar estados/activación |
| Navegación | `core/capabilities/navigation-providers.ts` | Localizado, verificar APIs y botones |
| Fichas públicas | `core/postgres/public-address-handler.ts`, `core/runtime/panel-address-card.ts` | Localizados, adaptar campos y SEO |

## Estado real de la fase 1

En rama `work/portada-directorio-20261030` existen `index.html`, `styles.css`, `app.js`. Portada y directorio **solo visuales**. No hay registro, directorio con datos reales, Google OAuth, pagos, fotografías reales ni API integrada. La búsqueda informa que es una demostración; no debe fingir resultados.

## Reglas antes de integrar

1. No tocar producción, Railway, Cloudflare, GitHub Actions ni PR.
2. No usar redirecciones visibles a Direcciones507. Mantener URLs y QR en Mi Contacto.
3. No compartir cookies, tokens ni claves de producción entre dominios sin auditoría.
4. Aislar perfiles, datos, medios, permisos, cobros y estados de verificación.
5. Verificar contratos y dependencias reales antes de copiar o importar módulos; no asumir que los nombres de archivo garantizan compatibilidad.
6. Mantener el proyecto independiente y evitar cambiar las ~25 direcciones históricas activas.

## Siguiente trabajo técnico

Auditar `server.ts`, `general-auth.ts`, `user-panel.ts`, `r2-storage.ts` y `payment-routes.ts`; diseñar API de perfiles aislada y conectar **primero lectura pública de perfiles** con datos de prueba. Solo después habilitar escritura, Google y pagos.

## Decisión geográfica: reutilización del catálogo LATAM

- [x] Reutilizar el **motor de lugares/divisiones geográficas** de Direcciones507/LATAM para Mi Contacto; no reconstruir manualmente catálogos nacionales.
- [ ] Auditar fuente real y contratos de país → provincia/departamento/estado → ciudad/localidad; verificar cobertura, nombres y diferencias por país.
- [ ] Cascada de selectores para alta/edición de perfiles; opciones dependientes del país y región seleccionados.
- [ ] Directorio público con filtros por país, división administrativa y ciudad/localidad, además de nombre/profesión.
- [ ] Mantener coordenadas GPS editables **independientes** del catálogo administrativo y del enlace/QR persistente.
- [ ] Evitar duplicar tablas, introducir listas inventadas o afectar datos existentes de Direcciones507.
- [ ] Ejemplo de navegación: Panamá → Veraguas → Santiago; Panamá → Coclé → Penonomé/Aguadulce. Ejemplos no sustituyen catálogo real.
