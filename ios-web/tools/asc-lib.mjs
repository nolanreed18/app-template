// App Store Connect API client shared by tools/asc.mjs, tools/asc-ids.mjs and tools/ship-status.mjs. Ids live in tools/ship.config.json.
// The key: in a cloud session, ASC_KEY_ID, ASC_KEY_P8 and ASC_ISSUER_ID (an App Manager key, saved as environment variables in the cloud
// environment's settings); on the Mac, the Admin upload key at ~/.appstoreconnect/private_keys/AuthKey_<macKeyId>.p8, which never leaves it.
// Nothing here ever prints the key.
import fs from 'node:fs';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';
export const CFG_FILE=new URL('./ship.config.json',import.meta.url);
export const CFG=JSON.parse(fs.readFileSync(CFG_FILE,'utf8'));
// A value still holding a template placeholder (two underscores, capitals, two underscores), and the config paths that do.
export const PH=v=>typeof v!=='string'||!v||/__[A-Z][A-Z0-9_]*__/.test(v);
export const unset=(...paths)=>paths.filter(k=>PH(k.split('.').reduce((o,p)=>o&&o[p],CFG)));
// Node's fetch ignores HTTPS_PROXY unless NODE_USE_ENV_PROXY is set when the process starts (Node 22.21+), so behind the cloud proxy the
// script runs itself again once with it. The Mac has no proxy and never re-runs.
export function proxyReexec(){if(!(process.env.HTTPS_PROXY||process.env.https_proxy)||process.env.NODE_USE_ENV_PROXY)return;
 const r=spawnSync(process.execPath,process.argv.slice(1),{stdio:'inherit',env:{...process.env,NODE_USE_ENV_PROXY:'1',NODE_NO_WARNINGS:'1'}});process.exit(r.status??1)}
// An environment variable may hold the .p8 as pasted (newlines, literal \n, or one line) or as base64 of the file: rebuild the PEM either way.
function pem(v){let s=v.trim();if(!s.includes('BEGIN')){try{const d=Buffer.from(s,'base64').toString('utf8');if(d.includes('BEGIN'))s=d}catch{}}
 const body=s.replace(/\\n/g,'\n').replace(/-----(BEGIN|END) PRIVATE KEY-----/g,'').replace(/\s+/g,'');
 return '-----BEGIN PRIVATE KEY-----\n'+(body.match(/.{1,64}/g)||[]).join('\n')+'\n-----END PRIVATE KEY-----\n'}
export function keySource(){return process.env.ASC_KEY_P8&&process.env.ASC_KEY_ID?'env':'mac'}
const macKeyFile=()=>(process.env.HOME||'')+'/.appstoreconnect/private_keys/AuthKey_'+CFG.macKeyId+'.p8';
export const issuer=()=>process.env.ASC_ISSUER_ID||(PH(CFG.issuer)?'':CFG.issuer);
// What stops an API call before any network: no key or no issuer id. null when ready.
export function keyProblem(){const p=[];
 if(keySource()==='mac'&&(PH(CFG.macKeyId)||!fs.existsSync(macKeyFile())))p.push('no App Store Connect key: set ASC_KEY_ID and ASC_KEY_P8 in the cloud environment\'s settings (environment variables), or run on the Mac with its key at ~/.appstoreconnect/private_keys and macKeyId in tools/ship.config.json');
 if(!issuer())p.push('no issuer id: set ASC_ISSUER_ID in the environment, or issuer in tools/ship.config.json (App Store Connect → Users and Access → Integrations, top of the page)');
 return p.length?p.join('; '):null}
function key(){const k=keyProblem();if(k)throw new Error(k);
 return keySource()==='env'?{kid:process.env.ASC_KEY_ID,key:pem(process.env.ASC_KEY_P8)}:{kid:CFG.macKeyId,key:fs.readFileSync(macKeyFile())}}
export function jwt(){const{kid,key:k}=key(),b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url'),now=Math.floor(Date.now()/1000);
 const h=b64({alg:'ES256',kid,typ:'JWT'}),p=b64({iss:issuer(),iat:now,exp:now+900,aud:'appstoreconnect-v1'});
 return h+'.'+p+'.'+crypto.sign('sha256',Buffer.from(h+'.'+p),{key:k,dsaEncoding:'ieee-p1363'}).toString('base64url')}
let tok=null,tokAt=0;
// One call: {status, text, json}. A fresh token every ten minutes (they last fifteen); a network failure comes back as status 0.
export async function asc(method,path,body){if(!tok||Date.now()-tokAt>600e3){tok=jwt();tokAt=Date.now()}
 try{const r=await fetch('https://api.appstoreconnect.apple.com/v1'+path,{method,headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},body:body==null?undefined:typeof body==='string'?body:JSON.stringify(body)});
  const text=await r.text();let json=null;try{json=JSON.parse(text)}catch{}return{status:r.status,text,json}}
 catch(e){return{status:0,text:'network: '+(e.cause?.code||e.cause?.message||e.message)+' (is api.appstoreconnect.apple.com in the environment\'s Allowed domains?)',json:null}}}
// What a refused call means for setup, or null when it is an ordinary error. A 403 is not always the key's role: Apple answers 403 on
// some endpoints to every key (GET /builds/<id>/betaGroups, Oct 30), so it stays an ordinary error that names the path.
export function setupHint(r){return r.status===0?r.text:r.status===401?'the key was refused (401): check ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_P8 belong together':null}
export const why=r=>r.status===403?' (403: the key\'s role is short of App Manager, or Apple closes this endpoint to API keys; try another route to the same data)':'';
