// Draws the icon (1024 px) and the splash screens (2732 px) into app/assets for `npx capacitor-assets generate` (app/package.json's assets
// script runs both). The default art is the starter's ring and dot plus the app's name; replace art() with the app's own (Lodebreaker drew
// its icon from its own rig sprite). The splash is shown aspect-fill, so a phone sees only about the central 46% of the square in either
// orientation: everything that matters stays inside the central 38%. The app is dark-only, so both splashes are the same.
import fs from 'node:fs';import {createRequire} from 'node:module';
const pw=createRequire(import.meta.url)(process.env.PW_CORE||'/opt/node-tools/node_modules/playwright');
const dir=new URL('../app/',import.meta.url).pathname,name=JSON.parse(fs.readFileSync(dir+'capacitor.config.json','utf8')).appName;
const b=await pw.chromium.launch({channel:process.env.PW_CHANNEL||undefined}),p=await b.newPage();
const out=await p.evaluate(name=>{const C={bg:'#0b0e14',line:'#263041',accent:'#ffb340',dot:'#55c8ff',fg:'#e9eef5'};
 const art=(x,cx,cy,r)=>{x.strokeStyle=C.accent;x.lineWidth=r*.16;x.beginPath();x.arc(cx,cy,r*1.75,0,7);x.stroke();x.fillStyle=C.dot;
  for(const[a,s]of[[.14,1.45],[.3,1.15],[1,.8]]){x.globalAlpha=a;x.beginPath();x.arc(cx,cy,r*s,0,7);x.fill()}x.globalAlpha=1;x.fillStyle='#fff';x.beginPath();x.arc(cx,cy,r*.32,0,7);x.fill()};
 const can=s=>{const c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');x.fillStyle=C.bg;x.fillRect(0,0,s,s);
  x.strokeStyle=C.line;x.lineWidth=s/512;x.beginPath();for(let i=s/16;i<s;i+=s/8){x.moveTo(i,0);x.lineTo(i,s);x.moveTo(0,i);x.lineTo(s,i)}x.stroke();return[c,x]};
 const[ic,ix]=can(1024);art(ix,512,512,230);
 const S=2732,box=S*.38,[sc,sx]=can(S);art(sx,S/2,S/2-box*.14,box*.16);
 let f=box*.2;sx.font='700 '+f+'px system-ui,sans-serif';const w=sx.measureText(name).width;if(w>box){f*=box/w;sx.font='700 '+f+'px system-ui,sans-serif'}
 sx.fillStyle=C.fg;sx.textAlign='center';sx.textBaseline='middle';sx.fillText(name,S/2,S/2+box*.36);
 return{icon:ic.toDataURL(),splash:sc.toDataURL()}},name);
await b.close();fs.mkdirSync(dir+'assets',{recursive:true});
for(const[f,d]of[['icon.png',out.icon],['splash.png',out.splash],['splash-dark.png',out.splash]])fs.writeFileSync(dir+'assets/'+f,Buffer.from(d.split(',')[1],'base64'));
console.log('wrote app/assets/icon.png, splash.png, splash-dark.png');
