import sharp from 'sharp';
sharp.concurrency(1);sharp.cache({memory:16,files:0,items:20});
// Generated on every authorized delivery, including old photographs and thumbnails.
// Originals stay in private storage; no unmarked media delivery endpoint exists.
export async function publicPhoto(bytes){
 const {width,height}=await sharp(bytes,{limitInputPixels:20_000_000}).metadata();
 if(!width||!height)throw Error('INVALID_PHOTO');
 const size=Math.max(1,Math.min(width,height)/9);
 const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g opacity="0.30"><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="${size}" font-weight="bold" fill="white" stroke="black" stroke-width="${size/35}" paint-order="stroke">Mi Contacto</text></g></svg>`);
 return sharp(bytes,{limitInputPixels:20_000_000}).composite([{input:svg}]).webp({quality:85}).toBuffer();
}
