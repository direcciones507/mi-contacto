# Formulario de fotografías — aceptación

Código desplegado: `1dc619dee48b87ab50a048b6e45833d45afdb0b2`.
Railway SUCCESS: `9838d478-c691-4ae5-83af-990413a8098f`.
CI completo aprobado: https://github.com/direcciones507/mi-contacto/actions/runs/41941732018

La sección de fotografías está fuera del editor inicialmente oculto. Muestra cinco espacios desde la apertura del panel: principal gratuita y cuatro adicionales con indicación de Destacado. Si falta perfil, indica Crear mi perfil → Guardar sin publicar → seleccionar y guardar fotografía. El selector queda deshabilitado hasta disponer del borrador necesario para asociar el archivo; no se suben archivos sin propietario.

Cada espacio permite selección nativa, vista previa local, descarte sin guardar, reemplazo y retirada. Formatos JPG/PNG/WebP estáticos, máximo 5 MB, validación del cliente y del servidor. Imágenes no válidas no reemplazan la anterior. Los object URLs se revocan al descartar o renderizar. Los permisos de medios, revisión y almacenamiento siguen vigentes; no se conectó R2 ni se activaron pagos.

Los adicionales requieren saldo vigente ACTIVE/PAUSED según las reglas existentes; no basta preparar un paquete. El servidor vuelve a validar vigencia y cupo dentro de la transacción con bloqueo del perfil. Reemplazar un adicional se realiza atómicamente y admite galería llena; el identificador debe pertenecer a ese perfil y ser GALLERY. El archivo sustituido queda en cola de eliminación existente. La prueba cubre cuatro adicionales, rechazo del quinto, reemplazo con cupo lleno, imagen inválida sin pérdida y rechazo con vigencia agotada.

135 pruebas Node aprobadas. CI incluye nueve grupos PostgreSQL y tres recorridos Chromium. Evidencia del entorno real en evidence/photo-form-live-20261105. Los tamaños de celular/tableta/computadora son emulados en Chromium, no dispositivos físicos. El proxy de pruebas requiere excepción de su CA en el navegador de prueba, sin modificar TLS de la aplicación.

Para el propietario: abrir /mi-perfil, crear y guardar borrador si hace falta, ir a Fotografías de tu perfil, seleccionar principal, revisar y Guardar fotografía. Los cuatro adicionales permanecen bloqueados hasta contar con Destacado vigente.
