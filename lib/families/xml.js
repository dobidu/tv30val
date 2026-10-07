'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { checksForFamily } = require('../catalogue');
const { finding, skipped, passed } = require('../finding');
const { loadAtlantis } = require('../atlantis');
const { parse, xmllint, validateXsd } = require('../xml');
const NAMESPACES = require('../normative/namespaces');
const { parseHeader } = require('../header');

const XML_TYPES = ['BAMT', 'BALD', 'PRRD', 'ESG', 'AEAT'];
const PER_FILE_AFTER_001 = ['V-XML-002', 'V-XML-003', 'V-XML-004', 'V-XML-005', 'V-XML-006', 'V-XML-007', 'V-XML-008', 'V-XML-009', 'V-XML-010', 'V-XML-012'];
const ESG_FILE = /^st3-esg-(service|schedule|content)-(\d{3})\.xml$/i;

const posix = (p) => p.split(path.sep).join('/');

// Findings for a check on a file, or a pass when the check ran and found nothing.
function orPass(check, file, results) {
  return results.length ? results : [passed(check, { artifact: file.id, path: file.rel })];
}

// null = check not applicable to this file; [] = ran clean; skips pass through.
function emit(check, file, results) {
  if (results === null) return [];
  if (results.some((r) => r.status === 'skipped')) return results;
  return orPass(check, file, results);
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

// Maps validator messages (xmllint and xmlschema wording) to the check they enforce.
function classifySchemaError(message, type = '') {
  if (/not an element of the set|not accepted by the pattern|not a valid value|facet|enumeration|doesn't match any pattern|not in enumeration|value must be one of/i.test(message)) return 'V-XML-004';
  if (/ChildrenValidation/.test(type) || /not expected|missing child|expected is|is not complete|unexpected child/i.test(message)) return 'V-XML-005';
  return 'V-XML-002';
}

function findXsd(dir, name) {
  const direct = path.join(dir, name);
  if (fs.existsSync(direct)) return direct;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      const hit = findXsd(path.join(dir, e.name), name);
      if (hit) return hit;
    }
  }
  return null;
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
  const { schemas, validator } = ctx.sources;
  let reason = null;
  let xsd = null;
  if (!schemas.available) reason = schemas.reason;
  else if (!validator.available) reason = validator.reason;
  else if (!ns || !ns.xsd) reason = `XSD file name for ${file.type} not recorded`;
  else if (!(xsd = findXsd(schemas.path, ns.xsd))) reason = `XSD ${ns.xsd} not in ${schemas.path}`;
  const ids = ['V-XML-002', 'V-XML-004', 'V-XML-005'];
  if (reason) return ids.map((c) => skipped(c, `${file.rel}: ${reason}`));

  const r = validateXsd(validator, xsd, file.abs);
  if (r.code === 5) return ids.map((c) => skipped(c, `${file.rel}: XSD ${ns.xsd} could not be compiled by ${validator.kind}`));
  return r.errors.map((e) => {
    const check = classifySchemaError(e.message, e.type);
    const location = e.line ? `line ${e.line}` : e.path || null;
    return finding({ check, artifact: id, path: file.rel, location, message: e.message, evidence: `${validator.kind} against ${ns.xsd}` });
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

// --- Header and semantic checks (V-XML-007..010, 012) ----------------------

const HEADER_FIELDS = [
  ['ID and type on the first line', (h) => h.id && h.type],
  ['source document version (vX.Y)', (h) => h.versions.length > 0],
  ['"Used by:" case list', (h) => h.usedBy !== null],
  ['"Specification variant:"', (h) => h.variant !== null],
  ['"Assumptions" section', (h) => h.assumptions !== null],
];

function checkHeaderFields(file, header) {
  const f = (message) => finding({ check: 'V-XML-007', artifact: file.id, path: file.rel, location: header ? `line ${header.line}` : 'top of file', message });
  if (!header) return [f('no header comment')];
  return HEADER_FIELDS.filter(([, ok]) => !ok(header)).map(([name]) => f(`header comment has no ${name}`));
}

function checkHeaderCases(file, header, atl) {
  if (!atl.ok) return [skipped('V-XML-008', `${file.rel}: ${atl.reason}`)];
  if (!header || !header.usedBy) return [skipped('V-XML-008', `${file.rel}: header lists no cases (see V-XML-007)`)];
  const art = atl.catalog.findArtifact(file.id);
  if (!art) return [skipped('V-XML-008', `${file.rel}: ${file.id} not in the catalogue (see V-XML-006)`)];
  const inHeader = new Set(header.usedBy.map((u) => atl.ids.normalizeCaseId(u.caseShort)));
  const inCatalogue = new Set(art.cases || []);
  const extra = [...inHeader].filter((c) => !inCatalogue.has(c));
  const missing = [...inCatalogue].filter((c) => !inHeader.has(c));
  const evidence = `header: ${[...inHeader].join(', ') || '—'}; catalogue: ${[...inCatalogue].join(', ') || '—'}`;
  const out = [];
  const location = `line ${header.line}`;
  if (extra.length) out.push(finding({ check: 'V-XML-008', artifact: file.id, path: file.rel, location, message: `header lists cases the catalogue does not attach to ${file.id}: ${extra.join(', ')}`, evidence }));
  if (missing.length) out.push(finding({ check: 'V-XML-008', artifact: file.id, path: file.rel, location, message: `header omits catalogue cases: ${missing.join(', ')}`, evidence }));
  return out;
}

const DELIBERATE_PAST = /expired|in the past|already (?:ended|over)|past window|deliberately past/i;

function checkValidity(file, parsed, header, now) {
  if (file.type !== 'BALD') return null;
  const out = [];
  for (const el of parsed.elements) {
    for (const attr of ['validFrom', 'validUntil']) {
      const a = el.attrs[attr];
      if (!a) continue;
      const t = Date.parse(a.value);
      const location = `line ${a.line}, @${attr}`;
      if (Number.isNaN(t)) {
        out.push(finding({ check: 'V-XML-009', artifact: file.id, path: file.rel, location, message: `${attr} "${a.value}" is not a valid xs:date/xs:dateTime` }));
      } else if (attr === 'validUntil' && t < now) {
        if (header && header.validity && DELIBERATE_PAST.test(header.validity)) continue;
        out.push(finding({
          check: 'V-XML-009', artifact: file.id, path: file.rel, location,
          message: `validity window ended ${a.value}, before this run, and the header does not declare it deliberate`,
          evidence: 'express windows relative to execution, or state the deliberate past window under "Validity windows:"',
        }));
      }
    }
  }
  return out;
}

function checkSignalledUrls(file, parsed, ctx, atl) {
  const carriers = parsed.elements.filter((el) => el.attrs.bcastEntryPackageUrl);
  if (!carriers.length) return null;
  if (!atl.ok) return [skipped('V-XML-010', `${file.rel}: ${atl.reason}`)];
  const out = [];
  for (const el of carriers) {
    const pkg = el.attrs.bcastEntryPackageUrl;
    const location = `line ${pkg.line}, @bcastEntryPackageUrl`;
    const stem = path.posix.basename(pkg.value).replace(/\.[^.]+$/, '');
    // Only kebab artifact names can be mapped; anything else is reported, not guessed.
    if (!/^st3-/i.test(stem)) {
      out.push(finding({ check: 'V-XML-010', severity: 'note', artifact: file.id, path: file.rel, location, message: `could not resolve package "${pkg.value}" to an application`, evidence: 'package name is not a kebab artifact ID (st3-…)' }));
      continue;
    }
    const appId = atl.ids.fromFolderName(stem);
    if (!atl.catalog.findArtifact(appId)) {
      out.push(finding({ check: 'V-XML-010', artifact: file.id, path: file.rel, location, message: `package "${pkg.value}" announces ${appId}, which is not in the v1.1 catalogue` }));
      continue;
    }
    let dir;
    try {
      dir = atl.layout.appDir(appId);
    } catch (err) {
      out.push(finding({ check: 'V-XML-010', severity: 'note', artifact: file.id, path: file.rel, location, message: `could not resolve ${appId} to an application folder`, evidence: err.message }));
      continue;
    }
    const absDir = path.join(ctx.root, dir);
    if (!fs.existsSync(absDir)) {
      out.push(finding({ check: 'V-XML-010', artifact: file.id, path: file.rel, location, message: `package "${pkg.value}" announces ${appId}, but ${posix(dir)}/ does not exist` }));
      continue;
    }
    const entry = el.attrs.bcastEntryPointUrl;
    if (!entry) {
      out.push(finding({ check: 'V-XML-010', artifact: file.id, path: file.rel, location: `line ${el.line}`, message: 'bcastEntryPackageUrl without bcastEntryPointUrl' }));
    } else if (!fs.existsSync(path.join(absDir, entry.value))) {
      out.push(finding({ check: 'V-XML-010', artifact: file.id, path: file.rel, location: `line ${entry.line}, @bcastEntryPointUrl`, message: `entry point "${entry.value}" not found in ${posix(dir)}/` }));
    }
  }
  return out;
}

const EXAMPLE_DOMAIN = /\b((?:[a-z0-9-]+\.)*(?:example\.(?:org|com|net)|[a-z0-9-]+\.(?:example|test|invalid)))\b/gi;

function checkPlaceholders(file, parsed, header) {
  const values = [];
  for (const el of parsed.elements) for (const a of Object.values(el.attrs)) values.push({ text: a.value, line: a.line });
  values.push(...parsed.texts);
  const domains = new Map();
  let urn = null;
  for (const v of values) {
    for (const m of v.text.matchAll(EXAMPLE_DOMAIN)) {
      const d = m[1].toLowerCase();
      if (!domains.has(d)) domains.set(d, v.line);
    }
    if (!urn && /\burn:/i.test(v.text)) urn = v.line;
  }
  const assumptions = header && header.assumptions ? header.assumptions.toLowerCase() : '';
  const out = [];
  const note = (line, message) => finding({ check: 'V-XML-012', artifact: file.id, path: file.rel, location: `line ${line}`, message, evidence: header && header.assumptions ? null : 'header has no Assumptions section' });
  for (const [d, line] of domains) {
    const base = d.split('.').slice(-2).join('.');
    if (!assumptions.includes(d) && !assumptions.includes(base)) out.push(note(line, `example domain ${d} is not declared as an assumption`));
  }
  if (urn !== null && !/\burns?\b|identifier/.test(assumptions)) out.push(note(urn, 'urn: identifiers are not declared as placeholders in the Assumptions section'));
  return out;
}

function run(ctx, targets = []) {
  const now = Date.now();
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
      // V-XML-002 ("validates against its XSD") passes only when validation is
      // clean; errors classified as 004/005 still mean the file is invalid.
      if (!schema.length) results.push(passed('V-XML-002', { artifact: file.id, path: file.rel }));
      for (const c of ['V-XML-004', 'V-XML-005']) {
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

    if (!wf.parsed) {
      for (const c of ['V-XML-007', 'V-XML-008', 'V-XML-009', 'V-XML-010', 'V-XML-012']) {
        results.push(skipped(c, `${file.rel}: built-in reader could not read the document (${wf.readerError.message})`));
      }
      continue;
    }
    const header = parseHeader(wf.parsed.comments[0]);
    results.push(...emit('V-XML-007', file, checkHeaderFields(file, header)));
    results.push(...emit('V-XML-008', file, checkHeaderCases(file, header, atl)));
    results.push(...emit('V-XML-009', file, checkValidity(file, wf.parsed, header, now)));
    results.push(...emit('V-XML-010', file, checkSignalledUrls(file, wf.parsed, ctx, atl)));
    results.push(...emit('V-XML-012', file, checkPlaceholders(file, wf.parsed, header)));
  }

  const esg = checkEsgTriple(files);
  results.push(...esg);
  if (!esg.length) results.push(passed('V-XML-011', { path: 'ESG' }));
  return results;
}

module.exports = { run, classifySchemaError };
