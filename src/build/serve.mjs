import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { root } from './model.mjs';

const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
export function createPreviewServer() {
  return http.createServer((req,res)=>{
    let route;
    try {route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}
    catch {res.writeHead(400);res.end('Invalid URL');return;}
    let file=path.resolve(root,'.'+route);
    const relative=path.relative(root,file);
    if(relative.startsWith('..') || path.isAbsolute(relative) || route.split('/').some(part=>part.startsWith('.')||part==='node_modules') || !['GET','HEAD'].includes(req.method)) {
      res.writeHead(403);res.end('Forbidden');return;
    }
    if(fs.existsSync(file)&&fs.statSync(file).isDirectory()) {
      if(!route.endsWith('/')){res.writeHead(308,{Location:route+'/'});res.end();return;}
      file=path.join(file,'index.html');
    }
    const exists=fs.existsSync(file)&&fs.statSync(file).isFile();
    const status=exists?200:404;
    if(!exists)file=path.join(root,'404.html');
    const extension=path.extname(file);
    if(!types[extension]){res.writeHead(403);res.end('Unsupported file');return;}
    res.writeHead(status,{'Content-Type':types[extension],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:fs.readFileSync(file));
    console.log(`[preview] ${req.method} ${route} ${status}`);
  });
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const server=createPreviewServer();
  const port=Number(process.env.PORT||4321);
  server.on('error',error=>{console.error('[preview] FAILED',error.stack);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`[preview] http://127.0.0.1:${port}/`));
  process.on('SIGINT',()=>server.close());
}
