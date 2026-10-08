#!/usr/bin/env node
'use strict';

// One-off generator for the API index (handoff §6.2, V-APP-006/007, V-MOD-003).
//
// Input: plain text extracted from ABNT NBR 25608:2025 (e.g. `mutool draw -F txt`).
// Output: JSON with one entry per API id from Table C.2 (TV 3.0 WebServices,
// Annex C) and Table D.1 (NCLua, Annex D): id, clause, version, and the
// endpoints (method + path) or Lua functions found in that clause.
//
// The standard is a protected document. The index holds API names, clause
// numbers and paths only — no normative text — and is written to a gitignored
// location by default. Whether it may be committed is the coordinators' call.
//
//   node tools/build-api-index.js <nbr-25608.txt> [reference/api-index.json]

const fs = require('node:fs');
const path = require('node:path');

const NOISE = /^(Exemplar para uso exclusivo|Impresso por:|ABNT NBR 25608:2025\s*$|© ABNT 2025|[1-9]\d*\s*$)/;

function clean(lines) {
  return lines.map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim() && !NOISE.test(l.trim()));
}

// Rows of a "Table X.n — ... ids" table. An id line starts a row; the clause
// and version are recognised by shape, so a missing or garbled cell (some
// clauses extract as "0") does not shift the columns.
function idTable(lines, caption) {
  const start = lines.findIndex((l) => l.startsWith(caption));
  if (start === -1) throw new Error(`${caption} not found`);
  const rows = [];
  let row = null;
  let endAt = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    const own = caption.split(' — ')[0]; // e.g. "Table C.2"
    if (/^(id|Section|Current [Vv]ersion|Section \/ Description)$/.test(t) || t.startsWith(`${own} `) || t === own) continue;
    if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(t)) {
      row = { id: t, cells: [] };
      rows.push(row);
      continue;
    }
    if (!row) continue;
    if (/^([A-E]\.\d+(\.\d+)*|Annex [A-E]|Table [A-E]\.\d+)(\s|$)/.test(t) && row.cells.length >= 2) { endAt = i; break; } // past the table
    row.cells.push(t);
  }
  const out = rows.map(({ id, cells }) => [
    id,
    cells.find((c) => /^[CD]\.\d+(\.\d+)*$/.test(c)) || '0',
    cells.find((c) => /^\d+\.\d+$/.test(c)) || null,
  ]);
  out.end = endAt;
  return out;
}

// Line index of a clause heading: the clause number alone on its line followed
// by a title, or number and title on one line. Table cells that hold a clause
// number are followed by a version ("2.0"), not a title.
function headingIndex(lines, clause, from) {
  const esc = clause.replace(/\./g, '\\.');
  const alone = new RegExp(`^${esc}$`);
  const inline = new RegExp(`^${esc}\\s+[A-Z]`);
  for (let i = from; i < lines.length; i++) {
    const t = lines[i].trim();
    if (/\.{4}/.test(t)) continue;
    if (inline.test(t)) return i;
    const next = (lines[i + 1] || '').trim();
    if (alone.test(t) && /^[A-Za-z]/.test(next) && !/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(next)) return i;
  }
  return -1;
}

// Lines of a clause, up to the next heading that is not one of its subclauses.
function bodyOf(lines, start, clause) {
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    const h = /^([A-E]\.\d+(?:\.\d+)*)(?:\s+([A-Z].*))?$/.exec(t);
    if (h && !h[1].startsWith(`${clause}.`) && (h[2] !== undefined || /^[A-E]\.\d+(\.\d+)*$/.test(t))) break;
    if (/^Annex [A-E]\b/.test(t)) break;
    out.push(lines[i]);
  }
  return out;
}

