import {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {isolatedObjectStorage,MAX_PHOTO_BYTES} from './photo-storage.js';
export function r2PhotoStorage({accountId,accessKeyId,secretAccessKey,bucket,isolated=false,client}={}){
 if(!/^[a-f0-9]{32}$/.test(accountId??'')||!accessKeyId||!secretAccessKey)throw Error('R2_CONFIGURATION_REQUIRED');
 const s3=client??new S3Client({region:'auto',endpoint:`https://${accountId}.r2.cloudflarestorage.com`,credentials:{accessKeyId,secretAccessKey},maxAttempts:3});
 return isolatedObjectStorage({bucket,isolated,client:{
  async putObject({bucket,key,body,contentType}){await s3.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:body,ContentType:contentType,CacheControl:'private, no-store'}));},
  async getObject({bucket,key}){try{const r=await s3.send(new GetObjectCommand({Bucket:bucket,Key:key}));if(r.ContentLength>MAX_PHOTO_BYTES){r.Body?.destroy?.();throw Error('INVALID_STORED_PHOTO');}const parts=[];let size=0;for await(const part of r.Body){size+=part.length;if(size>MAX_PHOTO_BYTES){r.Body.destroy?.();throw Error('INVALID_STORED_PHOTO');}parts.push(Buffer.from(part));}return Buffer.concat(parts);}catch(e){if(e.name==='NoSuchKey'||e.$metadata?.httpStatusCode===404)return null;throw e;}},
  async deleteObject({bucket,key}){await s3.send(new DeleteObjectCommand({Bucket:bucket,Key:key}));}
 }});
}
