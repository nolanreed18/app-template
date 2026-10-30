// Capacitor shell bootstrap. Runs before the app script (app.js, written by `node tools/build.mjs --app`).
// The app is a plain script with no bundler, so @capacitor/core's JS (registerPlugin, Capacitor.Plugins.X) is never loaded and calling it
// fails silently (Lodebreaker's first device run, Oct 22). The native WebView injects only the low-level bridge: window.Capacitor with
// nativePromise() and isPluginAvailable(). Every plugin call here therefore goes through Capacitor.nativePromise(plugin, method, options).
// 1. Seeds localStorage from native Preferences (iOS can evict WebView storage; Preferences survive), copying any key Preferences lacks
//    across once. Every key starting with PRE is mirrored, so new keys need no change here.
// 2. Defines window.lbStore (the app's persistKey writes through it) and window.lbHaptic(kind) for native haptics.
// 3. Then loads app.js. In a plain browser (no Capacitor) it only loads the app.
(async()=>{
 const PRE='__APP_SLUG__.';
 const C=window.Capacitor;
 const native=!!(C&&C.isNativePlatform&&C.isNativePlatform()&&typeof C.nativePromise==='function');
 const call=(plugin,method,opts)=>C.nativePromise(plugin,method,opts||{});
 const has=p=>{try{return !!C.isPluginAvailable(p)}catch(e){return false}};
 if(native){
  if(has('Preferences')){
   try{
    const {keys=[]}=await call('Preferences','keys'),saved=new Set(keys.filter(k=>k.startsWith(PRE)));
    for(const k of saved){const {value}=await call('Preferences','get',{key:k});if(value!=null){try{localStorage.setItem(k,value)}catch(e){}}}
    const local=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(PRE)&&!saved.has(k))local.push([k,localStorage.getItem(k)])}}catch(e){}
    for(const [k,v] of local)await call('Preferences','set',{key:k,value:v});
    window.lbStore={set:(k,v)=>call('Preferences','set',{key:k,value:v}).catch(()=>{})};
   }catch(e){console.warn('Preferences unavailable',e)}
  }
  if(has('Haptics')){
   const map={tap:()=>call('Haptics','impact',{style:'LIGHT'}),pick:()=>call('Haptics','selectionChanged'),hit:()=>call('Haptics','impact',{style:'HEAVY'}),buy:()=>call('Haptics','notification',{type:'SUCCESS'}),boom:()=>call('Haptics','vibrate',{duration:120})};
   window.lbHaptic=kind=>{const f=map[kind];if(f)f().catch(()=>{})};
  }
  if(has('StatusBar')){call('StatusBar','setStyle',{style:'DARK'}).catch(()=>{});call('StatusBar','setOverlaysWebView',{overlay:true}).catch(()=>{})}
  if(has('SplashScreen'))setTimeout(()=>call('SplashScreen','hide').catch(()=>{}),300);
 }
 const s=document.createElement('script');s.src='app.js';document.body.appendChild(s);
})();
