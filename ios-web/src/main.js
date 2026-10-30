'use strict';
// The starter app: tap anywhere and the dot glides there; taps are counted and saved. Replace it with the real app, and keep its
// bones: persistKey for every write, the save version and migrate(), save on hide, and a frame loop that asks for the next frame first.
const SAVE='__APP_SLUG__.v1',SAVE_V=1; // every storage key starts with '__APP_SLUG__.' (app/www/native.js mirrors that prefix to iOS Preferences)
// All persistent writes go through here: localStorage, plus native Preferences when the Capacitor shell (app/www/native.js) defines window.lbStore.
function persistKey(k,v){try{localStorage.setItem(k,v)}catch(e){}try{if(window.lbStore)window.lbStore.set(k,v)}catch(e){}}
// Native haptics when the shell defines window.lbHaptic (kinds: tap, pick, hit, buy, boom); nothing in a browser.
function haptic(kind){try{if(window.lbHaptic)window.lbHaptic(kind)}catch(e){}}
// A save carries v. Any change to what a save means bumps SAVE_V and adds a step here, so every older save still loads.
function migrate(s){if(!s||typeof s!=='object')return null;s.v=s.v|0;
 if(s.v<1){s.taps=s.taps|0;s.x=.5;s.y=.5;s.v=1}
 return s}
function fresh(){return{v:SAVE_V,taps:0,x:.5,y:.5}}
function load(){let s=null;try{s=JSON.parse(localStorage.getItem(SAVE))}catch(e){}return migrate(s)||fresh()}
function save(){persistKey(SAVE,JSON.stringify(S))}

let S=load(),frames=0,last=0,W=0,H=0,DPR=1;
const dot={x:S.x,y:S.y},$=q=>document.querySelector(q),cv=$('#cv'),cx=cv.getContext('2d');
const css=k=>getComputedStyle(document.documentElement).getPropertyValue(k).trim();
const COL={bg:css('--bg'),line:css('--line'),muted:css('--muted'),accent:css('--accent'),dot:css('--dot')};

function resize(){DPR=Math.min(3,window.devicePixelRatio||1);const r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR)}
function hud(){$('#count').textContent='Taps: '+S.taps}
function tap(x,y){S.x=Math.min(1,Math.max(0,x));S.y=Math.min(1,Math.max(0,y));S.taps++;save();haptic('tap');hud()}
cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect();tap((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height)});

function step(dt){const k=1-Math.exp(-dt*9);dot.x+=(S.x-dot.x)*k;dot.y+=(S.y-dot.y)*k}
function draw(t){cx.setTransform(DPR,0,0,DPR,0,0);cx.fillStyle=COL.bg;cx.fillRect(0,0,W,H);
 cx.strokeStyle=COL.line;cx.lineWidth=1;cx.beginPath();for(let x=24;x<W;x+=48){cx.moveTo(x+.5,0);cx.lineTo(x+.5,H)}for(let y=24;y<H;y+=48){cx.moveTo(0,y+.5);cx.lineTo(W,y+.5)}cx.stroke();
 const tx=S.x*W,ty=S.y*H,px=dot.x*W,py=dot.y*H,r=Math.max(10,Math.min(W,H)*.035);
 cx.strokeStyle=COL.accent;cx.globalAlpha=.6;cx.beginPath();cx.arc(tx,ty,r*1.8+Math.sin(t/300)*2,0,7);cx.stroke();cx.globalAlpha=1;
 cx.fillStyle=COL.dot;for(const[a,s]of[[.12,2.6],[.25,1.6],[1,1]]){cx.globalAlpha=a;cx.beginPath();cx.arc(px,py,r*s,0,7);cx.fill()}
 cx.globalAlpha=1;cx.fillStyle='#fff';cx.beginPath();cx.arc(px,py,r*.4,0,7);cx.fill();
 if(!S.taps){cx.fillStyle=COL.muted;cx.font='15px system-ui,sans-serif';cx.textAlign='center';cx.fillText('Tap anywhere',W/2,H*.3)}}
// Ask for the next frame before doing anything else: a throw inside draw() once stopped Lodebreaker's loop for good and froze the game
// (Oct 30, 2026). The smoke test checks frames keep coming.
function frame(t){requestAnimationFrame(frame);const dt=Math.min(.05,(t-last)/1000||0);last=t;frames++;step(dt);draw(t)}

// iOS may kill a hidden app without warning: save on the way out.
document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
window.addEventListener('resize',resize);
resize();hud();$('#ver').textContent=BUILD_ID;requestAnimationFrame(frame);
