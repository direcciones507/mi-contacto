# Arquitectura inicial (propuesta, no aprobada)

## Principios
- Proyecto y despliegue independientes.
- Base de datos, almacenamiento y secretos separados de Direcciones507/LATAM.
- Reutilizar patrones y componentes con permiso, sin acoplarse a tablas productivas.
- Construir primero un MVP móvil y verificable.

## Entidades candidatas
- `User`: identidad autenticada, consentimiento y propiedad.
- `Profile`: tarjeta, estado, modalidad `DIRECTORY_FREE` o `LINK_ONLY_PAID`, región y campos públicos.
- `ProfilePhoto`: imagen principal y galería de destacado con límites configurables.
- `FeaturedOrder`: duración, precio fijo aprobado, estado de pago, vigencia.
- `PaymentEvent`: confirmación idempotente de proveedor autorizado.
- `AuditEvent`: registro de cambios y acciones ADMIN.

## Reglas de acceso
- Perfil de directorio: aparece en listados internos y puede abrirse por enlace.
- Perfil solo por enlace: no aparece en listados, búsqueda ni APIs de descubrimiento.
- En ambos casos la página individual responde con `noindex`; enlaces opacos no secuenciales.
- La visibilidad y las fotos extra deben comprobarse **en servidor**, no solo ocultarse en la interfaz.
- Sin pago confirmado no se activa un destacado ni una modalidad pagada.

## Trabajo inicial
1. Confirmar requisitos pendientes.
2. Elegir stack y diseñar migraciones aisladas.
3. Implementar tarjeta, enlaces y QR.
4. Implementar directorio y filtros.
5. Implementar destacados, pagos y ADMIN tras aprobación.
6. Pruebas y despliegue con autorización.

No contiene credenciales ni configuración de producción.
