// Turns the template into an app. Asks nothing:
//   node tools/init.mjs --name "My App" --id com.nolanreed.myapp --web https://myapp.pages.dev
//     [--team <Apple team id>] [--issuer <App Store Connect issuer id>] [--mac-key <Mac upload key id>] [--email <privacy contact>]
// Replaces the placeholders (two underscores, capitals, two underscores) in every text file but PLAYBOOK.md and this one, writes the app's README.md, and prints what is
// left. Run it again with only the optional flags to fill those later. The App Store Connect ids come from tools/asc-ids.mjs --write.
import fs from 'node:fs';import path from 'node:path';import {execSync} from 'node:child_process';
const root=path.resolve(new URL('..',import.meta.url).pathname),a={};
for(let i=2;i<process.argv.length;i++){const m=process.argv[i].match(/^--([\w-]+)(?:=(.*))?$/);if(!m){console.log('unexpected argument: '+process.argv[i]);process.exit(1)}a[m[1]]=m[2]??process.argv[++i]}
const die=s=>{console.log(s);process.exit(1)};
const SKIP=new Set(['PLAYBOOK.md','tools/init.mjs']),BIN=/\.(png|jpe?g|gif|webp|ico|icns|woff2?|ttf|otf|jar|zip|gz|mp3|m4a|wav|ogg|pdf)$/i;
let files;try{files=execSync('git ls-files -co --exclude-standard',{cwd:root}).toString().split('\n').filter(Boolean)}
catch{files=[];const walk=d=>{for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){const f=d?d+'/'+e.name:e.name;if(['.git','node_modules','web','dist'].includes(e.name))continue;e.isDirectory()?walk(f):files.push(f)}};walk('')}
files=files.filter(f=>!SKIP.has(f)&&!BIN.test(f)&&fs.existsSync(path.join(root,f)));
const text=f=>fs.readFileSync(path.join(root,f),'utf8');
const fresh=files.some(f=>text(f).includes('__APP_NAME__')),V={};
if(fresh){
 if(!a.name||!a.id||!a.web)die('usage: node tools/init.mjs --name "My App" --id com.yourname.myapp --web https://myapp.pages.dev [--team ABCDE12345] [--issuer <uuid>] [--mac-key ABCDE12345] [--email you@example.com]');
 const name=a.name.trim();if(!name||/["\\<>&\u0000-\u001f]/.test(name))die('--name: plain text without " \\ < > &');
 if(!/^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z][A-Za-z0-9-]*)+$/.test(a.id))die('--id: a reverse-DNS bundle id with letters, digits and hyphens only, e.g. com.yourname.myapp');
 let web;try{web=new URL(a.web)}catch{}if(!web||web.protocol!=='https:')die('--web: the https URL the web build will live at, e.g. https://myapp.pages.dev');
 Object.assign(V,{__APP_NAME__:name,__APP_SLUG__:name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'app',__APP_ID__:a.id,
  __WEB_URL__:web.origin,__WEB_HOST__:web.host,__INIT_DATE__:new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})});
}else if(a.name||a.id||a.web)console.log('Already initialised: --name, --id and --web are ignored (change those by hand; grep the old value).');
const opt={team:['__TEAM_ID__',/^[A-Z0-9]{10}$/,'ten letters and digits (developer.apple.com → Account → Membership details)'],
 issuer:['__ASC_ISSUER_ID__',/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,'a UUID (App Store Connect → Users and Access → Integrations)'],
 'mac-key':['__MAC_KEY_ID__',/^[A-Z0-9]{10}$/,'the ten-character Key ID of the Mac\'s Admin key'],email:['__CONTACT_EMAIL__',/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/,'an email address']};
for(const[k,[ph,re,what]]of Object.entries(opt))if(a[k]!=null){if(!re.test(a[k]))die('--'+k+': '+what);V[ph]=a[k]}
let n=0;const touched=[];
for(const f of files){const t=text(f);let u=t;for(const[k,v]of Object.entries(V))u=u.split(k).join(v);if(u!==t){fs.writeFileSync(path.join(root,f),u);touched.push(f);n++}}
if(fresh)fs.writeFileSync(path.join(root,'README.md'),'# '+V.__APP_NAME__+'\n\n'+V.__WEB_URL__+'\n\nA single-file web app with a Capacitor iOS shell, built and shipped by Claude cloud sessions. Start with `CLAUDE.md` (how it is built, tested and shipped); `PLAYBOOK.md` has the one-time setup and the lessons behind the rules.\n\n```sh\nnode tools/build.mjs && node tools/smoke/run.mjs   # build and test\n```\n');
console.log((fresh?'Initialised '+V.__APP_NAME__+' ('+V.__APP_ID__+', '+V.__WEB_URL__+'); ':'')+'filled placeholders in '+n+' file'+(n===1?'':'s')+(fresh?' and wrote README.md':''));
// What is left, where, and how to fill it.
const HOW={__TEAM_ID__:'--team (Apple Developer team id), or pick the team in Xcode',__ASC_ISSUER_ID__:'--issuer, or ASC_ISSUER_ID in the cloud environment',
 __MAC_KEY_ID__:'--mac-key (only for uploads from the Mac)',__CONTACT_EMAIL__:'--email (the privacy page\'s contact)',
 __APP_STORE_APP_ID__:'node tools/asc-ids.mjs --write',__XCODE_CLOUD_WORKFLOW_ID__:'node tools/asc-ids.mjs --write',__INTERNAL_GROUP_ID__:'node tools/asc-ids.mjs --write',__EXTERNAL_GROUP_ID__:'node tools/asc-ids.mjs --write'};
const left={};for(const f of files)for(const m of text(f).matchAll(/__[A-Z][A-Z0-9_]*__/g))(left[m[0]]||=new Set()).add(f);
const keys=Object.keys(left);
console.log(keys.length?'\nLeft to fill:\n'+keys.map(k=>'  '+k.padEnd(28)+(HOW[k]||'by hand')+'  ['+[...left[k]].join(', ')+']').join('\n'):'\nNo placeholders left.');
if(fresh)console.log('\nNext (PLAYBOOK.md): node tools/build.mjs && node tools/smoke/run.mjs, commit "Start '+V.__APP_NAME__+' from the app template", node tools/build.mjs, git add index.html, git commit --amend --no-edit, git push -u origin main.');
