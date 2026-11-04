# Sprint final — 4 noviembre 2026

Base exacta recuperada: `04204ea7583bcd2b81531143dbbff0b58b21e5a4`, sin commits posteriores en la rama de origen al recuperarla. Rama nueva aislada: `work/final-sprint-20261104`. Sin cambios a main, otros proyectos, Railway, dominios ni cobros reales.

## Resultado concreto

Se conserva toda la construcción previa. Se añade pantalla privada de checkout UAT, enlace condicional desde el panel, migración 012 y flujo transaccional de órdenes Yappy UAT, adaptando los patrones leídos del motor real de Direcciones507 (`payment-policy.ts`, `payment-repository.ts`, `yappy-provider.ts`, main consultado 4-nov). Tablas, identificadores, secretos y marca propios; ninguna lectura de datos o credenciales de otras plataformas.

Precios exclusivamente desde la escala aprobada. Idempotencia por cuenta/perfil/operación y un intento no conciliado por perfil. Propiedad/CSRF, Panamá, importe y estado se verifican en servidor. Inicialización única con marcador persistente ante timeout; callback con HMAC, dominio exacto y rechazo de parámetros duplicados. El navegador no confirma pago. Orden pagada, saldo y comprobante se confirman en una transacción; rollback comprobado. Notificaciones repetidas no duplican saldo/correo; un éxito firmado tardío prevalece sobre cancelación. Perfil no elegible conserva saldo en pausa, sin eludir aprobación, consentimiento, bloqueo o privacidad.

Cola de comprobantes persistente; transporte explícito, clave estable, lease antes de envío, reintento con espera y revisión manual antes de vencer ventana de idempotencia. Fallar el correo no revierte el pago. Todos los mensajes actuales son de prueba y muestran importe, paquete y método. Borrado autorizado elimina órdenes y destinatarios de prueba junto al perfil. No se implementa retención fiscal real sin política aprobada.

## Evidencias de esta ejecución

- `npm test`: **126 aprobadas, 0 fallidas, 0 omitidas**, PostgreSQL WASM aislado y proveedor/transporte sintéticos. Once pruebas adicionales respecto a las 115 recuperadas; los subconjuntos no se suman otra vez.
- `npm audit --omit=dev --json`: **0 vulnerabilidades conocidas**.
- `git diff --check`: sin errores.
- Navegador: Chromium descargado, pero lanzamiento **bloqueado** por `socket() failed: Operation not permitted`. No se ejecutaron los tres recorridos actuales. Los recorridos anteriores son evidencia histórica del commit base, no validación de este sprint.
- PostgreSQL nativo: binarios ausentes; `apt-get update` falla en setgroups/setegid/seteuid. No se aplican migraciones externas ni se declaran concurrencia nativa o backup/restauración comprobados.
- No hay variables MC_* configuradas en el proceso de esta sesión. No se probaron Google, R2, Yappy UAT o correo reales; no se envió correo ni se cobró.

Archivos: `evidence/final-sprint-20261104/tests.log`, `audit.json`, `browser-blocked.log`.

## Avance medido y límites

Matriz nueva de construcción funcional, diez áreas con igual peso; no comparable directamente con porcentajes históricos: ocho áreas completas localmente (identidad/perfil único, edición/mudanza, fotografías, pin/contactos, compartir/QR, directorio, Destacados/vigencia, ADMIN/privacidad/borrado); pagos 0,5 (API UAT probada con proveedor sintético; falta validar interfaz en navegador y proveedor real); comprobantes 0,5 (cola/transporte inyectable probado; falta correo real). **9/10 = 90% de construcción local**, no preparación productiva.

Validaciones de integración externa verificadas en esta sesión: **0/4** (PostgreSQL nativo, Google real, R2 real, pagos/correo reales). No existe todavía entorno público accesible para aceptación. No se declara listo para producción.

## Acceso exacto pendiente y siguiente validación

1. Entorno de pruebas separado con Node 24, PostgreSQL nativo y permisos para conexiones locales/binarios; base y usuario exclusivos. Ejecutar 001–012 y `native-validation.mjs --run` para multiconexión, transacciones, reinicio y pg_dump/pg_restore.
2. Google: cliente web/secret exclusivos, consentimiento y callback `/auth/google/callback` del entorno autorizado.
3. R2: cuenta, bucket privado `mi-contacto-…`, credenciales limitadas a ese bucket y confirmación de aislamiento.
4. Yappy UAT: comercio/secret exclusivos, dominio y callback UAT registrados. Validar componente UAT y recorrido de navegador antes de cualquier aprobación de cobros reales.
5. Correo: proveedor/credencial exclusivos, remitente autenticado y política de rebotes; conectar transporte/outbox en entorno autorizado y verificar entrega real a destinatario acordado.
6. Autorización para preparar/desplegar entorno accesible y DNS de `micontacto.online`. Ninguna autorización de producción inferida.
7. Aceptación física Android/Safari; revisión nacional del catálogo, canal de foto verificada y aprobación legal/retención.

## Prueba del propietario

Cuando esté autorizado y disponible el entorno, seguir `OWNER-ACCEPTANCE-20261104.md`: Google → perfil/foto/descripción/contactos/pin → ADMIN aprueba → compartir/QR → mudanza manteniendo enlace → Destacado UAT → confirmación firmada y saldo → correo → pausa/reanudación/vencimiento → denuncia/moderación → solicitud de borrado/ADMIN → enlace y fotos retirados. Validar móvil/tableta/escritorio y repetir después de reiniciar servicios. No usar dinero real ni presentar la simulación automatizada como aceptación comercial.
