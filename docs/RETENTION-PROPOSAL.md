# Propuesta pendiente de aprobación — retención y eliminación

Documento de producto y operación para decisión del propietario. No establece plazos legales, no declara obligaciones normativas verificadas y no autoriza borrados. No se activó purga, lifecycle de bucket, anonimización irreversible ni envío de avisos.

| Grupo | Comportamiento disponible | Decisión pendiente |
|---|---|---|
| Ficha, teléfono, WhatsApp y ubicación públicos | Ocultar inmediatamente por propietario; contacto y ubicación (región, localidad y coordenadas) además exigen consentimiento específico; el país permanece en la URL | Texto definitivo de consentimiento y tratamiento de datos ya compartidos fuera de la plataforma |
| Fotos de una ficha oculta/no aprobada/bloqueada | Cortar acceso anónimo desde la ruta del servidor y no-store; propietario y ADMIN mantienen revisión autenticada | Alcance y trazabilidad de accesos internos de soporte |
| Datos personales y fotografías retiradas | Conservar privadamente; reemplazar/revocar acceso no equivale a borrar físicamente | Plazo, alcance, responsable, verificación y autorización de eliminación física |
| Auditoría, moderación, términos y comprobantes futuros | Conservar separados del directorio; no exponer al público | Datos mínimos necesarios, acceso y plazo, sujeto a revisión aplicable |
| Galería adicional de Destacado vencido o pausado | Oculta al público; sin borrar fotos ni regalar reactivación de tiempo | Retención, reutilización autorizada en otro paquete y eventual eliminación |
| Enlace y reserva de slug | No reasignar ni borrar para permitir duplicados; solicitud no altera identidad | Forma de conservar una reserva mínima después de una eliminación futura, sin publicar datos personales |
| Backups | No hay backup productivo; solo código/evidencia y pruebas sintéticas | Ciclo de rotación, propagación de bajas, restauración sin republicar datos y verificación de eliminación |

## Flujo conservador implementado

- Ocultar ficha: revocable por el propietario si no hay solicitud pendiente ni bloqueo ADMIN. Se pausa cualquier Destacado activo; mostrar de nuevo no consume ni reanuda automáticamente su saldo. La ficha sigue sujeta a revisión y cuenta/país habilitados.
- Solicitar eliminación: confirmación explícita del propietario, CSRF y control de propiedad. Se oculta, pausa y registra una sola solicitud aunque se repita desde varias sesiones. La pantalla dice que no hubo borrado físico. El enlace queda reservado, no se publica ni se reasigna.
- ADMIN puede acusar revisión con motivo auditado; **ACKNOWLEDGED significa revisión registrada, no eliminación completada**. No puede marcar una purga realizada ni sacar la ficha de ocultación mediante esta acción. Reintentar no duplica auditoría.
- Mientras exista solicitud, el usuario no puede levantar la ocultación con un cambio de modalidad o reanudación. Su resolución/cancelación y el eventual borrado físico requieren una política aprobada; no se deduce de un plazo inventado.

## Decisiones que faltan antes de ejecutar una eliminación real

Aprobar finalidad y alcance por categoría, plazos, identidad/autorización para pedir y revocar una baja, excepciones que requieran revisión, conservación mínima de auditoría/reservas, fotos adicionales, tratamiento de backups y protocolo de respuesta. Revisar las exigencias aplicables con asesoría adecuada antes de fijar plazos; este documento no las sustituye.

Cualquier implementación posterior debe permitir ensayo, inventario, aprobación del lote y evidencia de ejecución. La eliminación de una cuenta, pérdida de su identificador Google o borrado de fotos en un bucket nunca debe desactivar la protección de slugs ni levantar un bloqueo ADMIN de forma indirecta.
