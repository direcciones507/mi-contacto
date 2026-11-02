import {randomBytes} from 'node:crypto';
import {localDatabase} from './local-database.mjs';
import {serveLocal} from './http-local.mjs';
import {createApplication} from '../application.js';
const local=await localDatabase();await local.migrate();
if(process.argv.includes('--catalog')){const {loadCatalog}=await import('./load-catalog.mjs');await loadCatalog(local.pool);}
const server=await serveLocal(origin=>createApplication({pool:local.pool,origin,secret:randomBytes(48).toString('hex')}));
console.log('Mi Contacto local y efímero: '+server.origin+' — sin Google ni pagos; no uses datos reales.');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await server.close();await local.pool.close();process.exit(0);});
