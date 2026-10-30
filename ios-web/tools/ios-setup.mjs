// Run after `npx cap add ios` (app/package.json's add-ios script runs both). It works on Linux, so a cloud session makes the iOS project and
// the Mac only signs in and creates the Xcode Cloud workflow. Lays app/ios-template over app/ios (Xcode Cloud's ci_scripts, the privacy
// manifest, the shared App scheme Xcode Cloud builds, ExportOptions.plist for Mac uploads) and patches the project: the privacy manifest as
// a resource of the App target, the bundle id, the team when known, the home-screen name, and ITSAppUsesNonExemptEncryption=false so no
// build waits on the export compliance question. Safe to run again (after filling the team in app/ios-template/ExportOptions.plist, say).
import fs from 'node:fs';
const app=new URL('../app/',import.meta.url).pathname,ios=app+'ios/',PH=v=>/__[A-Z][A-Z0-9_]*__/.test(v);
const cfg=JSON.parse(fs.readFileSync(app+'capacitor.config.json','utf8'));
if(PH(cfg.appId+cfg.appName)){console.log('app/capacitor.config.json still has placeholders: run node tools/init.mjs first.');process.exit(1)}
const pf=ios+'App/App.xcodeproj/project.pbxproj',ip=ios+'App/App/Info.plist';
if(!fs.existsSync(pf)){console.log('No iOS project: cd app && npm run add-ios (it runs npx cap add ios, then this).');process.exit(1)}
fs.cpSync(app+'ios-template/',ios,{recursive:true});
for(const f of fs.readdirSync(ios+'App/ci_scripts'))fs.chmodSync(ios+'App/ci_scripts/'+f,0o755);
const did=['copied app/ios-template over app/ios'];
let p=fs.readFileSync(pf,'utf8');
// Capacitor's template has no privacy manifest; App Store Connect flags an upload that uses UserDefaults (Preferences) without one.
if(!p.includes('PrivacyInfo.xcprivacy')){const BF='7A1D0E5A2C4F11EE9B2A000000000001',FR='7A1D0E5B2C4F11EE9B2A000000000002';
 const after=(re,line)=>{const m=p.match(re);if(!m)throw new Error('project.pbxproj has no '+re);p=p.replace(re,m[0]+'\n'+line(m[1]||''))};
 after(/\/\* Begin PBXBuildFile section \*\//,()=>'\t\t'+BF+' /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = '+FR+' /* PrivacyInfo.xcprivacy */; };');
 after(/\/\* Begin PBXFileReference section \*\//,()=>'\t\t'+FR+' /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };');
 after(/^([\t ]*)\w+ \/\* Assets\.xcassets \*\/,$/m,i=>i+FR+' /* PrivacyInfo.xcprivacy */,');
 after(/^([\t ]*)\w+ \/\* Assets\.xcassets in Resources \*\/,$/m,i=>i+BF+' /* PrivacyInfo.xcprivacy in Resources */,');
 did.push('added PrivacyInfo.xcprivacy to the App target')}
p=p.replace(/PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g,'PRODUCT_BUNDLE_IDENTIFIER = '+cfg.appId+';');did.push('bundle id '+cfg.appId);
const team=(fs.readFileSync(ios+'ExportOptions.plist','utf8').match(/<key>teamID<\/key>\s*<string>([^<]*)<\/string>/)||[])[1]||'';
if(team&&!PH(team)){p=/DEVELOPMENT_TEAM = /.test(p)?p.replace(/DEVELOPMENT_TEAM = [^;]+;/g,'DEVELOPMENT_TEAM = '+team+';'):p.replace(/^([\t ]*)CURRENT_PROJECT_VERSION = /gm,'$1DEVELOPMENT_TEAM = '+team+';\n$1CURRENT_PROJECT_VERSION = ');did.push('team '+team)}
else did.push('team not set: pick it in Xcode (App target → Signing & Capabilities), or put it in app/ios-template/ExportOptions.plist and run this again');
fs.writeFileSync(pf,p);
let pl=fs.readFileSync(ip,'utf8');const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
pl=pl.replace(/(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,'$1'+esc(cfg.appName).replace(/\$/g,'$$$$')+'$2');
if(!pl.includes('ITSAppUsesNonExemptEncryption'))pl=pl.replace(/<\/dict>\s*<\/plist>\s*$/,'\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>\n</dict>\n</plist>\n');
fs.writeFileSync(ip,pl);did.push('home-screen name "'+cfg.appName+'", no export compliance question');
console.log(did.map(s=>'- '+s).join('\n')+'\nNext: commit app/ (the iOS project is tracked), then the Mac step in PLAYBOOK.md (signing and the Xcode Cloud workflow).');
