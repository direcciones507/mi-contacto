# Mi Contacto — cierre de trabajo posible en esta sesión

Rama: `work/real-integrations-20261104`. Padre: `04204ea`. Se conserva el historial, sin modificar main ni Railway, sin despliegues, cobros ni recursos externos creados.

## Resultado técnico

**126 pruebas aprobadas, 0 fallidas, 0 omitidas.** Las 115 anteriores siguen aprobadas. Tres recorridos Chromium 390/820/1440 pasan incluyendo consentimiento explícito, edición, fotos, ADMIN, mudanza, directorio, Maps, compartir, QR, eliminación y cierre de sesiones. No son pruebas físicas Android/Safari. Auditoría de dependencias de producción: cero vulnerabilidades conocidas.

Implementado:

- Capa territorial versionada: dos cantones y cinco asignaciones verificadas, sin sobrescribir la fuente; búsqueda representativa de ocho países; protección de perfiles referenciados y etiquetas de localidades que distinguen homónimos.
- Privacidad y términos accesibles, borrador explícito, identidad/contacto/retención/proveedores configurables. Producción exige aprobación humana explícita y datos completos del responsable.
- Aceptación de términos, privacidad y mayoría de edad por cuenta, con versión y digest de contenido. CSRF, idempotencia, nueva aceptación si cambia el contenido. Migración 012. La ocultación y solicitud de eliminación siguen accesibles sin obligar a aceptar nuevos términos.
- Staging con habilitación explícita y dominios controlados de Mi Contacto. Callback, enlaces y QR usan el origen autorizado, sin apuntar por error a producción; QR comprobado por decodificación. Otros dominios de proyecto siguen rechazados.
- Arranque con verificación de todos los hashes de migraciones; error de URL de base redactado; endpoints de vida/readiness y HSTS para origen HTTPS. La escucha HTTPS es compatible con un contenedor web; HTTP de prueba queda en loopback por defecto.
- Ejecutor `npm run verify:real -- --run-isolated`: comprobaciones independientes de PostgreSQL nativo y R2, sin mocks. Rechaza bases no exclusivas/no vacías, protege secretos y no puede declarar producción lista a partir de credenciales. Prueba nativa preparada con concurrencia de diez altas, integridad, rollback, reapertura de conexiones y pg_dump/pg_restore con comparación de filas. No reinicia servicios de Railway.
- Herramientas nativas pg_dump/pg_restore 18.6 preparadas mediante extracción en scratch, sin instalación privilegiada, con procedencia y SHA256 registrados. Solo se ejecutaron `--version`; no hubo respaldo/restauración de base.

## Servicios reales: no se aprueban por simulación

| Integración | Resultado en esta sesión | Bloqueo preciso |
|---|---|---|
| PostgreSQL nativo | BLOCKED; 0 verificaciones de servidor aprobadas | No hay URL de dos bases exclusivas de prueba. Localmente solo UID 0 está mapeado, sin capacidades; crear namespace no-root falla con EPERM al escribir uid_map. |
| Respaldo/restauración | NOT_EXECUTED; herramientas nativas comprobadas por versión | Requiere bases origen/destino exclusivas, vacías y accesibles. Reinicio de servidor requiere host no-root o autorización para infraestructura exclusiva. |
| Google OAuth real | BLOCKED; 0 logins reales verificados | Cliente/secret propios no disponibles, sin entorno público de prueba y callback configurado. Exige acceso real con cuenta del propietario. |
| Cloudflare R2 real | BLOCKED; 0 objetos reales verificados | Cuenta, bucket y claves exclusivas no disponibles. Deben revisarse también dominios públicos gestionados/personalizados del bucket. |
| Railway | Descubrimiento solo lectura: 8 proyectos, 19 servicios | Ningún nombre identifica un servicio exclusivo Mi Contacto. No se leyeron secretos de otros proyectos. No se modificó ni creó ningún recurso. |

Variables faltantes y estado están en `evidence/real-integrations-20261104/external-status.json`. Evidencias locales de permisos y clientes: `native-environment.json` y `native-client-provenance.json`. No se afirma que un recurso no exista fuera del alcance de la conexión: no se encontró uno exclusivo identificable.

## Para desbloquear sin tocar otros proyectos

Se necesitan dos bases nativas exclusivas y vacías (`mi_contacto_test_source` y `mi_contacto_test_restore`), o un host aislado no-root; credenciales Google propias y un bucket R2 exclusivo privado. Deben proporcionarse mediante variables seguras, no en archivos del repositorio. Si requieren crearse/desplegarse en Railway, el propietario debe autorizar ese entorno y cualquier gasto, como exige su instrucción actual. La propuesta está en `infra/mi-contacto-validation.json`; no ha sido aplicada.

Después de ese acceso, ejecutar la verificación real y la [guía de aceptación](ACCEPTANCE-REAL-20261104.md). No usar las bases con fixtures como producción. El lanzamiento permanece bloqueado hasta verificar servicios, respaldo, seguridad, revisión territorial y textos legales aprobados. No se asigna un porcentaje que oculte esos pendientes.

[Checklist](MASTER-CHECKLIST.md) · [Revisión territorial](TERRITORY-REVIEW-20261104.md) · [Textos legales para revisión](LEGAL-DRAFT-20261104.md).
