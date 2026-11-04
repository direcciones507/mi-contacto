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


## Sprint final: pago de prueba

Primero debe existir un entorno accesible autorizado y un comercio Yappy UAT exclusivo. Sin ellos esta prueba sigue pendiente. Al habilitar UAT, entra en Mi perfil de Panamá y abre **Probar pago Destacado**. Elige uno de los siete paquetes aprobados y un correo de pruebas acordado. Crea una orden; continúa con un número autorizado por Yappy UAT. Confirma el flujo externo y consulta el estado: el retorno visual por sí solo no marca pagado. Verifica PAID, saldo correcto y una sola orden ante recargas/notificación repetida. Perfil sin aprobación o bloqueado: saldo en pausa. Una operación incierta requiere conciliación; no repetir el cargo.

El comprobante queda en cola hasta configurar el transporte de correo; no se anuncia envío completado sin esa conexión. Verificar entrega y ausencia de duplicados antes de aceptación. Esta versión solo genera comprobantes de prueba. Repetir en celular, tableta y computadora; los recorridos visuales actuales no pudieron ejecutarse por permisos de sockets del entorno.
