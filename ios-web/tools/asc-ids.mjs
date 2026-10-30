// Finds this app's App Store Connect ids by the bundle id in app/capacitor.config.json and checks the Xcode Cloud workflow's shape.
//   node tools/asc-ids.mjs              print what it finds
//   node tools/asc-ids.mjs --write      also write them into tools/ship.config.json (ids are not secrets: commit it)
//   node tools/asc-ids.mjs --fix-branch set the workflow's start condition back to branch changes on testflight (saving the workflow on
//                                       the website can clear it)
// Needs the key (tools/asc-lib.mjs) and, from PLAYBOOK.md, the app record, the internal and external groups and the "TestFlight" workflow.
// The API cannot read or add post-actions: those live only on the website (or Xcode's Manage Workflows).
// Exit 0 when every id was found and the workflow looks right, 1 when something is missing, 3 when the key is not set up.
import fs from 'node:fs';import {asc,proxyReexec,CFG,CFG_FILE,PH,keyProblem,issuer,setupHint,why} from './asc-lib.mjs';
proxyReexec();
const bundle=JSON.parse(fs.readFileSync(new URL('../app/capacitor.config.json',import.meta.url),'utf8')).appId,arg=a=>process.argv.includes(a);
{const k=keyProblem();if(k){console.log('SETUP: '+k);process.exit(3)}}
// GET: null on 404 or (noted) any other refusal, so one closed endpoint does not hide the rest; a key or network problem stops here.
async function get(p){const r=await asc('GET',p);if(r.status===404)return null;const h=setupHint(r);if(h){console.log('SETUP: '+h);process.exit(3)}
 if(r.status!==200){console.log('  note GET '+p+' -> '+r.status+why(r));return null}return r.json}
const bad=[],say=(ok,s)=>{console.log((ok?'  ok   ':'  MISS ')+s);if(!ok)bad.push(s)};
const app=((await get('/apps?filter[bundleId]='+encodeURIComponent(bundle)))?.data||[])[0];
say(!!app,'app record for '+bundle+(app?': '+app.attributes.name+' ('+app.id+')':' (App Store Connect → Apps → +, PLAYBOOK.md step 4)'));
if(!app)process.exit(1);
const groups=(await get('/betaGroups?filter[app]='+app.id+'&limit=200'))?.data||[];
const pick=(internal,name)=>{const g=groups.filter(x=>!!x.attributes.isInternalGroup===internal);return g.find(x=>x.attributes.name===name)||(g.length===1?g[0]:null)};
const gi=pick(true,CFG.groups.internal.name),ge=pick(false,CFG.groups.external.name);
say(!!gi,'internal group'+(gi?' "'+gi.attributes.name+'" ('+gi.id+')':' "'+CFG.groups.internal.name+'"'));
say(!!ge,'external group'+(ge?' "'+ge.attributes.name+'" ('+ge.id+')':' "'+CFG.groups.external.name+'"'));
if(ge)say(!!ge.attributes.publicLinkEnabled,'public link '+(ge.attributes.publicLink||'(turn it on in the group)'));
let prod=(await get('/apps/'+app.id+'/ciProduct'))?.data;
if(!prod)prod=((await get('/ciProducts?include=app&limit=200'))?.data||[]).find(x=>x.relationships?.app?.data?.id===app.id);
say(!!prod,'Xcode Cloud product'+(prod?' ('+prod.id+')':' (create the workflow in Xcode once, PLAYBOOK.md step 8)'));
const wfs=prod?(await get('/ciProducts/'+prod.id+'/workflows?limit=200'))?.data||[]:[];
const wf=wfs.find(w=>w.attributes.name==='TestFlight')||(wfs.length===1?wfs[0]:null);say(!!wf,'workflow'+(wf?' "'+wf.attributes.name+'" ('+wf.id+')':' "TestFlight"'));
if(wf){const a=wf.attributes,pats=()=>(a.branchStartCondition?.source?.patterns||[]).map(p=>p.pattern+(p.isPrefix?'*':''));
 let ok=pats().length===1&&pats()[0]==='testflight';
 if(!ok&&arg('--fix-branch')){const c=a.branchStartCondition||{filesAndFoldersRule:{mode:'START_IF_ANY_FILE_MATCHES',matchers:[]},autoCancel:true};
  c.source={isAllMatch:false,patterns:[{pattern:'testflight',isPrefix:false}]};
  const r=await asc('PATCH','/ciWorkflows/'+wf.id,{data:{type:'ciWorkflows',id:wf.id,attributes:{branchStartCondition:c}}});
  console.log('  set the start condition: '+r.status+(r.status>=300?' '+r.text.slice(0,240):''));if(r.status<300){a.branchStartCondition=r.json?.data?.attributes?.branchStartCondition||c;ok=pats().length===1&&pats()[0]==='testflight'}}
 say(ok,'starts on branch changes to testflight only (has: '+(pats().join(', ')||'no branch condition')+(ok?')':'; a website save can clear it: --fix-branch sets it)'));
 const ar=(a.actions||[]).find(x=>x.actionType==='ARCHIVE');say(ar?.buildDistributionAudience==='APP_STORE_ELIGIBLE','archive audience "TestFlight and App Store" (has: '+(ar?ar.buildDistributionAudience:'no archive action')+')');
 say(a.isEnabled!==false,'workflow enabled')}
console.log('  note the post-actions (TestFlight Internal Testing and External Testing) are not in the API: check them on the website');
if(arg('--write')){
 if(app)CFG.appId=app.id;if(wf)CFG.workflowId=wf.id;if(gi)CFG.groups.internal={id:gi.id,name:gi.attributes.name};if(ge)CFG.groups.external={id:ge.id,name:ge.attributes.name};
 if(PH(CFG.issuer)&&issuer())CFG.issuer=issuer();
 fs.writeFileSync(CFG_FILE,JSON.stringify(CFG,null,2)+'\n');console.log('wrote tools/ship.config.json')}
process.exit(bad.length?1:0);
