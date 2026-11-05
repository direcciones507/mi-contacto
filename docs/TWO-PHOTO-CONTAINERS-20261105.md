# Mi Contacto — dos contenedores y eliminación automática

Rama `work/two-photo-containers-cleanup-20261105`. Base `1ca028d`, último estado de la rama solicitada `work/final-integration-acceptance-20261105`. Implementación **`4fbe7a194529085cf98b79d3c648d9d2596ea432`**. **Sin despliegue ni migración remota.**

## Resultado

Dos contenedores principales: **Fotografía de perfil**, gratuita, y **Galería Destacado**, con cuatro posiciones dentro del mismo contenedor. Cada espacio conserva selector, vista previa, guardado, descarte, reemplazo y retirada. Las posiciones permanecen estables al reemplazar o retirar una imagen. No cambian elegibilidad, precios, saldo, revisión ni límites comerciales.

La principal y la galería se apilan en celular/tableta; en escritorio comparten la fila. La galería tiene una columna interna en celular y dos cuando hay espacio suficiente. Se mantienen etiquetas accesibles, estados bloqueados, foco y controles táctiles de 44 px como mínimo.

## Eliminación y protección

1. Registrar un intento durable para cada carga nueva autorizada, antes de escribir en almacenamiento.
2. Normalizar y guardar el archivo nuevo con clave propia e inmutable. Leerlo y comparar su SHA-256 con los bytes preparados antes de alterar referencias.
3. En transacción, bloquear el perfil, comprobar titularidad/eligibilidad/capacidad, actualizar la posición/referencia y registrar únicamente las claves que esta operación retira.
4. Tras COMMIT, borrar automáticamente esas claves, verificar su ausencia y retirar metadatos de la foto retirada. El volumen privado sincroniza el directorio tras el borrado. Las verificaciones antiguas revocadas de la imagen se eliminan; la auditoría mínima no contiene una copia de la foto.
5. Si el borrado o su comprobación fallan, conservar trabajo durable para reintento; espera progresiva de 5 segundos hasta una hora. El trabajador existente de 60 segundos vuelve a procesarlo, sin superponer sus propias ejecuciones.
6. Si el proceso cae o se pierde la respuesta de COMMIT, reconciliar los intentos nuevos vencidos bajo el mismo bloqueo del perfil. Una referencia activa siempre impide borrar. Nunca se elimina ciegamente una imagen que pudo quedar confirmada.
7. Recuperar cargas interrumpidas con una hora de margen y limpiar solo temporales propios `.pending-<uuid>` vencidos, en lotes limitados. No se listan/purgan fotos del bucket ni se barren archivos antiguos desconocidos.

La petición del usuario procesa sus propias claves retiradas; no espera a vaciar colas de otros perfiles. El trabajador periódico procesa hasta 50 intentos y 100 eliminaciones por recorrido. Las claves retenidas o todavía referenciadas se aplazan para no bloquear otras tareas.

Antes de borrar se comprueban referencias activas, la referencia de foto verificada, intentos en curso y la retención sensible existente. La retención no publica ni ofrece una galería histórica y solo se libera mediante el procedimiento humano correspondiente. En condiciones normales no quedan versiones anteriores; durante un fallo quedan únicamente los metadatos necesarios para terminar el trabajo con seguridad.

## Migración 016

`016_photo_lifecycle.sql` añade el registro de intentos, planificación de reintentos y posiciones de galería. La asignación inicial respeta el orden existente, sin alterar IDs, claves, enlaces ni archivos. Si hay más de cuatro posiciones históricas activas inconsistentes, falla en vez de borrar o truncar datos. Se conserva el control de checksum y se prepara respaldo previo a 016 para cuando se autorice una actualización remota.

La migración no hace limpieza masiva ni crea recursos. Los archivos históricos no identificados como trabajo autorizado se dejan intactos. El objetivo comprobado es evitar huérfanos nuevos y eliminar correctamente las sustituciones/retiradas gestionadas, sin prometer una auditoría o purga de almacenamiento antiguo no inventariado.

