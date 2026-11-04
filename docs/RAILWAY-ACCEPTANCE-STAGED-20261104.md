# Railway: preparación del despliegue de aceptación — 4 noviembre 2026

El propietario autorizó crear y desplegar Mi Contacto, con la condición explícita de **informar el costo estimado y obtener aprobación antes de activar recursos que generen cargos adicionales**. Se completó la preparación sin ejecutar `accept-deploy` ni generar instancias facturables.

## Recursos preparados

- Proyecto nuevo: `mi-contacto-acceptance`, ID `7d9a7fb0-df2f-487c-8885-d093e1a9c9de`.
- Entorno: `acceptance`, ID `4a65150e-8ee4-4d22-917e-3ae3de82a380`.
- Servicio Node preparado: `mi-contacto-acceptance`, ID `11c5eb89-00ce-4928-bd4e-e2ce0c50d22a`.
- PostgreSQL exclusivo preparado: `Postgres`, ID `96597602-4db6-4287-8933-728bfc2549d9`.
- Volumen PostgreSQL preparado: `6d97e456-83ed-451f-9169-54f4e52e2ca3`.
- Patch pendiente: `b70d2b73-f3e7-4469-906f-69b850814d64`, 54 cambios revisados, no destructivo.
- Fuente preparada y fijada al commit `dd53f5fff1fd35236ba254f26f6f58a07253ffa1` de `work/infrastructure-acceptance-20261104`. Los pushes posteriores no despliegan automáticamente esta fuente fijada.
- Variables no secretas y referencia a la URL de la base exclusiva preparadas; Yappy y correo de pruebas apagados.

[Revisar proyecto](https://railway.com/project/7d9a7fb0-df2f-487c-8885-d093e1a9c9de?environmentId=4a65150e-8ee4-4d22-917e-3ae3de82a380).

La plantilla actual de Railway propone PostgreSQL 18. La suite nativa anterior se ejecutó en 16. Antes de una aceptación final se deberá aplicar y comprobar las migraciones en la versión efectivamente desplegada; no se presenta la prueba de 16 como validación de 18. La plantilla no activa HA: una instancia de PostgreSQL, sin réplicas. Los campos de conversión futura a HA son metadatos del template, no una conversión ejecutada.

## Costo estimado para aprobar antes de activar

Tarifas oficiales consultadas 4-nov-2026: RAM USD 10/GB-mes; CPU USD 20/vCPU-mes; almacenamiento de volumen USD 0.15/GB-mes; salida USD 0.05/GB. Builds gratuitos. Fuente: https://docs.railway.com/pricing/plans . No se cambia ni se contrata un plan.

**Estimación orientativa para las dos instancias y almacenamiento: USD 0.50–1.50 durante 48 horas de pruebas ligeras.** Supuestos: entre 0.5 y 1 GB de RAM total promedio, CPU total promedio baja (0.02–0.10 vCPU), pocos GB de almacenamiento y poco tráfico. No es cotización ni tope automático; el consumo real y el tiempo encendido determinan la factura. Si quedan créditos incluidos, podrán absorber parte o todo el consumo; la conexión disponible no muestra el plan, saldo ni uso facturable restante de la cuenta, por lo que no se promete costo adicional cero.

Se propusieron límites pequeños para el servicio, pero `update-service` respondió `Service Instance not found` al intentar configurarlos sobre el servicio que solo existe como cambio preparado. **No se aplicaron límites y no se afirma que haya un límite monetario configurado.** Antes de activación se requiere aprobar el costo; después, validar/aplicar límites compatibles y medir el consumo inicial exclusivamente de este proyecto. No configurar un tope global que pueda detener otros proyectos.

## Siguiente ejecución tras aprobación del costo

1. Completar la configuración segura y resolver persistencia de fotografías sin reutilizar recursos externos: R2 exclusivo o volumen privado exclusivo aprobado. No servir fotos desde almacenamiento efímero como si fuera persistente.
2. Preparar secreto de sesiones propio; resolver certificado/CA de PostgreSQL con verificación TLS. No desactivar validación de certificados para superar un error.
3. Arranque de `dd53f5f` exige Google y almacenamiento persistente. Sin las credenciales exclusivas todavía no debe anunciarse un acceso Google funcional; completar esos recursos o preparar un modo de aceptación que muestre honestamente las integraciones pendientes, sin login simulado público.
4. Activar solo los recursos de este proyecto cuando el costo esté aprobado; configurar límites conservadores, ejecutar 001–012 y comprobar versión nativa, persistencia, reinicio y respaldo/restauración reales del entorno.
5. Generar hostname temporal Railway/HTTPS y configurar `MC_ORIGIN` y callback exclusivo. No cambiar DNS de `micontacto.online`.
6. Entregar URL solo después de comprobar respuesta correcta. Actualmente no hay despliegue ni URL pública.

No se ejecutaron migraciones remotas, no se modificó main ni otros proyectos/bases, no se copiaron secretos de otros servicios, no se enviaron correos y no se habilitaron cobros reales.
