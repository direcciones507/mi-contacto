// Offline GeoNames country importer. Produces CSV for review, never writes a database.
// Usage: node scripts/import-geonames.mjs PA ./data/PA.txt ./data/admin1CodesASCII.txt ./data/admin2Codes.txt > PA-localities.csv
import {createReadStream,readFileSync} from "node:fs";
import {createInterface} from "node:readline";
const [country,file,admin1file,admin2file]=process.argv.slice(2);
const allowed=new Set(["PA","CR","NI","SV","HN","GT","MX","CO"]);
if(!allowed.has(country)||!file||!admin1file||!admin2file){console.error("Usage: node scripts/import-geonames.mjs COUNTRY COUNTRY.txt admin1CodesASCII.txt admin2Codes.txt");process.exit(2);}
const load=(path)=>new Map(readFileSync(path,"utf8").split(/\r?\n/).filter(Boolean).map(line=>{const cols=line.split("\t");return [cols[0],cols[1]];}));
const adm1=load(admin1file),adm2=load(admin2file);
const quote=s=>'"'+String(s??"").replaceAll('"','""')+'"';
const csv=row=>process.stdout.write(row.map(quote).join(",")+"\n");
csv(["country","geoname_id","locality","admin1_code","admin1_name","admin2_code","admin2_name","feature_code"]);
let accepted=0,skipped=0,missingAdmin1=0;
for await (const line of createInterface({input:createReadStream(file),crlfDelay:Infinity})){
 const f=line.split("\t");
 if(f.length<19||f[8]!==country||f[6]!=="P"){skipped++;continue;}
 const [id,name,,,,,,feature]=f;const a1=f[10],a2=f[11];
 if(!a1||!adm1.has(country+"."+a1)){missingAdmin1++;continue;}
 csv([country,id,name,a1,adm1.get(country+"."+a1),a2,adm2.get(country+"."+a1+"."+a2)||"",feature]);accepted++;
}
console.error(JSON.stringify({country,accepted,skipped,missingAdmin1,reviewRequired:true}));