// "Request format:" … URL lines … "Type of operation:" (or "Operation Type:") METHOD
const METHOD_LABEL = /^(Type of operation|Operation [Tt]ype):\s*/;
function endpoints(body) {
  const out = [];
  for (let i = 0; i < body.length; i++) {
    if (!/^Request format:/.test(body[i].trim())) continue;
    let url = body[i].replace(/^.*Request format:\s*/, '');
    let j = i + 1;
    for (; j < body.length && !METHOD_LABEL.test(body[j].trim()) && !/^[A-Z][A-Za-z]+( [A-Za-z]+)*:/.test(body[j].trim()); j++) {
      url += body[j].trim();
    }
    let method = null;
    if (j < body.length && METHOD_LABEL.test(body[j].trim())) {
      method = body[j].replace(METHOD_LABEL, '').trim() || (body[j + 1] || '').trim();
    }
    // A row may list variants: "(1) http://<host>/tv3/a … (2) Access via …: http://<host>/tv3/b".
    const ok = method && /^(GET|POST|DELETE|PUT|PATCH)$/.test(method) ? method : null;
    for (const m of url.replace(/\s+/g, '').matchAll(/\/tv3\/[^\s(]*?(?=\(\d+\)|$|https?:)/g)) {
      // Optional query written as "[?a=…]" → query; optional path segments "[/x]" stay in the path.
      const [p, query] = m[0].replace(/\[\?/, '?').replace(/\]$/, (end) => (m[0].includes('[?') ? '' : end)).split('?');
      if (!out.some((e) => e.path === p && e.method === ok)) out.push(query ? { method: ok, path: p, query } : { method: ok, path: p });
    }
  }
  return out;
}

const LUA_SIG = /^([A-Za-z_][\w]*)([:.])([A-Za-z_][\w]*)\s*\(([^)]*)\)/;
const EVT_CLASS = /class\s*=\s*['"]([\w]+)['"]/;

function luaFunctions(body) {
  const fns = new Map();
  const classes = new Set();
  for (const l of body) {
    const m = LUA_SIG.exec(l.trim());
    if (m) {
      const name = `${m[1]}${m[2]}${m[3]}`;
      if (!fns.has(name)) fns.set(name, { name, params: m[4].split(/[;,]/).map((p) => p.split(':')[0].trim()).filter(Boolean) });
    }
    const c = EVT_CLASS.exec(l);
    if (c) classes.add(c[1]);
  }
  return { functions: [...fns.values()], eventClasses: [...classes] };
}

function build(text) {
  const lines = clean(text.split('\n'));
  const tocEnd = lines.findIndex((l) => /^Table C\.2 — /.test(l));
  if (tocEnd === -1) throw new Error('Table C.2 not found');

  const c2 = idTable(lines, 'Table C.2 — List of API ids');
  let prev = null;
  const tv3ws = c2.map(([id, section, version]) => {
    let clause = section;
    let inferred = false;
    if (!/^C\.\d/.test(section)) {
      // Extracted as "0" (a link artefact): infer the next sibling of the previous clause.
      const parts = prev.split('.');
      parts[parts.length - 1] = String(Number(parts[parts.length - 1]) + 1);
      clause = parts.join('.');
      inferred = true;
    }
    prev = clause;
    const at = headingIndex(lines, clause, c2.end);
    return { id, clause, version, inferredClause: inferred || undefined, headingFound: at !== -1, endpoints: at === -1 ? [] : endpoints(bodyOf(lines, at, clause)) };
  });

  const d1 = idTable(lines, 'Table D.1 — API ids');
  let prevD = null;
  const nclua = d1.map(([id, section, version]) => {
    let clause = /^D\.\d/.test(section) ? section : null;
    let inferred = false;
    if (!clause && prevD && id.startsWith('nclua-')) {
      // Same link artefact as Table C.2: next sibling of the previous clause.
      const parts = prevD.split('.');
      parts[parts.length - 1] = String(Number(parts[parts.length - 1]) + 1);
      clause = parts.join('.');
      inferred = true;
    }
    if (clause) prevD = clause;
    const at = clause ? headingIndex(lines, clause, d1.end) : -1;
    const { functions, eventClasses } = at === -1 ? { functions: [], eventClasses: [] } : luaFunctions(bodyOf(lines, at, clause));
    return { id, clause, version, inferredClause: inferred || undefined, headingFound: at !== -1, functions, eventClasses };
  });

  return {
    indexVersion: 1,
    source: 'ABNT NBR 25608:2025 — Annex C Table C.2 (TV 3.0 WebServices), Annex D Table D.1 (NCLua)',
    generated: new Date().toISOString().slice(0, 10),
    note: 'API names, clause numbers and paths only. Review before use; commit only with the coordinators\' agreement.',
    tv3ws,
    nclua,
  };
}

if (require.main === module) {
  const [input, output = path.join(__dirname, '..', 'reference', 'api-index.json')] = process.argv.slice(2);
  if (!input) {
    console.error('usage: node tools/build-api-index.js <nbr-25608.txt> [out.json]');
    process.exit(2);
  }
  const index = build(fs.readFileSync(input, 'utf8'));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(index, null, 2)}\n`);
  const eps = index.tv3ws.reduce((n, a) => n + a.endpoints.length, 0);
  const fns = index.nclua.reduce((n, a) => n + a.functions.length, 0);
  console.log(`tv3ws: ${index.tv3ws.length} ids, ${eps} endpoints; nclua: ${index.nclua.length} ids, ${fns} functions → ${output}`);
}

module.exports = { build, endpoints, luaFunctions, idTable };
