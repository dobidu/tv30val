'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { checksForFamily } = require('../catalogue');
const { finding, skipped, passed } = require('../finding');
const { loadAtlantis } = require('../atlantis');
const { parse } = require('../xml');
const readme = require('../readme');

const APP_TYPE = /^F_3G([HN])App$/;
const NOT_AN_APP = /_(?:SCRIPT|AUX_\d{3})$/;
const XML_TYPES = new Set(['BAMT', 'BALD', 'PRRD', 'ESG', 'AEAT']);
const CODE_EXT = new Set(['.html', '.js', '.css', '.lua', '.ncl']);
const APP_ID_DECL = /\bAPPLICATION_ID\s*=\s*["']([^"']*)["']/;
// Only references the package would actually load count; a comment citing
// docs/ or tools/ is provenance, not a dependency.
const LOAD_REF = /(?:\b(?:src|href)\s*=\s*|\bimport\s*(?:[^'"]*\bfrom\s*)?|\b(?:require|fetch|importScripts|dofile|loadfile)\s*\(\s*|\burl\(\s*|@import\s+(?:url\()?\s*)['"]?([^'")\s]+)/g;
const FORBIDDEN_TARGET = /(?:^|\/)(?:tools|docs|node_modules)\/|\.(?:test|spec)\.js$/;
const PENDING = {
  'V-APP-006': 'needs the API index (v0.2 Phase 9)',
  'V-APP-007': 'needs the API index (v0.2 Phase 9)',
  'V-APP-008': 'not implemented yet (v0.2 plan 07-02)',
  'V-APP-009': 'not implemented yet (v0.2 plan 07-02)',
  'V-APP-010': 'not implemented yet (v0.2 plan 07-02)',
  'V-APP-011': 'not implemented yet (v0.2 plan 07-02)',
};

const posix = (p) => p.split(path.sep).join('/');

function preset(ctx) {
  const l = ctx.layout;
  return l && l.presets && l.presets[l.preset] ? l.presets[l.preset] : {};
}

function emit(check, artifact, rel, results) {
  if (results === null) return [];
  if (results.some((r) => r.status === 'skipped')) return results;
  return results.length ? results : [passed(check, { artifact, path: rel })];
}

function listDirs(abs) {
  try {
    return fs.readdirSync(abs, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  } catch {
    return [];
  }
}

function readText(abs) {
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
}

function* walk(abs, rel) {
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const r = `${rel}/${e.name}`;
    if (e.isDirectory()) yield* walk(path.join(abs, e.name), r);
    else if (e.isFile()) yield { abs: path.join(abs, e.name), rel: r, name: e.name };
  }
}

function folders(ctx) {
  const p = preset(ctx);
  const roots = (p.appRoots || ['applications/*', 'applications-staging/*']).map((r) => r.replace(/\/\*$/, ''));
  const filler = p.fillerGroup || 'applications-staging';
  const out = [];
  for (const root of roots) {
    for (const name of listDirs(path.join(ctx.root, root))) out.push({ name, rel: `${root}/${name}`, filler: root === filler });
  }
  return out;
}

function declaredAppId(ctx, folder) {
  for (const f of ['js/main.js', 'lua/main.lua', 'main.js']) {
    const text = readText(path.join(ctx.root, folder.rel, f));
    if (text === null) continue;
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = APP_ID_DECL.exec(lines[i]);
      if (m) return { value: m[1], rel: `${folder.rel}/${f}`, line: i + 1 };
    }
  }
  return null;
}

// BALD EntryPackages per announced application kebab.
function baldAnnouncements(ctx) {
  const tpl = preset(ctx).xml || 'xmls/{xmlType}/{kebabId}.xml';
  const dir = path.posix.dirname(tpl).replace('{xmlType}', 'bald');
  const out = new Map();
  let names = [];
  try {
    names = fs.readdirSync(path.join(ctx.root, dir)).filter((n) => n.endsWith('.xml'));
  } catch {
    return out;
  }
  for (const n of names) {
    const doc = parse(readText(path.join(ctx.root, dir, n)) || '');
    if (!doc.ok) continue;
    for (const el of doc.elements.filter((e) => e.attrs.bcastEntryPackageUrl)) {
      const kebab = path.posix.basename(el.attrs.bcastEntryPackageUrl.value).replace(/\.[^.]+$/, '').toLowerCase();
      if (!out.has(kebab)) out.set(kebab, []);
      out.get(kebab).push({ bald: `${dir}/${n}`, line: el.line, entry: el.attrs.bcastEntryPointUrl ? el.attrs.bcastEntryPointUrl.value : null });
    }
  }
  return out;
}

