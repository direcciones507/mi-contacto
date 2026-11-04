# Mi Contacto — aceptación Railway verificada

Fecha: 4 noviembre 2026. Rama: `work/infrastructure-acceptance-20261104`.
Código desplegado: `789eb55ec0307d3cbadb913e1a013e1fbb8fbee8`.

Acceso: https://mi-contacto-acceptance-acceptance.up.railway.app/acceso-pruebas
El código temporal se entrega al propietario por separado; no se guarda en Git.

## Prueba del propietario

1. Abrir el enlace e introducir el código privado.
2. Pulsar Crear mi perfil; usar datos de prueba y subir una foto.
3. Guardar, editar ubicación/país y comprobar que enlace y QR no cambian.
4. Abrir ficha, compartir, descargar QR y comprobar Cómo llegar desde sus dispositivos.
5. Revisar las funciones ADMIN desde la cuenta de aceptación. Los cobros reales permanecen apagados.

El acceso no representa una prueba de Google OAuth. Esta cuenta temporal está fijada al propietario; no existe acceso de prueba público para crear cuentas arbitrarias.

## Evidencias reales

En `evidence/railway-live-20261104/`: creación/publicación y QR, persistencia después de reiniciar PostgreSQL y aplicación, y eliminación definitiva de los datos técnicos. La cuenta queda sin perfil para la prueba del propietario.

PostgreSQL 18.6, TLSv1.3 con CA exclusiva verificada, migraciones 001–012, 4,749 regiones y 392,717 localidades. Respaldo pg_dump custom restaurado en una base temporal exclusiva; conteos y huella iguales, base temporal retirada. Aplicación Node 24.22.2 con UID 1000; fotografías persistentes en volumen privado. No se ha probado R2 real.

CI: https://github.com/direcciones507/mi-contacto/actions/runs/41897326982
135 pruebas Node, nueve grupos nativos PostgreSQL y tres recorridos Chromium aprobados. Recorridos automatizados no sustituyen pruebas físicas del propietario.

## Infraestructura y ventana

Proyecto exclusivo `7d9a7fb0-df2f-487c-8885-d093e1a9c9de`; entorno `4a65150e-8ee4-4d22-917e-3ae3de82a380`.
Node `11c5eb89-00ce-4928-bd4e-e2ce0c50d22a`; PostgreSQL `96597602-4db6-4287-8933-728bfc2549d9`.
Despliegue Node exitoso `8b56104f-7b70-4212-9b3d-e16a211d9685`.
Cada servicio limitado a 0.25 vCPU, 0.5 GB RAM y una réplica. Sin ampliaciones.

Consumo estimado autorizado: USD 0.50–1.50 por 48 horas. Factura/crédito exactos no visibles; no se garantiza un tope monetario. Última muestra: RAM Node 0.041 GB, PostgreSQL 0.051 GB; almacenamiento Node 0.022 GB y PostgreSQL 1.281 GB. Supervisión cada seis horas programada.

Cómputo y acceso temporal programados hasta 6 noviembre 2026, 19:02:48 UTC / 14:02:48 Panamá. Los volúmenes se conservan y pueden generar cargos de almacenamiento después; no se autoriza ampliar recursos ni extender la ventana automáticamente.

## Pendientes reales

Credenciales exclusivas de Google OAuth, bucket/credenciales R2, Yappy UAT y transporte de correo. Google aún no conectado; fotos en volumen; pagos y envío de correo desactivados. Revisión territorial humana, legal y aceptación física pendientes. No listo para producción comercial. Sin cambios a main, DNS u otros proyectos.
