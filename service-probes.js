import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
/** Writes only two generated test images to one random, dedicated object key. */
export async function probePhotos(storage){
 const key='mi-contacto/'+randomUUID()+'/'+randomUUID()+'.webp';let pending=false;
 try{
  const first=await sharp({create:{width:8,height:8,channels:3,background:'blue'}}).webp().toBuffer();
  const second=await sharp({create:{width:8,height:8,channels:3,background:'white'}}).webp().toBuffer();
  pending=true;await storage.put(key,first);assert.deepEqual(await storage.get(key),first);
  await storage.put(key,second);assert.deepEqual(await storage.get(key),second);
  await storage.delete(key);assert.equal(await storage.get(key),null);pending=false;
  return {upload:true,recovery:true,replacement:true,deletion:true,testObjectsRemaining:0};
 }finally{if(pending)try{await storage.delete(key);}catch{throw Object.assign(Error('TEST_OBJECT_CLEANUP_REQUIRED'),{testObjectKey:key});}}
}
