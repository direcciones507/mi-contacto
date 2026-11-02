// Validates offline CSV output from import-geonames.mjs, without writing to DB.
// Usage: node scripts/validate-geonames-csv.mjs PA-localities.csv
import {readFileSync} from "node:fs";
const path=process.argv[2];if(!path){console.error("Usage: node scripts/validate-geonames-csv.mjs file.csv");process.exit(2);}
function parseCsv(s){const rows=[];let row=[],field="",quoted=false;for(let i=0;i<s.length;i++){const c=s[i];if(quoted){if(c==='"'&&s[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(field);field="";}else if(c==='\n'){row.push(field.replace(/\r$/,""));rows.push(row);row=[];field="";}else field+=c;}if(quoted)throw Error("UNCLOSED_CSV_QUOTE");if(field||row.length){row.push(field);rows.push(row);}return rows;}
const rows=parseCsv(readFileSync(path,"utf8"));const expected=["country","geoname_id","locality","admin1_code","admin1_name","admin2_code","admin2_name","feature_code"];
if(JSON.stringify(rows.shift())!==JSON.stringify(expected))throw Error("INVALID_HEADER");
const countries=new Set(["PA","CR","NI","SV","HN","GT","MX","CO"]),seen=new Set();let duplicates=0,invalid=0,missingAdmin2=0;
for(const r of rows){if(r.length!==8||!countries.has(r[0])||!/^\d+$/.test(r[1])||!r[2]?.trim()||!r[3]?.trim()||!r[4]?.trim()||!r[7]?.startsWith("PPL")){invalid++;continue;}const key=r[0]+":"+r[1];if(seen.has(key))duplicates++;seen.add(key);if(!r[5]||!r[6])missingAdmin2++;}
const report={rows:rows.length,uniqueIds:seen.size,duplicates,invalid,missingAdmin2,readyForManualReview:invalid===0&&duplicates===0};console.log(JSON.stringify(report,null,2));if(invalid||duplicates)process.exitCode=1;
