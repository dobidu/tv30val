'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { checksForFamily } = require('../catalogue');
const { finding, skipped, passed } = require('../finding');
const { loadAtlantis } = require('../atlantis');
const { parse, xmllint } = require('../xml');
const NAMESPACES = require('../normative/namespaces');

const XML_TYPES = ['BAMT', 'BALD', 'PRRD', 'ESG', 'AEAT'];
const PENDING = ['V-XML-007', 'V-XML-008', 'V-XML-009', 'V-XML-010', 'V-XML-012'];
const PER_FILE_AFTER_001 = ['V-XML-002', 'V-XML-003', 'V-XML-004', 'V-XML-005', 'V-XML-006'];
const ESG_FILE = /^st3-esg-(service|schedule|content)-(\d{3})\.xml$/i;

const posix = (p) => p.split(path.sep).join('/');

// Findings for a check on a file, or a pass when the check ran and found nothing.
function orPass(check, file, results) {
  return results.length ? results : [passed(check, { artifact: file.id, path: file.rel })];
}

// Directory per type comes from layout.json's "xml" pattern
// (e.g. "xmls/{xmlType}/{kebabId}.xml"); without a layout we fall back to the
// Manual §6.5.7 convention and say so.
function xmlDirs(ctx) {
  let template = null;
  const l = ctx.layout;
  if (l && l.presets && l.preset && l.presets[l.preset] && l.presets[l.preset].xml) template = l.presets[l.preset].xml;
  const fallback = !template;
  if (fallback) template = 'xmls/{xmlType}/{kebabId}.xml';
  const dirTemplate = path.posix.dirname(template);
  return {
    fallback,
    dirs: XML_TYPES.map((type) => ({ type, dir: dirTemplate.replace('{xmlType}', type.toLowerCase()) })),
  };
}

function discover(ctx) {
  const files = [];
  const { dirs, fallback } = xmlDirs(ctx);
  for (const { type, dir } of dirs) {
    const abs = path.join(ctx.root, dir);
    let names = [];
    try {
      names = fs.readdirSync(abs).filter((n) => n.toLowerCase().endsWith('.xml')).sort();
    } catch {
      continue;
    }
    for (const name of names) files.push({ type, abs: path.join(abs, name), rel: posix(path.join(dir, name)), name });
  }
  return { files, fallback, dirs };
}

function idFor(file, atl) {
  const base = file.name.replace(/\.xml$/i, '');
  return atl.ok ? atl.ids.fromFolderName(base) : base;
}

function inScope(file, id, targets, atl) {
  if (!targets.length) return true;
  return targets.some((t) => {
    if (t.kind === 'id') return (atl.ok ? atl.ids.withPrefix(t.value) : t.value) === id;
    return t.value === '.' || file.rel === t.value || file.rel.startsWith(`${t.value.replace(/\/$/, '')}/`);
  });
}

function classifySchemaError(message) {
  if (/not an element of the set|not accepted by the pattern|not a valid value|facet|enumeration/i.test(message)) return 'V-XML-004';
  if (/not expected|missing child|expected is/i.test(message)) return 'V-XML-005';
  return 'V-XML-002';
}

function checkWellFormed(ctx, file, id, text) {
  const parsed = parse(text);
  if (ctx.sources.xmllint.available) {
    const r = xmllint(['--noout', file.abs]);
    if (r.code !== 0) {
      return {
        parsed: null,
        results: r.errors.map((e) =>
          finding({ check: 'V-XML-001', artifact: id, path: file.rel, location: e.line ? `line ${e.line}` : null, message: e.message, evidence: 'xmllint --noout' }),
        ),
      };
    }
    // xmllint accepted it; if our reader cannot, the root-level checks cannot run.
    return { parsed: parsed.ok ? parsed : null, readerError: parsed.ok ? null : parsed.error, results: [] };
  }
  if (!parsed.ok) {
    return {
      parsed: null,
      results: [
        finding({
          check: 'V-XML-001',
          artifact: id,
          path: file.rel,
          location: `line ${parsed.error.line}`,
          message: parsed.error.message,
          evidence: 'checked by built-in reader (partial); install xmllint for full well-formedness checking',
        }),
      ],
    };
  }
  return { parsed, results: [] };
}

function checkSchema(ctx, file, id) {
  const ns = NAMESPACES[file.type];
  const { schemas, xmllint: lint } = ctx.sources;
  let reason = null;
  if (!schemas.available) reason = schemas.reason;
  else if (!lint.available) reason = lint.reason;
  else if (!ns || !ns.xsd) reason = `XSD file name for ${file.type} not recorded`;
  else if (!fs.existsSync(path.join(schemas.path, ns.xsd))) reason = `XSD ${ns.xsd} not in ${schemas.path}`;
  const ids = ['V-XML-002', 'V-XML-004', 'V-XML-005'];
  if (reason) return ids.map((c) => skipped(c, `${file.rel}: ${reason}`));

  const xsd = path.join(schemas.path, ns.xsd);
  const r = xmllint(['--noout', '--schema', xsd, file.abs]);
  if (r.code === 5) return ids.map((c) => skipped(c, `${file.rel}: XSD ${ns.xsd} could not be compiled by xmllint`));
  return r.errors.map((e) => {
    const check = classifySchemaError(e.message);
    return finding({ check, artifact: id, path: file.rel, location: e.line ? `line ${e.line}` : null, message: e.message, evidence: `xmllint --schema ${ns.xsd}` });
  });
}

