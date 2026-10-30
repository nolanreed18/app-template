// Runs every smoke test (each *.mjs here but lib and run) in its own process and reports. `node tools/build.mjs && node tools/smoke/run.mjs`;
// exits 1 on any failure. Add a test file, or a check in one, whenever a feature lands.
import {spawnSync} from 'node:child_process';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),tests=fs.readdirSync(dir).filter(f=>f.endsWith('.mjs')&&!['lib.mjs','run.mjs'].includes(f)).sort((a,b)=>(a!=='sanity.mjs')-(b!=='sanity.mjs')||a.localeCompare(b));
const failed=[];for(const t of tests){console.log('\n== '+t.slice(0,-4));const r=spawnSync(process.execPath,[path.join(dir,t)],{stdio:'inherit'});if(r.status!==0)failed.push(t.slice(0,-4))}
console.log('\n'+(failed.length?'FAILED: '+failed.join(', '):'all '+tests.length+' smoke tests passed'));process.exit(failed.length?1:0);
