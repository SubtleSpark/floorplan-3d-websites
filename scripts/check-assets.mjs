import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
for(const site of ['txc','csw']){
 const dir=path.join(site,'dist');
 const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 for(const m of html.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)){
  if(/^(?:https?:|data:|about:|#|\/\/)/.test(m[1]))continue;
  assert.ok(fs.existsSync(path.join(dir,m[1])),`${site}: missing ${m[1]}`);
 }
 const main=fs.readFileSync(path.join(site,'main.js'),'utf8');
 const names=[...new Set([...main.matchAll(/['"](?:assets\/)?([a-zA-Z0-9_-]+\.(?:jpg|png|hdr|glb))['"]/g)].map(m=>m[1]))];
 for(const name of names)assert.ok(fs.existsSync(path.join(dir,'assets',name)),`${site}: missing ${name}`);
 console.log(`${site}: HTML links and ${names.length} literal asset references exist`);
}
