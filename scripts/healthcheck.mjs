const port=Number(process.env.PORT??3000);
if(!Number.isInteger(port)||port<1||port>65535)process.exit(1);
try{const r=await fetch('http://127.0.0.1:'+port+'/health/ready',{signal:AbortSignal.timeout(4000)});if(!r.ok||(await r.json()).status!=='ready')process.exit(1);}catch{process.exit(1);}
