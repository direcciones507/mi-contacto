# Pruebas del propietario

Ejecutar en el entorno de prueba preparado con Google, PostgreSQL y fotos persistentes reales. No confundir el servidor efímero `start:local` con el servidor persistente `npm start`.

1. Entrar con Google y crear el perfil gratuito: nombre, descripción y fotografía principal. Intentar crear otro perfil desde la misma cuenta: debe impedirlo.
2. Seleccionar país, región, distrito disponible y localidad. Pegar pin compartido de Google Maps y autorizar los datos que se desean mostrar. Guardar, solicitar publicación y aprobar desde otra sesión ADMIN.
3. Abrir el enlace desde otra cuenta/dispositivo. Revisar nombre/foto/contactos autorizados, «Cómo llegar», compartir y descargar QR. Abrir el QR desde otro teléfono. Un pin corto sin coordenadas no debe ofrecer Waze.
4. Editar el mismo perfil y cambiar de país/localidad. Completar revisión ADMIN; comprobar que enlace y QR originales siguen funcionando y el perfil no se duplica. Sin Destacado activo no debe aparecer en el directorio.
5. Verificar la galería de cinco fotos y visibilidad regional únicamente con un Destacado legítimamente habilitado en el entorno de prueba; no activar compras ni cobros. La activación sintética existe solo en fixtures automatizados.
6. Ocultar/mostrar y cerrar todas las sesiones. Acceso a datos privados y ADMIN desde otra cuenta debe ser rechazado.
7. Reiniciar servidor y base de prueba: comprobar perfil, fotos, sesión y QR. Verificar respaldo restaurado en otra base vacía.
8. Usar exclusivamente un perfil descartable para pedir eliminación. ADMIN autoriza con confirmación. Perfil, QR y fotos dejan de abrir; verificar que la cola de archivos queda vacía tras completar el borrado.
9. Repetir formularios/ficha/directorio/ADMIN en tablet Android y computadora, verificando teclado, selección territorial, fotos y botones.

Antes de producción: aprobar privacidad/términos, cobertura territorial, respaldo/retención y resultados reales de Google/R2/PostgreSQL. El propietario autoriza producción por separado.
