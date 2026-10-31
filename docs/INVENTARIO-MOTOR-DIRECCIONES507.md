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

## UX del buscador territorial — aclaración del usuario (30-oct-2026)
- [x] El directorio se busca primero por **país**, luego opcionalmente **provincia/departamento/estado** y **ciudad/localidad**.
- [x] Cada nivel funciona sin obligar al siguiente: país solo = resultados nacionales; país+provincia = resultados provinciales; país+provincia+localidad = resultados locales.
- [x] Nombre, profesión o palabra clave es filtro opcional combinable con ubicación.
- [ ] Mostrar nombres de divisiones según país y alimentar desplegables del catálogo geográfico existente; nunca listas parciales hardcodeadas como fuente de verdad.
- [ ] Permitir reiniciar filtros y mostrar resultados vacíos de forma clara. No fingir búsquedas reales hasta integrar la API.
- [ ] Considerar Panamá como selección inicial del directorio en la primera versión, sin impedir seleccionar otros países LATAM autorizados.

## Alcance geográfico ratificado: ocho países desde lanzamiento (30-oct-2026)
- [x] Lanzamiento previsto **simultáneamente para los ocho países**: Panamá (PA), Costa Rica (CR), Nicaragua (NI), El Salvador (SV), Honduras (HN), Guatemala (GT), México (MX) y Colombia (CO). Ningún país queda como mero marcador visual.
- [x] Sustituye la propuesta anterior de arrancar solo con Panamá: **Panamá puede ser el país preseleccionado en la interfaz, pero todos los ocho deben tener búsqueda geográfica funcional desde el lanzamiento**.
- [ ] Auditar exhaustivamente catálogo existente en Direcciones LATAM por país, regiones y localidades; documentar cobertura real y huecos. Completar o incorporar fuente validada si faltan subdivisiones; no afirmar que está completo sin comprobarlo.
- [ ] Aplicar selector país → provincia/departamento/estado → ciudad/localidad a los ocho países, tanto al crear/editar perfiles como al buscar.
- [ ] Pruebas de cascada, filtrado y casos sin resultados para cada país antes de declarar lista la fase.

## Expansión geográfica posterior — decisión del usuario
- [x] Fase inicial: los ocho países confirmados PA, CR, NI, SV, HN, GT, MX y CO, con el mismo funcionamiento geográfico que Direcciones507/LATAM.
- [x] Fase posterior, **no incluida en el lanzamiento inicial**: preparar expansión hacia Sudamérica, comenzando por **Perú, Ecuador y Bolivia**, y evaluar después otros países más al sur.
- [ ] Diseñar catálogo, configuración, validaciones y búsqueda para incorporar nuevos países sin reescribir el directorio; activar cada país únicamente cuando tenga divisiones/localidades y pruebas completas.

## Países extensibles sin cambios de código por país — decisión adicional
- [x] La expansión posterior podrá incluir **Cuba (CU)** y **República Dominicana (DO)**, además de Perú, Ecuador, Bolivia y otros países de América Latina y el Caribe; **no activarlos en el lanzamiento inicial**.
- [ ] Diseñar alta de países mediante configuración/catálogo versionado, no condiciones especiales dispersas por país. Cada país define código ISO, nombre, divisiones administrativas, localidades, nomenclatura visible, prefijo telefónico y estado habilitado/deshabilitado.
- [ ] Selector y filtros geográficos dinámicos a partir de configuración, con datos territoriales validados; permitir distintos niveles administrativos según país.
- [ ] Activación controlada por bandera de país tras completar catálogo, pruebas de registro/búsqueda y revisión de políticas, privacidad, pagos y disponibilidad operativa; no prometer cobertura hasta verificarla.
- [ ] Mantener URLs y QR existentes estables al incorporar países nuevos; aislar perfiles y preservar compatibilidad con los ocho países iniciales.

## URLs personales legibles y privacidad de indexación — decisión
- [x] Cada tarjeta de persona tendrá una URL propia legible basada en nombre, por ejemplo `https://micontacto.online/maria-sofia` (ejemplo no reservado ni publicado).
- [x] Los perfiles personales públicos serán accesibles mediante URL/QR y directorio interno si están activos, pero **no indexables por buscadores externos** (`noindex`, sin inclusión en sitemap). No confundir `noindex` con acceso privado.
- [ ] Generar slug normalizado (acentos, espacios, caracteres especiales), validar unicidad en base de datos con reserva transaccional, y resolver colisiones (`maria-sofia-2`, etc.) sin sobrescribir perfiles.
- [ ] Mantener slug, enlace y QR estables al editar nombre, foto, teléfono o ubicación. No permitir reutilizar slugs de perfiles borrados sin política explícita; evitar suplantación.
- [ ] Si perfil está pausado o bloqueado, ocultar tarjeta en directorio y gestionar acceso directo con respuesta segura según política.
- [ ] Añadir controles anti-enumeración y privacidad apropiados; evitar mostrar email. No declarar privacidad total por usar `noindex`.
