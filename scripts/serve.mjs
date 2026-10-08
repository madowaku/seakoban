import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,resolve,join,sep} from 'node:path';
const root=resolve(import.meta.dirname,'..'),port=Number(process.env.PORT||5173);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
createServer(async(req,res)=>{
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const full=resolve(join(root,path==='/'?'index.html':path.slice(1)));
 if(!full.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{const body=await readFile(full);res.writeHead(200,{'Content-Type':types[extname(full)]||'text/plain'}).end(body);}
 catch{res.writeHead(404).end('Not found');}
}).listen(port,()=>console.log(`SEAKOBAN: http://localhost:${port}`));