/** Bound scrypt memory and waiting work within the existing 0.5 GB instance. */
export function passwordWork({parallel=2,waiting=8}={}){
 let active=0;const queue=[];
 return async function run(work){
  if(active>=parallel){if(queue.length>=waiting)throw Error('AUTH_BUSY');await new Promise(resolve=>queue.push(resolve));}
  else active++;
  try{return await work();}finally{const next=queue.shift();if(next)next();else active--;}
 };
}
