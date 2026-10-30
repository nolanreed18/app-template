// Shared harness for the smoke tests: a headless Chromium on the built index.html (a phone-sized touch screen by default), page errors
// collected, checks counted. Run `node tools/build.mjs` first. PW_CORE points at a playwright or playwright-core package, as a folder or
// its index.js (cloud sessions have /opt/node-tools/node_modules/playwright; on a Mac `npm i -g playwright-core` and use
// `PW_CORE=$(npm root -g)/playwright-core PW_CHANNEL=chrome`, which drives the installed Chrome).
import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath,pathToFileURL} from 'node:url';
const pw=createRequire(import.meta.url)(process.env.PW_CORE||'/opt/node-tools/node_modules/playwright');
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
export const URL=pathToFileURL(path.join(ROOT,'index.html')).href;
let fails=0,checks=0;
export function check(name,ok,info){checks++;if(ok)console.log('  ok  '+name);else{fails++;console.log('  FAIL '+name+(info!==undefined?' :: '+JSON.stringify(info):''))}}
export async function open(o={}){const touch=o.touch!==false;
 const b=await pw.chromium.launch({channel:process.env.PW_CHANNEL||undefined,args:['--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage({viewport:o.viewport||{width:402,height:874},deviceScaleFactor:2,hasTouch:touch,isMobile:touch});const errs=[];
 p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
 // Waits on the app, never the clock: polls a page predicate until it holds or ms pass. Frames move the app and a loaded machine runs
 // fewer of them, so fixed sleeps were flaky (Lodebreaker, Oct 28, at a load average of 30). Use it for every wait.
 p.until=async(pred,ms=10000,arg)=>{for(let t=0;t<ms;t+=100){if(await p.evaluate(([f,a])=>{try{return !!(0,eval)('('+f+')')(a)}catch(e){return false}},[pred.toString(),arg]))return true;await p.waitForTimeout(100)}return false};
 p.booted=()=>p.until(()=>typeof frames==='number'&&frames>2);
 await p.goto(URL);if(!await p.booted())errs.push('the app did not start drawing frames');
 return{b,p,errs,done:async name=>{check(name+': no page errors',errs.length===0,errs.slice(0,5));await b.close();console.log(fails?`${fails} of ${checks} checks failed`:`${checks} checks passed`);process.exit(fails?1:0)}}}
