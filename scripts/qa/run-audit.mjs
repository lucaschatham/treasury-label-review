import {preview} from 'vite';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const server=await preview({preview:{host:'127.0.0.1',port:0}});
try {
  const url=`http://127.0.0.1:${server.httpServer.address().port}`;
  const code=await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[fileURLToPath(new URL('./audit-workflows.mjs',import.meta.url)),url,process.argv[2]||'evidence/audit-latest.json'],{
      stdio:'inherit',env:{...process.env,AUDIT_FAULTS:'1'},
    });
    child.once('error',reject);child.once('exit',code=>resolve(code ?? 1));
  });
  process.exitCode=code;
}finally{await new Promise((resolve,reject)=>server.httpServer.close(error=>error?reject(error):resolve()));}
