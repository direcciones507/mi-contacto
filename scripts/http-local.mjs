import {createServer} from 'node:http';
export async function serveLocal(factory){
 let app;const server=createServer(async(req,res)=>{try{
  const chunks=[];let size=0;for await(const part of req){size+=part.length;if(size>6*1024*1024){res.writeHead(413);res.end();return;}chunks.push(part);}
  const request=new Request(origin+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
  const reply=await app.handle(request);res.statusCode=reply.status;
  for(const[k,v]of reply.headers)if(k!=='set-cookie')res.setHeader(k,v);
  const cookies=reply.headers.getSetCookie();if(cookies.length)res.setHeader('set-cookie',cookies);
  res.end(Buffer.from(await reply.arrayBuffer()));
 }catch{res.writeHead(503,{'cache-control':'no-store'});res.end('Servicio no disponible');}});
 server.requestTimeout=20000;server.headersTimeout=10000;
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 try{app=await factory(origin);}catch(e){server.close();throw e;}
 return {origin,app,async close(){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