function checkNamespace(file, id, parsed) {
  const ns = NAMESPACES[file.type];
  if (!ns || !ns.ns) return [skipped('V-XML-003', `${file.rel}: expected namespace for ${file.type} not recorded`)];
  const out = [];
  const { root } = parsed;
  const location = `line ${root.line}, <${root.name}>`;
  if (root.ns !== ns.ns) {
    out.push(finding({ check: 'V-XML-003', artifact: id, path: file.rel, location, message: `root namespace is ${root.ns ? `"${root.ns}"` : 'missing'}`, evidence: `expected "${ns.ns}"` }));
  }
  if (root.local !== file.type) {
    out.push(finding({ check: 'V-XML-003', artifact: id, path: file.rel, location, message: `root element is <${root.local}> in a ${file.type} folder`, evidence: `expected <${file.type}>` }));
  }
  return out;
}

function headerId(parsed) {
  const first = parsed.comments[0];
  if (!first) return null;
  const m = /^\s*(ST3_[A-Za-z0-9_]+)/.exec(first.text);
  return m ? { id: m[1], line: first.line } : null;
}

function checkIdentity(file, id, parsed, atl) {
  if (!atl.ok) return [skipped('V-XML-006', `${file.rel}: ${atl.reason}`)];
  const out = [];
  const f = (message, evidence, location) => finding({ check: 'V-XML-006', artifact: id, path: file.rel, location, message, evidence });
  const art = atl.catalog.findArtifact(id);
  if (!art) {
    out.push(f(`${id} (from the file name) is not in the v1.1 catalogue`, 'catalog.findArtifact returned null'));
  } else if (art.type !== file.type) {
    out.push(f(`${id} is catalogued as ${art.type} but lives in the ${file.type} folder`, null));
  }
  const header = parsed && headerId(parsed);
  if (header && header.id !== id) {
    out.push(f(`header declares ${header.id} but the file name gives ${id}`, null, `line ${header.line}`));
  }
  if (art) {
    try {
      const expected = posix(atl.layout.xmlPath(id));
      if (expected !== file.rel) out.push(f(`layout expects ${id} at ${expected}`, `found at ${file.rel}`));
    } catch (err) {
      out.push(f(err.message, 'layout.xmlPath'));
    }
  }
  return out;
}

// Manual §6.4.2: an ESG is delivered as SERVICE, SCHEDULE and CONTENT. Whether
// unbuilt ESGs exist at all is coherence (V-COH-001); here we only check that
// every ESG number present in the tree is complete.
function checkEsgTriple(files) {
  const byNumber = new Map();
  for (const file of files.filter((x) => x.type === 'ESG')) {
    const m = ESG_FILE.exec(file.name);
    if (!m) continue;
    if (!byNumber.has(m[2])) byNumber.set(m[2], { kinds: new Set(), dir: path.posix.dirname(file.rel) });
    byNumber.get(m[2]).kinds.add(m[1].toUpperCase());
  }
  if (!byNumber.size) return [skipped('V-XML-011', 'no ESG documents in the tree')];
  const out = [];
  for (const [n, { kinds, dir }] of byNumber) {
    const missing = ['SERVICE', 'SCHEDULE', 'CONTENT'].filter((k) => !kinds.has(k));
    if (missing.length) {
      out.push(finding({
        check: 'V-XML-011',
        artifact: `ST3_ESG_*_${n}`,
        path: dir,
        message: `ESG ${n} is missing ${missing.map((k) => `ST3_ESG_${k}_${n}`).join(', ')}`,
        evidence: `present: ${[...kinds].join(', ')}`,
      }));
    }
  }
  return out;
}

function run(ctx, targets = []) {
  const atl = loadAtlantis(ctx.root);
  const { files: all, fallback, dirs } = discover(ctx);
  const files = all.map((f) => ({ ...f, id: idFor(f, atl) })).filter((f) => inScope(f, f.id, targets, atl));
  const results = [];

  if (!files.length) {
    const where = dirs.map((d) => d.dir).join(', ');
    const reason = all.length ? 'no XML files match the targets' : `no XML files found under ${where}${fallback ? ' (layout.json absent; default layout assumed)' : ''}`;
    return checksForFamily('xml').map((ch) => skipped(ch.id, reason));
  }

  for (const file of files) {
    const text = fs.readFileSync(file.abs, 'utf8');
    const wf = checkWellFormed(ctx, file, file.id, text);
    results.push(...wf.results);
    if (wf.results.length) {
      for (const c of PER_FILE_AFTER_001) results.push(skipped(c, `${file.rel}: not well-formed (V-XML-001)`));
      continue;
    }
    results.push(passed('V-XML-001', { artifact: file.id, path: file.rel }));
    const schema = checkSchema(ctx, file, file.id);
    results.push(...schema);
    if (!schema.some((r) => r.status === 'skipped')) {
      for (const c of ['V-XML-002', 'V-XML-004', 'V-XML-005']) {
        if (!schema.some((r) => r.check === c)) results.push(passed(c, { artifact: file.id, path: file.rel }));
      }
    }
    if (wf.parsed) {
      const ns = checkNamespace(file, file.id, wf.parsed);
      results.push(...(ns.some((r) => r.status === 'skipped') ? ns : orPass('V-XML-003', file, ns)));
    } else {
      results.push(skipped('V-XML-003', `${file.rel}: built-in reader could not read the root (${wf.readerError.message})`));
    }
    const identity = checkIdentity(file, file.id, wf.parsed, atl);
    results.push(...(identity.some((r) => r.status === 'skipped') ? identity : orPass('V-XML-006', file, identity)));
  }

  const esg = checkEsgTriple(files);
  results.push(...esg);
  if (!esg.length) results.push(passed('V-XML-011', { path: 'ESG' }));
  for (const c of PENDING) results.push(skipped(c, 'not implemented yet (v0.1 plan 02-02)'));
  return results;
}

module.exports = { run, classifySchemaError };
