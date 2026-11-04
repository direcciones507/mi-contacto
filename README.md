# Mi Contacto

**Encuentra personas, comparte tu perfil y conecta fácilmente mediante un enlace digital.**

Proyecto independiente de Direcciones507, Direcciones LATAM y LeveIA.

## Estado vigente — 4 noviembre 2026

Construcción en rama aislada; sin producción, cobros ni despliegues. 126 pruebas automatizadas locales aprobadas y tres recorridos completos Chromium (390/820/1440). Ver [fase de integraciones reales y bloqueos](docs/REAL-INTEGRATIONS-20261104.md).

- Exactamente un perfil personal por cuenta Google, con edición de país/localidad sin cambiar URL ni QR.
- Gratuito: foto principal, descripción, contactos autorizados, pin de Maps, compartir y QR descargable. Accesible por enlace, fuera del directorio.
- Destacado: hasta cinco fotos y directorio regional con aprobación, consentimiento y vigencia. Paquetes/pausa existentes conservados; no hay cobros, suscripciones ni activación comercial real autorizada.
- ADMIN: revisión, moderación, catálogos, denuncias, verificación de foto y eliminación definitiva a solicitud del titular. Borrado transaccional con cola de fotos, reintentos y protección contra reutilización de enlaces eliminados.
- Fichas individuales noindex y fuera del sitemap. Sin correo electrónico público.

Novedades de la fase final: consentimiento legal versionado y textos en borrador; correcciones territoriales verificadas; origen/QR de staging; controles de arranque y ejecutor de verificaciones reales. La aprobación legal, las credenciales y los servicios reales siguen pendientes.

## Ejecutar y validar

```bash
npm ci
npm test
npm run start:local
npm run test:browser
```

`start:local` usa base/fotos efímeras y Google deshabilitado. No contiene un login público de prueba. Para navegador, instalar Chromium con Playwright y definir `MC_BROWSER_EVIDENCE` como directorio absoluto de evidencias.

`npm start` prepara el servidor persistente con PostgreSQL y almacenamiento explícitos; exige variables exclusivas y migraciones previamente aplicadas. No ejecuta migraciones al arrancar. Ver [despliegue aislado y recuperación](docs/DEPLOYMENT-20261104.md) y [pruebas del propietario](docs/OWNER-ACCEPTANCE-20261104.md).

**Pendiente para lanzamiento:** Google real, R2 real, PostgreSQL nativo/concurrencia/backup-restauración, revisión territorial nacional, textos legales finales y dispositivos físicos. WASM y SDK simulado no sustituyen estas verificaciones.

## Documentación
- [Checklist maestro](docs/MASTER-CHECKLIST.md)
- [Decisiones y pendientes](docs/DECISIONES.md)
- [Arquitectura inicial](docs/ARQUITECTURA.md)

**Seguridad:** no conectar bases productivas ni reutilizar secretos de otros proyectos. No desplegar ni activar cobros sin autorización expresa.
