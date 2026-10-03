import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const fields = {
  software: 'Software', systems: 'Systems', security: 'Security',
  'reverse-engineering': 'Reverse engineering', networking: 'Networking',
  homelab: 'Homelab', cryptography: 'Cryptography'
};
export const workStates = ['active', 'stable', 'prototype', 'maintenance', 'paused', 'archived'];
export const labStates = ['researching', 'prototyping', 'active', 'paused', 'abandoned', 'promoted'];
export const relationTypes = ['origin', 'result', 'related', 'documentation', 'implementation', 'guide', 'follow-up', 'supersedes', 'promoted-to', 'part-of'];
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
export const url = node => `/${node.kind}/${node.slug}/`;

export function validate(nodes) {
  if (!Array.isArray(nodes)) throw new Error('Catalog must be an array.');
  const ids = new Set(), routes = new Set();
  for (const n of nodes) {
    const fail = message => { throw new Error(`[${n.id ?? 'unknown ID'}] ${message}`); };
    const prefix = n.kind === 'work' ? 'P' : n.kind === 'lab' ? 'X' : ({note:'N',guide:'G',writeup:'W'}[n.entryType]);
    if (!prefix || !new RegExp(`^${prefix}-\\d{3,}$`).test(n.id)) fail('ID does not match collection or entry type.');
    if (ids.has(n.id)) fail('Duplicate ID.');
    ids.add(n.id);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(n.slug ?? '')) fail('Invalid slug.');
    if (routes.has(url(n))) fail('Duplicate URL.');
    routes.add(url(n));
    for (const key of ['title', 'summary', 'body']) if (typeof n[key] !== 'string' || !n[key].trim()) fail(`Missing ${key}.`);
    for (const key of ['created', 'updated']) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(n[key] ?? '') || !Number.isFinite(Date.parse(n[key])) || new Date(n[key]).toISOString().slice(0,10) !== n[key]) fail(`Invalid ${key} date.`);
    }
    if (n.updated < n.created) fail('Updated date precedes creation.');
    if (!Array.isArray(n.fields) || !n.fields.length || n.fields.some(f => !fields[f])) fail('Invalid fields.');
    if (!Array.isArray(n.technologies) || n.technologies.some(t => typeof t !== 'string' || !t.trim())) fail('Invalid technologies.');
    if (n.kind === 'work' && (!workStates.includes(n.status) || typeof n.type !== 'string' || !n.type.trim())) fail('Invalid Work status or type.');
    if (n.kind === 'lab') {
      if (!labStates.includes(n.status)) fail('Invalid Lab state.');
      for (const k of ['hypothesis', 'observation', 'result']) if (typeof n[k] !== 'string' || !n[k].trim()) fail(`Missing ${k}.`);
    }
    if (n.source && !/^https:\/\//.test(n.source)) fail('Source must use HTTPS.');
    if (!Array.isArray(n.relations)) fail('Relations must be an array.');
    const targets = new Set();
    for (const r of n.relations) {
      if (!relationTypes.includes(r.type) || typeof r.target !== 'string' || r.target === n.id) fail('Invalid relationship.');
      if (targets.has(`${r.type}:${r.target}`)) fail('Duplicate relationship.');
      targets.add(`${r.type}:${r.target}`);
    }
  }
  const lookup = new Map(nodes.map(n => [n.id,n]));
  for (const n of nodes) {
    for (const r of n.relations) if (!lookup.has(r.target)) throw new Error(`[${n.id}] Unresolved relationship: ${r.target}`);
    if (n.kind === 'lab' && n.status === 'promoted' && !n.relations.some(r => r.type === 'promoted-to' && lookup.get(r.target).kind === 'work')) throw new Error(`[${n.id}] Promoted Lab requires a promoted-to Work relationship.`);
  }
  return nodes;
}

export function loadNodes() {
  const nodes = validate(JSON.parse(fs.readFileSync(path.join(root, 'src/content/nodes.json'), 'utf8')));
  for (const n of nodes) {
    const contentRoot = path.join(root,'src/content');
    const bodyPath = path.resolve(contentRoot,n.body);
    if (!bodyPath.startsWith(contentRoot+path.sep) || !n.body.endsWith('.md')) throw new Error(`[${n.id}] Body must be a Markdown file inside src/content.`);
    n.markdown = fs.readFileSync(bodyPath,'utf8');
  }
  return nodes.sort((a,b) => b.updated.localeCompare(a.updated) || a.id.localeCompare(b.id));
}

export function checkProtected() {
  const hashes = JSON.parse(fs.readFileSync(path.join(root,'src/build/protected.json'),'utf8'));
  const actualPaths = [];
  function walk(rel) {
    const full = path.join(root,rel);
    if (fs.statSync(full).isDirectory()) for(const name of fs.readdirSync(full)) walk(rel+'/'+name);
    else actualPaths.push(rel);
  }
  walk('upiita'); walk('googlebd435cdd0b631f3c.html');
  if (JSON.stringify(actualPaths.sort()) !== JSON.stringify(Object.keys(hashes).sort())) throw new Error('Protected file inventory changed.');
  for (const [file,expected] of Object.entries(hashes)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
    if (actual !== expected) throw new Error(`Protected file changed: ${file}`);
  }
  return Object.keys(hashes).length;
}
