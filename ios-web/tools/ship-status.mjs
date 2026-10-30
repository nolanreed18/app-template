// Where a ship stands: the Xcode Cloud run for a commit, its TestFlight build, both tester groups, Beta App Review, and the web build.
//   node tools/ship-status.mjs [sha] [--wait] [--fix]
// sha defaults to origin/testflight. --wait polls every 30 s for up to 45 minutes until the build is in both groups and testable (or fails).
// --fix adds a VALID build missing from a group and submits it for Beta App Review (the Xcode Cloud post-actions normally do both).
// Exit 0: out to both groups. 1: failed. 2: still pending (or --wait ran out). 3: not set up (key, ids or a blocked host; the SETUP lines
// say which). The web line is checked either way, so a web-only app gets it from day one (--wait then waits up to 10 minutes for the web).
import {execSync} from 'node:child_process';import {asc,proxyReexec,CFG,PH,unset,keyProblem,keySource,setupHint,why} from './asc-lib.mjs';
proxyReexec();
const args=process.argv.slice(2),WAIT=args.includes('--wait'),FIX=args.includes('--fix'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const git=c=>{try{return execSync('git '+c,{stdio:['ignore','pipe','ignore']}).toString().trim()}catch{return ''}};
let sha=args.find(a=>!a.startsWith('--'))||git('rev-parse origin/testflight')||git('rev-parse HEAD');sha=git('rev-parse '+sha)||sha;const short=sha.slice(0,7);
const GI=CFG.groups.internal,GE=CFG.groups.external,setup=[];
{const miss=unset('appId','workflowId','groups.internal.id','groups.external.id');
 if(miss.length)setup.push('tools/ship.config.json still has placeholders: '+miss.join(', ')+' (node tools/asc-ids.mjs --write fills them once the key, the app record, both groups and the Xcode Cloud workflow exist; PLAYBOOK.md)');
 const k=keyProblem();if(k)setup.push(k)}
class Setup extends Error{}
async function get(p){const r=await asc('GET',p);if(r.status===404)return null;const h=setupHint(r);if(h)throw new Setup(h);if(r.status<200||r.status>=300)throw new Error('GET '+p+' -> '+r.status+why(r)+' '+r.text.slice(0,240));return r.json}
async function all(p){let out=[],url=p;while(url){const j=await get(url);if(!j)break;out=out.concat(j.data||[]);const n=j.links&&j.links.next;url=n?n.replace('https://api.appstoreconnect.apple.com/v1',''):null}return out}
async function web(){if(PH(CFG.web))return{ok:false,note:'not set (web in tools/ship.config.json)'};
 try{const r=await fetch(CFG.web+'?t='+Date.now(),{cache:'no-store'}),t=await r.text(),m=t.match(/(?:build \d+\+?|web) · [\d-]+ · ([0-9a-f]{7})/);if(!m)return{ok:false,note:CFG.web+' answered '+r.status+' with no build id'};
  const w=m[1],ok=w===short||git('merge-base --is-ancestor '+short+' '+w+' && echo y')==='y';return{ok,sha:w,note:ok?'serves '+w:'serves '+w+', not yet '+short}}
 catch(e){return{ok:false,note:'unreachable ('+(e.cause?.code||e.cause?.message||e.message)+'; is '+new URL(CFG.web).host+' in the environment\'s Allowed domains?)'}}}
async function snap(){const o={sha:short,web:await web()};
 const runs=(await all('/ciWorkflows/'+CFG.workflowId+'/buildRuns?limit=200')).filter(r=>(r.attributes.sourceCommit?.commitSha||'').startsWith(sha));
 const run=runs.sort((a,b)=>b.attributes.number-a.attributes.number)[0];if(!run)return o;
 const ra=run.attributes;o.run={id:run.id,n:ra.number,progress:ra.executionProgress,status:ra.completionStatus};
 const b=((await get('/ciBuildRuns/'+run.id+'/builds'))||{}).data||[];if(!b.length)return o;const bd=b[0];
 o.build={id:bd.id,version:bd.attributes.version,state:bd.attributes.processingState};
 // A build's groups: Apple answers 403 on /builds/<id>/betaGroups, even to an Admin key (Lodebreaker, Oct 30); the filter works.
 o.groups=(((await get('/betaGroups?filter[builds]='+bd.id))||{}).data||[]).map(g=>g.id);
 const det=((await get('/builds/'+bd.id+'/buildBetaDetail'))||{}).data;o.internal=det?.attributes.internalBuildState;o.external=det?.attributes.externalBuildState;
 const rev=((await get('/builds/'+bd.id+'/betaAppReviewSubmission'))||{}).data;o.review=rev?.attributes.betaReviewState||null;return o}
const LIVE=['IN_BETA_TESTING','BETA_APPROVED'];
function verdict(o){if(o.run&&['FAILED','ERRORED','CANCELED'].includes(o.run.status))return'fail';if(o.build&&['FAILED','INVALID'].includes(o.build.state))return'fail';
 if(o.review==='REJECTED'||o.external==='BETA_REJECTED')return'fail';
 return o.build&&o.build.state==='VALID'&&o.groups.includes(GI.id)&&o.groups.includes(GE.id)&&LIVE.includes(o.external)?'out':'pending'}
async function fix(o){if(!o.build||o.build.state!=='VALID')return;const add=async g=>{if(o.groups.includes(g.id))return;const r=await asc('POST','/betaGroups/'+g.id+'/relationships/builds',{data:[{type:'builds',id:o.build.id}]});console.log('add to '+g.name+': '+r.status)};
 await add(GI);await add(GE);if(o.external==='READY_FOR_BETA_SUBMISSION'){const r=await asc('POST','/betaAppReviewSubmissions',{data:{type:'betaAppReviewSubmissions',relationships:{build:{data:{type:'builds',id:o.build.id}}}}});console.log('submit for beta review: '+r.status+(r.status>=300?' '+r.text.slice(0,200):''))}}
function line(o){const g=o.groups?[GI,GE].map(x=>(o.groups.includes(x.id)?'+':'-')+x.name).join(' '):'groups ?';
 return['commit '+o.sha+' · key '+keySource(),o.run?'Xcode Cloud run '+o.run.n+': '+o.run.progress+(o.run.status?' '+o.run.status:''):'Xcode Cloud: no run for this commit yet',
  o.build?'TestFlight build '+o.build.version+' '+o.build.state+' · '+g+' · external '+(o.external||'?')+(o.review?' · review '+o.review:''):'TestFlight: no build yet','web: '+o.web.note].join('\n')}
const t0=Date.now();let o,v,errs=0;
if(setup.length){for(;;){o=await web();if(!WAIT||o.ok||Date.now()-t0>10*60e3)break;await sleep(30e3)}
 console.log('commit '+short);for(const s of setup)console.log('SETUP: '+s);console.log('web: '+o.note);console.log('NOT SET UP: TestFlight unknown'+(o.ok?'; the web serves this commit':''));process.exit(3)}
for(;;){try{o=await snap();errs=0}
 catch(e){if(e instanceof Setup&&!(WAIT&&errs<3&&/^network/.test(e.message))){console.log('commit '+short+'\nSETUP: '+e.message+'\nNOT SET UP');process.exit(3)}
  if(!WAIT||++errs>3){console.log(String(e.message||e));process.exit(1)}await sleep(30e3);continue}
 if(FIX)await fix(o);v=verdict(o);if(!WAIT||v!=='pending'||Date.now()-t0>45*60e3)break;await sleep(30e3)}
console.log(line(o));console.log(v==='out'?'OUT: in both groups and testable':v==='fail'?'FAILED':'PENDING');process.exit(v==='out'?0:v==='fail'?1:2);
