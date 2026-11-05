/** Explicit reuse of existing provider accounts; never aliases users, sessions or databases. */
export function allowedEmailSender(from,{reuseExistingSender=false}={}){
 return typeof from==='string'&&(/^[a-zA-Z0-9._%+-]+@(?:mail\.)?micontacto\.online$/.test(from)||reuseExistingSender&&from==='mi-contacto@mail.direcciones507.com');
}
export function allowedPhotoBucket(bucket,{reuseExistingBucket=false}={}){
 return typeof bucket==='string'&&(/^mi-contacto-[a-z0-9][a-z0-9-]{1,48}$/.test(bucket)||reuseExistingBucket&&bucket==='direcciones507-media');
}
