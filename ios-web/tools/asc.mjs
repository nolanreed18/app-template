// App Store Connect API helper: node tools/asc.mjs <METHOD> <path under /v1> [body.json]. Prints the status and the response.
// The key and the proxy handling are in tools/asc-lib.mjs. Example: node tools/asc.mjs GET /ciWorkflows/<id> (ids in tools/ship.config.json).
import fs from 'node:fs';import {asc,proxyReexec,keyProblem,setupHint} from './asc-lib.mjs';
proxyReexec();
const [method,path,bodyFile]=process.argv.slice(2);
if(!method||!path){console.log('usage: node tools/asc.mjs <METHOD> <path under /v1> [body.json]');process.exit(1)}
const k=keyProblem();if(k){console.log('SETUP: '+k);process.exit(3)}
const r=await asc(method,path,bodyFile?fs.readFileSync(bodyFile,'utf8'):undefined);
console.log(r.status);console.log(r.text);process.exit(r.status>=200&&r.status<300?0:setupHint(r)?3:1);
