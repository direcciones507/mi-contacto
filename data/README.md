# Catálogo derivado de GeoNames

Fuente y atribución: [GeoNames](https://www.geonames.org/), [descargas](https://download.geonames.org/export/dump/), licencia [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).

Transformación: extracción de divisiones admin1/admin2 y registros de lugares poblados para PA/CR/NI/SV/HN/GT/MX/CO; se omiten coordenadas y otras columnas no requeridas. Se excluyen categorías históricas/abandonadas seleccionadas y cuatro registros sin referencia territorial suficiente. Los nombres e IDs se conservan sin inventar localidades. No hay datos personales ni perfiles.

Proveniencia, hashes de fuente, Last-Modified y conteos: catalog-provenance.json. Artefacto derivado comprimido: geonames-catalog.json.gz. Constructor offline determinista: scripts/build-catalog.py.

Importación/validación estructural comprobadas en PostgreSQL WASM. **Revisión territorial humana/nacional pendiente**, incluidos cambios administrativos y localidades homónimas. No se presenta como un catálogo nacional oficial completo ni se ha cargado en producción.
