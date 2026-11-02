import {constants} from 'node:fs';
import {mkdir,lstat,readdir,open,link,unlink} from 'node:fs/promises';
import {resolve,isAbsolute,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {validPhotoKey,MAX_PHOTO_BYTES} from './photo-storage.js';
/** Dedicated private directory only. Nothing is discovered from env or other projects. */
export async function localPhotoStorage({root,isolated=false}={}){
 if(!isolated||typeof root!=='string'||!isAbsolute(root)||resolve(root)==='/')throw Error('ISOLATED_STORAGE_REQUIRED');
 root=resolve(root);await mkdir(root,{recursive:true,mode:0o700});
 async function checkRoot(){const s=await lstat(root);if(!s.isDirectory()||s.isSymbolicLink()||(s.mode&0o077)!==0)throw Error('PRIVATE_STORAGE_REQUIRED');}
 await checkRoot();const marker=join(root,'.mi-contacto-storage');
 const entries=await readdir(root);if(entries.length&&!entries.includes('.mi-contacto-storage'))throw Error('STORAGE_NOT_EMPTY');
 try{const f=await open(marker,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);try{await f.writeFile('mi-contacto-private-v1\n');await f.sync();}finally{await f.close();}}catch(e){if(e.code!=='EEXIST')throw e;}
 const m=await open(marker,constants.O_RDONLY|constants.O_NOFOLLOW);try{if(await m.readFile('utf8')!=='mi-contacto-private-v1\n')throw Error('INVALID_STORAGE_MARKER');}finally{await m.close();}
 function file(key){if(!validPhotoKey(key))throw Error('INVALID_OBJECT_KEY');return join(root,createHash('sha256').update(key).digest('hex')+'.webp');}
 return {
  async put(key,bytes){const target=file(key);if(!Buffer.isBuffer(bytes)&&!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>MAX_PHOTO_BYTES)throw Error('INVALID_STORED_PHOTO');await checkRoot();const temp=join(root,'.pending-'+randomUUID());let f;
   try{f=await open(temp,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);await f.writeFile(bytes);await f.sync();await f.close();f=null;await link(temp,target);const dir=await open(root,constants.O_RDONLY);try{await dir.sync();}finally{await dir.close();}}
   finally{if(f)await f.close();await unlink(temp).catch(e=>{if(e.code!=='ENOENT')throw e;});}
  },
  async get(key){const target=file(key);await checkRoot();let f;try{f=await open(target,constants.O_RDONLY|constants.O_NOFOLLOW);const s=await f.stat();if(!s.isFile()||s.size>MAX_PHOTO_BYTES||(s.mode&0o077)!==0)throw Error('INVALID_STORED_PHOTO');return await f.readFile();}catch(e){if(e.code==='ENOENT')return null;throw e;}finally{if(f)await f.close();}},
  // Reserved storage primitive; never invoked by runtime without an approved deletion policy.
  async delete(key){file(key);throw Error('PHYSICAL_DELETION_DISABLED');}
 };
}
