// Boot, the build id, frames keep coming, a tap (touch and mouse) counts and is saved, the save survives a reload, old and broken saves load.
import {open,check} from './lib.mjs';
const {p,done}=await open();
const ver=await p.textContent('#ver');check('build id shown',/^(build \d+\+?|web) · \d{4}-\d\d-\d\d · \w+$/.test(ver),ver);
const f0=await p.evaluate(()=>frames);check('frames keep coming',await p.until(f=>frames>f+30,8000,f0),f0);
const box=await p.locator('#cv').boundingBox();
await p.touchscreen.tap(box.x+box.width*.25,box.y+box.height*.75);
check('a touch tap counts and is saved',await p.until(()=>S.taps===1&&JSON.parse(localStorage.getItem(SAVE)).taps===1),await p.evaluate(()=>S));
check('the dot glides to the tap',await p.until(()=>Math.abs(dot.x-.25)<.01&&Math.abs(dot.y-.75)<.01),await p.evaluate(()=>dot));
await p.mouse.click(box.x+box.width*.6,box.y+box.height*.4);
check('a mouse click counts too',await p.until(()=>S.taps===2));
check('the counter shows it',(await p.textContent('#count')).trim()==='Taps: 2',await p.textContent('#count'));
await p.reload();await p.booted();
check('the save survives a reload',await p.evaluate(()=>S.taps===2&&Math.abs(S.x-.6)<.01&&dot.x===S.x),await p.evaluate(()=>S));
check('an old save migrates to the current version',await p.evaluate(()=>{const s=migrate({taps:4});return s.v===SAVE_V&&s.taps===4&&s.x===.5}));
check('a broken save starts fresh',await p.evaluate(()=>{localStorage.setItem(SAVE,'{oops');return load().taps===0}));
await done('sanity');
