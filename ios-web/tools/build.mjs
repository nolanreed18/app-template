// Builds the single-file app from src/: shell.html, then the files in ORDER concatenated into one inline <script>.
//   node tools/build.mjs        -> index.html (standalone page; the smoke tests load it; committed, so build after committing)
//   node tools/build.mjs --web  -> web/ for Cloudflare Pages: index.html, privacy.html, _headers (Pages runs this itself; gitignored)
//   node tools/build.mjs --app  -> app/www/index.html + app/www/app.js for the Capacitor shell (native.js loads app.js; gitignored)
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execSync} from 'node:child_process';
const root=new URL('..',import.meta.url).pathname,read=f=>readFileSync(root+'src/'+f,'utf8'),arg=a=>process.argv.includes(a);
// Script order matters: every file shares one top-level scope, so a name used while loading must be declared in an earlier file.
const ORDER=['main.js'];
const NAME=JSON.parse(readFileSync(root+'app/capacitor.config.json','utf8')).appName,THEME='#0b0e14';
// Build id shown in the app: commit count, '+' when tracked files differ from the commit, date, short sha. index.html is a build output,
// so it never counts as dirt. Cloudflare Pages clones shallowly (the count would read 1), so its builds say 'web' and use its own sha.
const git=c=>{try{return execSync(c,{cwd:root,stdio:['ignore','pipe','ignore']}).toString().trim()}catch(e){return ''}};
const dirty=git("git status --porcelain --untracked-files=no -- . ':!index.html'")?'+':'';
const count=git('git rev-list --count HEAD'),sha=git('git rev-parse --short HEAD')||'dev';
const BUILD_ID=(process.env.CF_PAGES?'web':'build '+(count||'0')+dirty)+' · '+new Date().toISOString().slice(0,10)+' · '+(process.env.CF_PAGES_COMMIT_SHA?process.env.CF_PAGES_COMMIT_SHA.slice(0,7):sha);
// A second top-level `function name` in another file silently replaces the first (Lodebreaker, Oct 28: two slamStart functions froze
// every Ground Slam for a day). Refuse to build with a repeated top-level function name.
{const seen=new Map(),dup=[];for(const f of ORDER)for(const m of read(f).matchAll(/^(?:async\s+)?function\s*\*?\s*([\w$]+)/gm)){if(seen.has(m[1]))dup.push(m[1]+' in '+seen.get(m[1])+' and '+f);else seen.set(m[1],f)}
 if(dup.length)throw new Error('duplicate top-level functions: '+dup.join('; '))}
const bundle=()=>"'use strict';\nconst BUILD_ID="+JSON.stringify(BUILD_ID)+";\n"+ORDER.map(f=>read(f).replace(/^'use strict';\n/,'')).join('\n');
const head=extra=>'<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">\n<meta name="theme-color" content="'+THEME+'">\n'+(extra||'')+'<style>html{background:'+THEME+'}body{margin:0}[hidden]{display:none!important}</style>\n</head>\n<body>\n';
const page=extra=>head(extra)+read('shell.html')+'\n<script>\n'+bundle()+'\n</script>\n</body>\n</html>\n';
if(arg('--app')){
 mkdirSync(root+'app/www',{recursive:true});
 writeFileSync(root+'app/www/app.js',bundle());
 writeFileSync(root+'app/www/index.html',head()+read('shell.html')+'\n<script src="native.js"></script>\n</body>\n</html>\n');
 console.log('wrote app/www/index.html and app/www/app.js · '+BUILD_ID);
}
else if(arg('--web')){
 mkdirSync(root+'web',{recursive:true});
 writeFileSync(root+'web/index.html',page('<meta name="description" content="'+NAME+'">\n'));
 writeFileSync(root+'web/privacy.html',readFileSync(root+'docs/privacy.html','utf8'));
 writeFileSync(root+'web/_headers','/index.html\n  Cache-Control: no-cache\n/\n  Cache-Control: no-cache\n');
 console.log('wrote web/ · '+BUILD_ID);
}
else{writeFileSync(root+'index.html',page());console.log('wrote index.html · '+BUILD_ID)}
