'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { checksForFamily } = require('../catalogue');
const { finding, skipped, passed } = require('../finding');
const { loadAtlantis } = require('../atlantis');

const FORMAL_APP_TYPE = /^F_3G[HN]App$/;
// Scripts and auxiliary apps share the type but are not test applications.
const NOT_AN_APP = /_(?:SCRIPT|AUX_\d{3})$/;
const isFormalApp = (a) => FORMAL_APP_TYPE.test(a.type) && !NOT_AN_APP.test(a.id);
const TEXT_EXT = new Set(['.js', '.ts', '.html', '.css', '.json', '.xml', '.md', '.lua', '.ncl', '.py']);
const MAX_SCAN_BYTES = 2 * 1024 * 1024;
// These record retirements; mentioning a retired ID there is the point.
const RETIRED_SCAN_EXCLUDE = [/^docs\/specs\//, /^docs\/project\//, /^tools\/atlantis\/catalog-overrides\//];

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

// "ST3_F_G_008" and "ST3_F_G_MHA (complementary annex)" both reduce to their code.
const groupCode = (g) => {
  const m = /ST3_F_G_(\d{3}|MHA)/.exec(String(g));
  return m ? m[1] : null;
};

function listDirs(abs) {
  try {
    return fs.readdirSync(abs, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  } catch {
    return [];
  }
}

// Formal application folders in the tree: appRoots patterns ("applications/*")
// minus the filler group, which has no catalogue IDs.
function appFolders(ctx) {
  const p = preset(ctx);
  const roots = (p.appRoots || ['applications/*']).map((r) => r.replace(/\/\*$/, ''));
  const filler = p.fillerGroup || 'applications-staging';
  const out = [];
  for (const root of roots) {
    if (root === filler) continue;
    for (const name of listDirs(path.join(ctx.root, root))) out.push({ name, rel: `${root}/${name}` });
  }
  return out;
}

function xmlFiles(ctx) {
  const tpl = preset(ctx).xml || 'xmls/{xmlType}/{kebabId}.xml';
  const base = tpl.split('{xmlType}')[0].replace(/\/$/, '');
  const out = [];
  for (const type of listDirs(path.join(ctx.root, base))) {
    for (const n of fs.readdirSync(path.join(ctx.root, base, type)).filter((x) => x.endsWith('.xml')).sort()) {
      out.push({ name: n.replace(/\.xml$/, ''), rel: `${base}/${type}/${n}` });
    }
  }
  return out;
}

function manifestFiles(ctx) {
  const annexB = preset(ctx).annexB;
  if (!annexB) return [];
  const dir = `${annexB}/manifests`;
  const out = [];
  for (const g of listDirs(path.join(ctx.root, dir))) {
    for (const n of fs.readdirSync(path.join(ctx.root, dir, g)).filter((x) => /^st3-f-pcap-\d{3}\.json$/i.test(x)).sort()) {
      out.push({ name: n.replace(/\.json$/, ''), rel: `${dir}/${g}/${n}` });
    }
  }
  return out;
}

function readText(abs) {
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
}

// --- checks ---------------------------------------------------------------

function checkPresent(ctx, atl, app) {
  let dir;
  try {
    dir = atl.layout.appDir(app.id);
  } catch (err) {
    return [skipped('V-COH-001', `${app.id}: layout cannot place it (${err.message})`)];
  }
  if (fs.existsSync(path.join(ctx.root, dir))) return [];
  return [finding({ check: 'V-COH-001', artifact: app.id, path: posix(dir), message: `${app.id} not started: no folder at ${posix(dir)}/`, evidence: `cases: ${(app.cases || []).join(', ') || '—'}` })];
}

function checkCited(atl, item) {
  const id = atl.ids.fromFolderName(item.name);
  const art = atl.catalog.findArtifact(id);
  if (!art) return [finding({ check: 'V-COH-002', artifact: id, path: item.rel, message: `${id} is in the repository but not in the v1.1 catalogue` })];
  if (!(art.cases || []).length) return [finding({ check: 'V-COH-002', artifact: id, path: item.rel, message: `${id} is not cited by any test case` })];
  return [];
}

// "the G008 group document v1.1", "the G004 and G015 group documents v1.1",
// "group document ST3_F_G_008 v1.1".
const VERSION_PATTERNS = [
  /\b(G(?:\d{3}|MHA)(?:\s*(?:,|and)\s*G(?:\d{3}|MHA))*)\s+group\s+documents?\s+v(\d+(?:\.\d+)?)/gi,
  /\bgroup\s+documents?\s+(ST3_F_G_(?:\d{3}|MHA))\s+v(\d+(?:\.\d+)?)/gi,
];

function checkVersion(app, readme, rel, sources) {
  if (readme === null) return [skipped('V-COH-003', `${rel}: no README.md`)];
  const expected = new Map(sources.map((g) => [groupCode(g.id), g.version]));
  const stated = new Map();
  for (const re of VERSION_PATTERNS) {
    for (const m of readme.matchAll(re)) {
      for (const g of m[1].match(/(?:G_?)(\d{3}|MHA)/gi) || []) stated.set(g.replace(/^G_?/i, '').toUpperCase(), m[2]);
    }
  }
  const out = [];
  for (const g of (app.groups || []).map(groupCode).filter(Boolean)) {
    const want = expected.get(g);
    const got = stated.get(g);
    if (!got) {
      out.push(finding({ check: 'V-COH-003', severity: 'note', artifact: app.id, path: rel, message: `README does not state which G${g} group document version it follows`, evidence: want ? `catalogue: v${want}` : null }));
    } else if (want && got !== want) {
      out.push(finding({ check: 'V-COH-003', artifact: app.id, path: rel, message: `README follows G${g} group document v${got}, catalogue sources have v${want}` }));
    }
  }
  return out;
}

function checkEscalations(app, readme, rel, raw, atl) {
  if (readme === null) return [skipped('V-COH-004', `${rel}: no README.md`)];
  const open = new Set((raw.escalation_status || []).filter((e) => e.open).map((e) => e.code));
  const byCode = new Map();
  for (const c of app.cases || []) {
    const tc = atl.catalog.findCase(c);
    for (const e of (tc && tc.escalations) || []) {
      if (!open.has(e)) continue;
      if (!byCode.has(e)) byCode.set(e, []);
      byCode.get(e).push(c);
    }
  }
  const out = [];
  for (const [code, cases] of byCode) {
    if (!new RegExp(`\\b${code}\\b`).test(readme)) {
      out.push(finding({ check: 'V-COH-004', artifact: app.id, path: rel, message: `open escalation ${code} affects ${cases.join(', ')} but the README does not record it as a risk` }));
    }
  }
  return out;
}

function summaryCases(md) {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => /^##\s+Summary\b/i.test(l));
  if (start === -1) return null;
  const out = new Set();
  for (let i = start + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) {
    const m = /^\|\s*(ST3_F_TC_\w+)\s*\|/.exec(lines[i]);
    if (m) out.add(m[1]);
  }
  return out;
}

function checkEvidence(ctx, atl, app) {
  let dir;
  try {
    dir = posix(atl.layout.evidenceDir(app.id));
  } catch (err) {
    return [skipped('V-COH-005', `${app.id}: layout cannot place its evidence (${err.message})`)];
  }
  const rel = `${dir}/self-test.md`;
  const md = readText(path.join(ctx.root, rel));
  const f = (message, evidence) => finding({ check: 'V-COH-005', artifact: app.id, path: rel, message, evidence });
  if (md === null) return [f('built artifact has no layer-1 evidence (self-test.md)')];
  const got = summaryCases(md);
  if (!got) return [f('self-test.md has no "## Summary" table')];
  const want = new Set(app.cases || []);
  const missing = [...want].filter((c) => !got.has(c));
  const extra = [...got].filter((c) => !want.has(c));
  const out = [];
  if (missing.length) out.push(f(`evidence does not cover ${missing.join(', ')}`));
  if (extra.length) out.push(f(`evidence lists cases the catalogue does not attach to ${app.id}: ${extra.join(', ')}`));
  return out;
}

function* walk(abs, rel) {
  let entries = [];
  try {
    entries = fs.readdirSync(abs, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) yield* walk(path.join(abs, e.name), r);
    else if (e.isFile()) yield { abs: path.join(abs, e.name), rel: r };
  }
}

function checkRetired(ctx, raw, inScope) {
  const retired = raw.retired_declarations || [];
  if (!retired.length) return [skipped('V-COH-006', 'catalogue lists no retired identifiers')];
  const p = preset(ctx);
  const roots = new Set((p.codeRoots || []).map((r) => r.replace(/\/$/, '')));
  const xmlBase = (p.xml || 'xmls/{xmlType}').split('{xmlType}')[0].replace(/\/$/, '');
  roots.add(xmlBase);
  if (p.annexB) roots.add(p.annexB);
  const re = new RegExp(`\\b(${retired.map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'g');
  const out = [];
  for (const root of [...roots].sort()) {
    for (const file of walk(path.join(ctx.root, root), root)) {
      if (!TEXT_EXT.has(path.extname(file.rel).toLowerCase())) continue;
      if (RETIRED_SCAN_EXCLUDE.some((x) => x.test(file.rel)) || !inScope(file.rel)) continue;
      let size = 0;
      try {
        size = fs.statSync(file.abs).size;
      } catch {
        continue;
      }
      if (size > MAX_SCAN_BYTES) continue;
      const lines = (readText(file.abs) || '').split('\n');
      lines.forEach((line, i) => {
        for (const m of line.matchAll(re)) {
          out.push(finding({ check: 'V-COH-006', artifact: m[1], path: file.rel, location: `line ${i + 1}`, message: `retired identifier ${m[1]} is used` }));
        }
      });
    }
  }
  return out;
}

// --- run -----------------------------------------------------------------

function run(ctx, targets = []) {
  const atl = loadAtlantis(ctx.root);
  if (!atl.ok) return checksForFamily('coherence').map((ch) => skipped(ch.id, atl.reason));
  const raw = atl.catalog.load().raw || {};
  if (!Array.isArray(raw.artifact_index)) return checksForFamily('coherence').map((ch) => skipped(ch.id, 'catalogue has no artifact_index'));

  const idTargets = new Set(targets.filter((t) => t.kind === 'id').map((t) => atl.ids.withPrefix(t.value)));
  const pathTargets = targets.filter((t) => t.kind === 'path').map((t) => t.value.replace(/\/$/, ''));
  const pathIn = (rel) => !pathTargets.length || pathTargets.some((t) => t === '.' || rel === t || rel.startsWith(`${t}/`));
  const relIn = (id, rel) => !targets.length || idTargets.has(id) || (pathTargets.length > 0 && pathIn(rel));

  const results = [];
  const formal = raw.artifact_index.filter(isFormalApp);
  const sources = (atl.catalog.sources && atl.catalog.sources().groups) || [];

  // 001: every formal app in the catalogue
  for (const app of formal) {
    let dir = null;
    try {
      dir = posix(atl.layout.appDir(app.id));
    } catch {
      // reported by checkPresent
    }
    if (!relIn(app.id, dir || '')) continue;
    results.push(...emit('V-COH-001', app.id, dir, checkPresent(ctx, atl, app)));
  }

  // 002: every artifact present in the tree
  const items = [...appFolders(ctx), ...xmlFiles(ctx), ...manifestFiles(ctx)];
  for (const item of items) {
    const id = atl.ids.fromFolderName(item.name);
    if (!relIn(id, item.rel)) continue;
    results.push(...emit('V-COH-002', id, item.rel, checkCited(atl, item)));
  }

  // 003..005: built formal apps
  for (const folder of appFolders(ctx)) {
    const id = atl.ids.fromFolderName(folder.name);
    const app = atl.catalog.findArtifact(id);
    if (!app || !isFormalApp(app) || !relIn(id, folder.rel)) continue;
    const readmeRel = `${folder.rel}/README.md`;
    const readme = readText(path.join(ctx.root, readmeRel));
    results.push(...emit('V-COH-003', id, readmeRel, checkVersion(app, readme, readmeRel, sources)));
    results.push(...emit('V-COH-004', id, readmeRel, checkEscalations(app, readme, readmeRel, raw, atl)));
    results.push(...emit('V-COH-005', id, folder.rel, checkEvidence(ctx, atl, app)));
  }

  // 006: retired identifiers anywhere in the governed tree
  const retired = checkRetired(ctx, raw, (rel) => !targets.length || pathIn(rel) || [...idTargets].some((id) => rel.includes(atl.ids.kebabId(id))));
  results.push(...emit('V-COH-006', null, null, retired));

  for (const ch of checksForFamily('coherence')) {
    if (!results.some((r) => r.check === ch.id)) results.push(skipped(ch.id, targets.length ? 'no artifacts match the targets' : 'nothing to check'));
  }
  return results;
}

module.exports = { run, summaryCases };
