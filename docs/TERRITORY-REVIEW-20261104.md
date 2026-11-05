# Revisión territorial representativa — 4 noviembre 2026

No se repitió `validate-real-catalog.mjs` ni la importación SQL completa de 392.717 localidades. Se revisaron relaciones representativas y se ejecutó el directorio con ocho perfiles sintéticos, uno por país, usando identificadores reales de la fuente. Motor de pruebas: PostgreSQL WASM, no PostgreSQL nativo. Evidencia: `evidence/real-integrations-20261104/territory-representative.json`.

| País | Recorrido probado | Resultado / anomalía |
|---|---|---|
| Panamá | Veraguas → distrito Santiago → Santiago de Veraguas | Filtro correcto; conservar provincias y comarcas. Poblado no equivale a corregimiento. |
| Colombia | Antioquia → Medellín → Medellín | Filtro correcto, sin mezclar los homónimos de otros departamentos. Etiqueta de primer nivel contempla distrito capital. |
| Costa Rica | San José → cantón San José → San José | Filtro correcto. Se agregaron Monteverde (612) y Puerto Jiménez (613) con fuente oficial; fuente base tenía 82 cantones. |
| Guatemala | Guatemala → municipio Guatemala → Guatemala City | Filtro correcto, 22 departamentos / 340 municipios en fuente base y referencia INE. |
| El Salvador | San Salvador → San Salvador Centro → San Salvador | Corregida localidad que antes dependía directamente del departamento. Se preservan los 44 municipios de la fuente. |
| Honduras | Francisco Morazán → Distrito Central → Tegucigalpa | Filtro correcto; homónimo de Yoro preservado. Referencia INE: 18 departamentos / 298 municipios. |
| Nicaragua | Managua → municipio Managua → Managua | Corregida localidad que antes dependía directamente del departamento. |
| México | Jalisco → municipio Guadalajara → Guadalajara | Filtro correcto, homónimos preservados. Cobertura nacional incompleta: 2.471 municipios/alcaldías en fuente frente a 2.478 reportados por INEGI en junio 2026. |

## Cambios implementados

`data/territory-corrections.json` conserva versión, identificadores originales, padre esperado, destino y fuente. `territory-corrections.js` aplica cambios sin mutar el archivo base. Agrega dos cantones y reasigna solamente cinco localidades: Monte Verde, Santa Elena y Puerto Jiménez en Costa Rica; San Salvador; Managua. No reasigna la localidad homónima Monteverde de Limón.

El cargador aplica la capa al importar. Si un perfil existente referencia una relación territorial que debe cambiar, la FK provoca rollback y se informa `GEO_CHANGE_REQUIRES_PROFILE_RECONCILIATION`; no se trasladan perfiles automáticamente ni se pierden datos. Las opciones de localidad incluyen el municipio/cantón para distinguir homónimos. Los nombres ingleses de provincia/departamento se presentan sin ese sufijo, conservando la fuente.

## Pendientes reales

Faltan equivalencias y cobertura de terceros niveles administrativos: corregimientos de Panamá, distritos de Costa Rica y distritos de El Salvador. El último selector se presenta como ciudad/localidad, sin atribuirle una categoría administrativa que la fuente no demuestra. No se inventan los siete municipios/alcaldías faltantes de México ni se asigna toda Ciudad de México a una sola alcaldía. La asignación completa de poblados a los nuevos cantones de Costa Rica sigue pendiente; solo se corrigieron los IDs verificados. No hay certificación nacional ni revisión humana de todas las localidades.

## Fuentes primarias consultadas

- [Panamá — ANATI, división político-administrativa](https://ignpanama.anati.gob.pa/division-politica-administrativa/).
- [Colombia — DANE, DIVIPOLA](https://www.dane.gov.co/index.php/sistema-estadistico-nacional-sen/normas-y-estandares/nomenclaturas-y-clasificaciones/nomenclaturas/codificacion-de-la-division-politico-administrativa-de-colombia-divipola).
- [Costa Rica — IGN, totales 2024](https://files.snitcr.go.cr/boletines/DTA-TABLA%20POR%20PROVINCIA-CANT%C3%93N-DISTRITO%202024.pdf); [PGR, cantones 612/613](https://www.pgrweb.go.cr/DOCS/NORMAS/1/VIGENTE/D/2020-2029/2025-2029/2025/1953C/17275C.HTML); [Imprenta Nacional, Puerto Jiménez](https://www.imprentanacional.go.cr/gaceta/?date=21%2F06%2F2022).
- [Guatemala — INE, organización territorial](https://www.ine.gob.gt/wp-content/uploads/2023/12/METODOLOGIA-DE-ACTUALIZACION-DINESE.pdf).
- [El Salvador — Asamblea, distribución municipal](https://www.asamblea.gob.sv/sites/default/files/documents/decretos/4194112C-1F6E-4E24-808E-9854A3D081AD.pdf); [Alcaldía San Salvador Centro, distritos](https://sansalvador.gob.sv/contactenos/).
- [Honduras — INE, directorio 2024](https://ine.gob.hn/dee/).
- [Nicaragua — INIDE](https://www.inide.gob.ni/Home/censoEcoUrbano); [Correos, relación departamento/municipio](https://www.correos.gob.ni/postalcode/postalcodes.php).
- [México — INEGI, división territorial 2026](https://www.cuentame.inegi.org.mx/territorio/division/default.aspx?tema=T); [catálogo y equivalencias](https://www.inegi.org.mx/app/ageeml/).