// --- checks ---------------------------------------------------------------

function checkIdentity(ctx, folder, atl) {
  const out = [];
  const decl = declaredAppId(ctx, folder);
  const label = folder.filler ? folder.name : atl.ids.fromFolderName(folder.name);
  const f = (message, rel, location) => finding({ check: 'V-APP-001', artifact: label, path: rel || folder.rel, location, message });
  if (folder.filler) {
    if (decl && decl.value !== 'N/A') out.push(f(`filler application declares APPLICATION_ID "${decl.value}"; fillers use "N/A"`, decl.rel, `line ${decl.line}`));
    return out;
  }
  const id = atl.ids.fromFolderName(folder.name);
  const art = atl.catalog.findArtifact(id);
  if (!art) return [f(`${id} (from the folder name) is not in the v1.1 catalogue`)];
  if (!APP_TYPE.test(art.type) || NOT_AN_APP.test(art.id)) return [f(`${id} is catalogued as ${art.type}, not as a test application`)];
  if (decl && decl.value !== art.id) out.push(f(`APPLICATION_ID "${decl.value}" does not match the folder's ${art.id}`, decl.rel, `line ${decl.line}`));
  return out;
}

function checkEntry(ctx, folder, art, announcements) {
  const out = [];
  const html5 = APP_TYPE.exec(art.type)[1] === 'H';
  const entry = html5 ? 'index.html' : 'main.ncl';
  if (!fs.existsSync(path.join(ctx.root, folder.rel, entry))) {
    out.push(finding({ check: 'V-APP-002', artifact: art.id, path: folder.rel, message: `${html5 ? 'Ginga-HTML5' : 'Ginga-NCL'} application has no ${entry}` }));
  }
  for (const a of announcements.get(folder.name.toLowerCase()) || []) {
    if (a.entry && !fs.existsSync(path.join(ctx.root, folder.rel, a.entry))) {
      out.push(finding({ check: 'V-APP-002', artifact: art.id, path: folder.rel, message: `BALD announces entry point "${a.entry}", which is not in the folder`, evidence: `${a.bald} line ${a.line}` }));
    }
  }
  return out;
}

function checkHygiene(ctx, folder, artifact) {
  const out = [];
  for (const file of walk(path.join(ctx.root, folder.rel), folder.rel)) {
    const f = (message, location) => finding({ check: 'V-APP-003', artifact, path: file.rel, location, message });
    if (/\.(test|spec)\.js$/.test(file.name) || /\/test\//.test(file.rel.slice(folder.rel.length))) {
      out.push(f('test file inside the application package'));
      continue;
    }
    if (!CODE_EXT.has(path.extname(file.name).toLowerCase())) continue;
    (readText(file.abs) || '').split('\n').forEach((line, i) => {
      for (const m of line.matchAll(LOAD_REF)) {
        if (FORBIDDEN_TARGET.test(m[1])) out.push(f(`loads ${m[1]} — the package must hold only what the application needs`, `line ${i + 1}`));
      }
    });
  }
  return out;
}

function checkReadmeCases(folder, art, md, atl) {
  const t = readme.findTable(readme.tables(md), /^Test cases$/i);
  if (!t) return [skipped('V-APP-004', `${folder.rel}/README.md: no "Test cases" table`)];
  const col = t.header.find((h) => /test case id/i.test(h));
  const listed = t.rows.flatMap((r) => readme.ids(r.cells[col]).map((id) => ({ id, line: r.line })));
  const rel = `${folder.rel}/README.md`;
  const out = [];
  for (const { id, line } of listed) {
    if (!atl.catalog.findCase(id)) out.push(finding({ check: 'V-APP-004', artifact: art.id, path: rel, location: `line ${line}`, message: `${id} is not in the v1.1 catalogue` }));
    else if (!(art.cases || []).includes(id)) out.push(finding({ check: 'V-APP-004', artifact: art.id, path: rel, location: `line ${line}`, message: `${id} does not cite ${art.id} in the catalogue` }));
  }
  const missing = (art.cases || []).filter((c) => !listed.some((l) => l.id === c));
  if (missing.length) out.push(finding({ check: 'V-APP-004', severity: 'note', artifact: art.id, path: rel, location: `line ${t.line}`, message: `catalogue cases of ${art.id} not listed in the README: ${missing.join(', ')}` }));
  return out;
}

