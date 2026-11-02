import {test} from "node:test";import {strict as assert} from "node:assert";import {mkdtempSync,writeFileSync,rmSync} from "node:fs";import {tmpdir} from "node:os";import {join} from "node:path";import {spawnSync} from "node:child_process";
test("importador filtra país y localidades sin escribir base de datos",()=>{
 const dir=mkdtempSync(join(tmpdir(),"micontacto-"));
 try{
  const row=(id,country,feature)=>{const f=Array(19).fill("");f[0]=id;f[1]="Santiago";f[6]=feature;f[7]="PPL";f[8]=country;f[10]="01";f[11]="001";return f.join("\t")};
  for(const [name,data] of [["PA.txt",[row("1","PA","P"),row("2","CO","P"),row("3","PA","A")].join("\n")],["admin1.txt","PA.01\tVeraguas\tVeraguas\t1"],["admin2.txt","PA.01.001\tSantiago\tSantiago\t2"]])writeFileSync(join(dir,name),data);
  const r=spawnSync(process.execPath,["scripts/import-geonames.mjs","PA",join(dir,"PA.txt"),join(dir,"admin1.txt"),join(dir,"admin2.txt")],{encoding:"utf8"});
  assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/Veraguas/);assert.equal(r.stdout.trim().split("\n").length,2);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
