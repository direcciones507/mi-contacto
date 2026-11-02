# Importación geográfica para Mi Contacto (preparación offline)
Fuente: https://www.geonames.org/export/ (CC BY; atribución obligatoria, datos sin garantía).
Formato: https://download.geonames.org/export/dump/readme.txt

1. Descargar archivos de cada país `PA.zip`, `CR.zip`, `NI.zip`, `SV.zip`, `HN.zip`, `GT.zip`, `MX.zip`, `CO.zip` y descomprimir localmente.
2. Descargar `admin1CodesASCII.txt` y `admin2Codes.txt` del mismo origen.
3. Ejecutar `node scripts/import-geonames.mjs PA data/PA.txt data/admin1CodesASCII.txt data/admin2Codes.txt > data/PA-localities.csv`; repetir por país.
4. Revisar CSV y advertencias; comparar divisiones administrativas con fuentes oficiales, eliminar duplicados/homónimos con reglas documentadas.
5. **No importar automáticamente a PostgreSQL.** Falta adaptador de carga y reconciliación de códigos, municipios y comarcas. No subir datos descargados sin revisar licencia/atribución.
6. Al publicar la fuente, mostrar atribución «Datos geográficos: GeoNames (CC BY)» y fecha del extracto.

El script filtra puntos poblados (`feature class P`) y requiere `admin1` reconocida. No pretende cobertura exhaustiva; faltantes quedan en revisión. El archivo CSV es un insumo, no el catálogo definitivo.
