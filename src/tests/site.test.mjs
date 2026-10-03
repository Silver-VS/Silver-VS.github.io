import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { root, validate, loadNodes, checkProtected } from '../build/model.mjs';
import { searchNodes, matchesFilters } from '../workbench.js';
import { createPreviewServer } from '../build/serve.mjs';

const nodes=loadNodes();
const copy=()=>structuredClone(nodes);
test('catalog rejects broken identities, paths, classifications and dates',()=>{
  const mutations=[
    n=>n.push(structuredClone(n[0])),
    n=>n[0].id='N-001',
    n=>n[0].slug='../upiita',
    n=>n[0].fields=['invented-field'],
    n=>n[0].updated='2026-02-30',
    n=>n[0].updated='2020-01-01',
    n=>n.find(x=>x.kind==='work').status='released-ish',
    n=>n[0].source='javascript:alert(1)'
  ];
  for(const mutate of mutations){const data=copy();mutate(data);assert.throws(()=>validate(data));}
});
test('catalog rejects unresolved relationships and unsupported promotions',()=>{
  const bad=copy();bad[0].relations.push({target:'P-999',type:'related'});assert.throws(()=>validate(bad),/Unresolved/);
  const promoted=copy();promoted.find(n=>n.kind==='lab').status='promoted';assert.throws(()=>validate(promoted),/Promoted Lab/);
});
test('search matches article bodies and composes field and technology constraints',()=>{
  const index=JSON.parse(fs.readFileSync(path.join(root,'src/search-index.json'),'utf8'));
  assert.ok(searchNodes(index,'root').some(n=>n.id==='G-001'));
  assert.deepEqual(searchNodes(index,'field:software tech:json').map(n=>n.id),['N-001']);
  assert.equal(searchNodes(index,'not-a-real-node').length,0);
  assert.equal(searchNodes(index,'P-001')[0].id,'P-001');
  assert.equal(searchNodes(index,'').length,index.length);
});
test('filters compose instead of resetting other selections',()=>{
  const record={state:'prototype',fields:'software systems',year:'2026'};
  assert.equal(matchesFilters(record,{state:'prototype',field:'systems',year:'2026'}),true);
  assert.equal(matchesFilters(record,{state:'prototype',field:'security',year:'2026'}),false);
  assert.equal(matchesFilters(record,{state:'stable',field:'systems',year:'2026'}),false);
  assert.equal(matchesFilters(record,{state:'all',field:'systems',year:'2025'}),false);
});
test('all generated local links and fragments resolve',()=>{
  const generated=JSON.parse(fs.readFileSync(path.join(root,'src/build/generated.json'),'utf8'));
  for(const file of generated){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.ok(html.includes('<main id="main"'),file);
    for(const [,href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if(!href.startsWith('/')&&!href.startsWith('#'))continue;
      const [route,fragment]=href.split('#');
      const destination=route?path.join(root,route):path.join(root,file);
      const resolved=fs.existsSync(destination)&&fs.statSync(destination).isDirectory()?path.join(destination,'index.html'):destination;
      assert.ok(fs.existsSync(resolved),`${file}: missing ${href}`);
      if(fragment){const target=fs.readFileSync(resolved,'utf8');assert.ok(target.includes(`id="${fragment}"`),`${file}: missing anchor ${href}`);}
    }
  }
});
test('Google verification block and all independent application bytes are preserved',()=>{
  assert.equal(checkProtected(),28);
  const block=fs.readFileSync(path.join(root,'src/build/verification.html'),'utf8');
  assert.ok(fs.readFileSync(path.join(root,'index.html'),'utf8').includes(block));
});
test('published project sources are public and every reviewed repository has an explicit treatment',()=>{
  const inventory=JSON.parse(fs.readFileSync(path.join(root,'src/content/repository-inventory.json'),'utf8'));
  const publicUrls=new Set(inventory.map(r=>r.url));
  assert.equal(inventory.length,21);
  assert.ok(inventory.every(r=>r.public===true&&r.reason&&(!r.node||nodes.some(n=>n.id===r.node))));
  for(const n of nodes)if(n.source)assert.ok(publicUrls.has(n.source),`${n.id} is not in the reviewed public inventory`);
  const generated=JSON.parse(fs.readFileSync(path.join(root,'src/build/generated.json'),'utf8'));
  const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
  assert.equal((sitemap.match(/<loc>/g)||[]).length,generated.length-1);
  assert.ok(!sitemap.includes('/upiita/'));
});
test('preview serves collection and independent app routes, redirects directory URLs, and rejects private paths',async()=>{
  const server=createPreviewServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try {
    for(const route of ['/','/work/','/notebook/','/lab/','/about/','/fields/','/search/','/upiita/horarios.html','/googlebd435cdd0b631f3c.html']) {
      const response=await fetch(base+route);assert.equal(response.status,200,route);
    }
    assert.equal((await fetch(base+'/work',{redirect:'manual'})).status,308);
    assert.equal((await fetch(base+'/missing-node/')).status,404);
    assert.equal((await fetch(base+'/.git/config')).status,403);
    assert.equal((await fetch(base+'/node_modules/marked/package.json')).status,403);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
