# Mi Contacto

**Encuentra personas, comparte tu perfil y conecta fácilmente mediante un enlace digital.**

Proyecto independiente de Direcciones507, Direcciones LATAM y LeveIA.

## Estado
Integración local comprobada, rama `work/intensive-development-20261031`. **No hay publicación, pagos ni perfiles reales activos.**

Avance local medido: **70%**; base recuperada reevaluada en 40% con la misma matriz. El 38% anterior era un dato reportado sin fórmula recuperable. Ver [informe](docs/INTENSIVE-DEVELOPMENT-20261031.md) y [matriz verificable](docs/PROGRESS-20261031.json).

## Producto
- Directorio público por país, división territorial y localidad.
- Tarjeta gratuita en el directorio con **una foto**, enlace y QR.
- Modalidad **solo por enlace** bloqueada: existen decisiones históricas contradictorias y faltan precio/vigencia. No disponible ni habilitada gratuitamente.
- Fichas individuales **no indexables** mediante `noindex`, fuera del sitemap; cualquier persona con el enlace puede abrirlas.
- Destacados de pago por 1, 5, 10, 15, 20, 25 o 30 días, con fotografías adicionales incluidas.

## Precios aprobados (USD)
| Días | Precio |
|---:|---:|
| 1 | 1.69 |
| 5 | 7.99 |
| 10 | 14.99 |
| 15 | 21.99 |
| 20 | 27.99 |
| 25 | 31.99 |
| 30 | 34.99 |

El precio y la vigencia de la tarjeta solo por enlace aún no están definidos. No existe checkout ni activación de destacados desde el navegador.

## Ejecutar y validar localmente

Requisitos: Node 24 o posterior; versiones comprobadas de dependencias fijadas en package-lock.json. No copiar archivos de configuración, secretos ni bases de otros proyectos.

```bash
npm ci
npm test
npm run start:local
```

El servidor escucha solo en 127.0.0.1, con puerto aleatorio, base PostgreSQL WASM en memoria y almacenamiento fotográfico en memoria. Todos los datos desaparecen al detenerlo. Google y pagos permanecen sin configurar; no existe un acceso de prueba público ni un administrador predeterminado. El runtime de autenticación acepta exclusivamente micontacto.online o HTTP loopback y no lee DATABASE_URL ni credenciales de otras aplicaciones.

Para cargar el catálogo real en esa base efímera: `npm run start:local -- --catalog`. Son 392.717 registros de lugares poblados de GeoNames; la carga puede tardar varios minutos en WASM. **La procedencia/licencia están registradas, pero la revisión territorial humana sigue pendiente**. No contiene personas/perfiles reales.

Pruebas específicas: `npm run test:integration`. Validación completa del catálogo: `node scripts/validate-real-catalog.mjs`. Chromium requiere Playwright y un navegador locales: ver [guía técnica](docs/LOCAL-VALIDATION.md).

## Arquitectura comprobada

- Google OAuth con state de un solo uso ligado al navegador, nonce, PKCE y verificación de firma mediante jose; sesiones propias revocables en servidor y CSRF.
- Un perfil por cuenta y país, hasta ocho; país/slug/propietario inmutables, reserva permanente, edición/versiones y revisión ADMIN antes de publicar.
- Foto principal y galería controladas en servidor; decodificación, WebP y eliminación de metadatos, acceso privado a fotos no publicadas.
- Directorio con país/región/distrito/localidad/categoría/texto y paginación; sin contactos privados en resultados.
- Tarjeta pública, QR local, permisos de contacto/GPS, noindex y sitemap sin fichas.
- ADMIN, auditoría, denuncias, verificación de fotografía, catálogo y retiro de destacados. No eliminación irreversible de perfiles.

PostgreSQL nativo, Google real, bucket R2 real, dominio/SSL y dispositivos físicos no se han validado. Las pruebas de JWT usan claves y cuentas sintéticas; no equivalen a un login real de Google. La separación física de infraestructura y la persistencia de producción requieren una etapa autorizada aparte.

## Documentación
- [Checklist maestro](docs/MASTER-CHECKLIST.md)
- [Decisiones y pendientes](docs/DECISIONES.md)
- [Arquitectura inicial](docs/ARQUITECTURA.md)

**Seguridad:** no conectar bases productivas ni reutilizar secretos de otros proyectos. No desplegar ni activar cobros sin autorización expresa.