function checkReadmeInputs(folder, art, md, atl) {
  const t = readme.findTable(readme.tables(md), /^Input artifacts per test case$/i);
  if (!t) return [skipped('V-APP-005', `${folder.rel}/README.md: no "Input artifacts per test case" table`)];
  const rel = `${folder.rel}/README.md`;
  const caseCol = t.header.find((h) => /test case id/i.test(h));
  const cols = t.header.filter((h) => /PCAP|XML/i.test(h));
  const out = [];
  const seen = new Set();
  for (const row of t.rows) {
    const [caseId] = readme.ids(row.cells[caseCol]);
    if (!caseId) continue;
    seen.add(caseId);
    const tc = atl.catalog.findCase(caseId);
    if (!tc) continue; // V-APP-004 reports it
    const inReadme = new Set(cols.flatMap((c) => readme.ids(row.cells[c])));
    const inCatalogue = new Set((tc.artifacts || []).filter((a) => a.type === 'F_PCAP' || XML_TYPES.has(a.type)).map((a) => a.id));
    const missing = [...inCatalogue].filter((x) => !inReadme.has(x));
    const extra = [...inReadme].filter((x) => !inCatalogue.has(x));
    const f = (message) => finding({ check: 'V-APP-005', artifact: art.id, path: rel, location: `line ${row.line}`, message, evidence: `README: ${[...inReadme].join(', ') || '—'}; catalogue: ${[...inCatalogue].join(', ') || '—'}` });
    if (missing.length) out.push(f(`${caseId}: catalogue input artifacts missing from the README: ${missing.join(', ')}`));
    if (extra.length) out.push(f(`${caseId}: README lists input artifacts the catalogue does not: ${extra.join(', ')}`));
  }
  for (const c of (art.cases || []).filter((x) => !seen.has(x))) {
    out.push(finding({ check: 'V-APP-005', artifact: art.id, path: rel, location: `line ${t.line}`, message: `${c} has no row in "Input artifacts per test case"` }));
  }
  return out;
}

// --- run -----------------------------------------------------------------

function run(ctx, targets = []) {
  const all = folders(ctx);
  if (!all.length) return checksForFamily('app').map((ch) => skipped(ch.id, 'no application folders'));
  const atl = loadAtlantis(ctx.root);
  if (!atl.ok) return checksForFamily('app').map((ch) => skipped(ch.id, atl.reason));

  const scoped = all.filter((f) =>
    !targets.length ||
    targets.some((t) => (t.kind === 'id' ? atl.ids.kebabId(t.value) === f.name.toLowerCase() : t.value === '.' || f.rel === t.value.replace(/\/$/, '') || f.rel.startsWith(`${t.value.replace(/\/$/, '')}/`) || `${t.value}/`.startsWith(`${f.rel}/`))));
  if (!scoped.length) return checksForFamily('app').map((ch) => skipped(ch.id, 'no applications match the targets'));

  const announcements = baldAnnouncements(ctx);
  const results = [];
  for (const folder of scoped) {
    const id = folder.filler ? folder.name : atl.ids.fromFolderName(folder.name);
    const identity = checkIdentity(ctx, folder, atl);
    results.push(...emit('V-APP-001', id, folder.rel, identity));
    results.push(...emit('V-APP-003', id, folder.rel, checkHygiene(ctx, folder, id)));
    if (folder.filler) continue;
    const art = atl.catalog.findArtifact(id);
    if (!art || !APP_TYPE.test(art.type) || NOT_AN_APP.test(art.id)) continue;
    results.push(...emit('V-APP-002', id, folder.rel, checkEntry(ctx, folder, art, announcements)));
    const md = readText(path.join(ctx.root, folder.rel, 'README.md'));
    if (md === null) {
      results.push(skipped('V-APP-004', `${folder.rel}: no README.md`), skipped('V-APP-005', `${folder.rel}: no README.md`));
      continue;
    }
    results.push(...emit('V-APP-004', id, `${folder.rel}/README.md`, checkReadmeCases(folder, art, md, atl)));
    results.push(...emit('V-APP-005', id, `${folder.rel}/README.md`, checkReadmeInputs(folder, art, md, atl)));
  }
  for (const [check, reason] of Object.entries(PENDING)) results.push(skipped(check, reason));
  return results;
}

module.exports = { run };
