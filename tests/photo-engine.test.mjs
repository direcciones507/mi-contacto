import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {preparePhoto} from '../photo-storage.js';
test('JPG PNG WebP se decodifican, comprimen y pierden metadatos privados',async()=>{
 for(const[format,mime]of[['jpeg','image/jpeg'],['png','image/png'],['webp','image/webp']]){
  const bytes=await sharp({create:{width:1800,height:900,channels:3,background:'#155eb1'}}).withMetadata({exif:{IFD0:{Copyright:'synthetic-private-metadata'}}})[format]().toBuffer();
  const result=await preparePhoto(bytes,mime),meta=await sharp(result).metadata();assert.equal(meta.format,'webp');assert.ok(meta.width<=1600);assert.equal(meta.exif,undefined);
 }
});
test('MIME falso, SVG y WebP animado se rechazan antes del almacenamiento',async()=>{
 const png=await sharp({create:{width:8,height:8,channels:3,background:'#155eb1'}}).png().toBuffer();await assert.rejects(preparePhoto(png,'image/jpeg'),/INVALID_PHOTO/);await assert.rejects(preparePhoto(Buffer.from('<svg/>'),'image/svg+xml'),/INVALID_PHOTO/);
 const frames=Buffer.concat([Buffer.alloc(12*4*3,0),Buffer.alloc(12*4*3,255)]),animation=await sharp(frames,{raw:{width:12,height:8,pageHeight:4,channels:3}}).webp({loop:0}).toBuffer();await assert.rejects(preparePhoto(animation,'image/webp'),/INVALID_PHOTO/);
});
