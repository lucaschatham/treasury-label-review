import {defineConfig,loadEnv} from 'vite';
import handler from './api/warning-appearance.js';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'WARNING_');
 Object.assign(process.env,env);
 return {plugins:[{name:'local-warning-api',configureServer(server){server.middlewares.use('/api/warning-appearance',(req,res)=>handler(req,res));}}]};
});
