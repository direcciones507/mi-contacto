import {allowedPhotoBucket} from './provider-reuse.js';
import sharp from 'sharp';
export const MAX_PHOTO_BYTES=5*1024*1024;
export async function preparePhoto(bytes,mime){
 if(!['image/jpeg','image/png','image/webp'].includes(mime)||!bytes?.length||bytes.length>MAX_PHOTO_BYTES)throw Error('INVALID_PHOTO');
 try{
  const image=sharp(bytes,{limitInputPixels:20_000_000,failOn:'warning',animated:true});
  const metadata=await image.metadata();
  if((metadata.pages??1)>1||!['jpeg','png','webp'].includes(metadata.format)||mime!==`image/${metadata.format}`)throw Error();
  return await image.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer();
 }catch{throw Error('INVALID_PHOTO');}
}
export const validPhotoKey=k=>typeof k==='string'&&/^mi-contacto\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/.test(k);
const keyOK=validPhotoKey;
export function memoryPhotoStorage(){
 const objects=new Map();return {async put(key,bytes){if(!keyOK(key))throw Error('INVALID_OBJECT_KEY');objects.set(key,Buffer.from(bytes));},async get(key){if(!keyOK(key))throw Error('INVALID_OBJECT_KEY');return objects.get(key)??null;},async delete(key){if(!keyOK(key))throw Error('INVALID_OBJECT_KEY');objects.delete(key);}};
}
/** Explicit, private, dedicated bucket only. No credentials or production configuration discovery. */
export function isolatedObjectStorage({client,bucket,isolated=false,reuseExistingBucket=false}){
 if(!isolated||!allowedPhotoBucket(bucket,{reuseExistingBucket})||!client?.putObject||!client?.getObject||!client?.deleteObject)throw Error('ISOLATED_STORAGE_REQUIRED');
 return {async put(key,bytes){if(!keyOK(key))throw Error('INVALID_OBJECT_KEY');await client.putObject({bucket,key,body:bytes,contentType:'image/webp',public:false});},async get(key){if(!keyOK(key))throw Error('INVALID_OBJECT_KEY');const bytes=await client.getObject({bucket,key});if(bytes==null)return null;if((!Buffer.isBuffer(bytes)&&!(bytes instanceof Uint8Array))||bytes.length>MAX_PHOTO_BYTES)throw Error('INVALID_STORED_PHOTO');return Buffer.from(bytes);},async delete(key){if(!keyOK(key))throw Error('INVALID_OBJECT_KEY');await client.deleteObject({bucket,key});}};
}