## Pruebas finales

CI del commit exacto: https://github.com/direcciones507/mi-contacto/actions/runs/42065348124 — **SUCCESS**.

| Ejecución | Aprobadas | Fallidas |
|---|---:|---:|
| Regresión completa, PostgreSQL WASM | 186 | 0 |
| Ciclo de fotos, migración/concurrencia/reinicio en PostgreSQL nativo | 24 | 0 |
| Chrome: celular 390, tableta 820, escritorio 1440; PostgreSQL nativo | 3 | 0 |

Los subconjuntos locales repetidos no se suman de nuevo. No hay casos omitidos en las suites finales.

La evidencia física usa archivos reales en directorios privados descartables y comprueba ausencia por lectura del adaptador filesystem y por conteo del directorio, además de las referencias SQL. Se repite para la principal y las cuatro posiciones. Se preserva la foto activa de otro perfil. Al terminar ese recorrido: **2 archivos actuales, 2 fotografías activas, 0 eliminaciones pendientes, 0 intentos y 0 temporales**. No se presenta un cambio de estado SQL como prueba de borrado físico.

También se probaron: contenido corrupto después de escritura, escritura parcial, rollback SQL, DELETE que no elimina realmente, fallo del almacenamiento, reintento después de reiniciar PostgreSQL y reconstruir el trabajador, referencias activas erróneamente encoladas, retención sensible, temporales viejos frente a recientes, COMMIT confirmado cuya respuesta se pierde, dos reemplazos concurrentes de principal, dos cargas al último espacio y dos reemplazos de la misma foto de galería. La migración conserva las cinco fotos anteriores.

**R2 está preparado y probado con el adaptador SDK y un cliente simulado aislado**, incluyendo PUT/GET/DELETE por clave exacta, fallos y cuatro posiciones. No se conectó ni certificó un bucket real. Se mantienen tres intentos del SDK y se añaden tiempos límite de conexión/petición. El protocolo no utiliza versiones históricas como galería.

Los recorridos visuales muestran los dos contenedores, cuatro espacios bloqueados sin Destacado y cuatro vistas previas con Destacado simulado. Comprueban vista previa, reemplazo/retirada, tamaños táctiles, ausencia de errores JS/desbordamiento, consentimiento, marca, denuncia y moderación sin regresión. No son dispositivos físicos ni pruebas en Railway.

## Evidencia y reproducción

[Prueba física y CI nativo, JSON](evidence/two-photo-containers-20261105/physical-deletion-and-native-ci.json).

| Formato | Galería con cuatro fotos | Estado bloqueado / sin borrador |
|---|---|---|
| Celular | [Ver](evidence/two-photo-containers-20261105/gallery-active-390.jpg) | [Ver](evidence/two-photo-containers-20261105/photos-before-draft-390.jpg) |
| Tableta | [Ver](evidence/two-photo-containers-20261105/gallery-active-820.jpg) | [Ver](evidence/two-photo-containers-20261105/photos-before-draft-820.jpg) |
| Escritorio | [Ver](evidence/two-photo-containers-20261105/gallery-active-1440.jpg) | [Ver](evidence/two-photo-containers-20261105/photos-before-draft-1440.jpg) |

```sh
node --test --test-concurrency=2 tests/*.test.mjs
MC_TEST_NATIVE_POSTGRES_BIN=/usr/lib/postgresql/16/bin node --test tests/photo-lifecycle.test.mjs tests/photos-gallery-unification.test.mjs scripts/native-auth-validation.mjs
node scripts/photo-containers-browser.mjs
```

No se desplegó esta rama ni se modificaron PostgreSQL, fotografías, usuarios o recursos de Railway. Producción, pagos, autenticación y otros proyectos permanecen sin cambios. La prueba con R2 real y la aplicación futura de 016 dependen de configuración/autorización del propietario; no bloquean el resultado construido y probado aquí.
