// "What to Test" for TestFlight: the build and the latest commit subjects (notes-only, merge and settings commits left out), each cut at a
// word near 500 characters, within Apple's 4,000. app/ios/App/ci_scripts/ci_post_clone.sh writes it to TestFlight/WhatToTest.en-US.txt,
// which Xcode Cloud attaches to the build, so testers see what changed with no Mac step. Write commit subjects for testers.
import {execSync} from 'node:child_process';
const git=c=>execSync('git '+c).toString().trim();
const cut=(s,n)=>s.length<=n?s:s.slice(0,s.lastIndexOf(' ',n)>n*.6?s.lastIndexOf(' ',n):n).replace(/[;,: ]+$/,'')+'…';
const subs=git('log -15 --format=%s').split('\n').filter(s=>s&&!/^(Notes|Merge|Settings)\b/.test(s)).slice(0,4).map(s=>'- '+cut(s,500));
let out='Build '+git('rev-list --count HEAD')+' ('+git('rev-parse --short HEAD')+')\n\n'+subs.join('\n');
while(out.length>3900)out=out.slice(0,out.lastIndexOf('\n- '));
process.stdout.write(out+'\n');
