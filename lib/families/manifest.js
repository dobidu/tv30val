'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { checksForFamily } = require('../catalogue');
const { finding, skipped, passed } = require('../finding');
const { loadAtlantis } = require('../atlantis');
const { validate, unsupportedKeywords } = require('../jsonschema');

const MANIFEST_FILE = /^st3-f-pcap-\d{3}\.json$/i;
const ASCENDING_CHANNEL = /ascending virtual channel/i;

const posix = (p) => p.split(path.sep).join('/');

function preset(ctx) {
  const l = ctx.layout;
  return l && l.presets && l.presets[l.preset] ? l.presets[l.preset] : null;
}

// annexB comes from layout.json. The manifest-schema/ and manifests/ sub-paths
// are not in layout.json; they are documented in <annexB>/manifest-schema/README.md.
function paths(ctx) {
  const p = preset(ctx);
  if (!p || !p.annexB) return { reason: ctx.layout ? 'annexB not in layout.json' : 'layout.json unavailable, annexB unknown' };
  const annexB = p.annexB;
  return {
    annexB,
    schemaDir: path.posix.join(annexB, 'manifest-schema'),
    dataDir: path.posix.join(annexB, 'manifests'),
    fillerDir: p.fillerGroup || 'applications-staging',
  };
}

function readJson(abs) {
  try {
    return { value: JSON.parse(fs.readFileSync(abs, 'utf8')) };
  } catch (err) {
    return { error: err.message };
  }
}

function loadSchema(ctx, rel) {
  const abs = path.join(ctx.root, rel);
  if (!fs.existsSync(abs)) return { reason: `schema ${rel} not found` };
  const r = readJson(abs);
  if (r.error) return { reason: `schema ${rel} is not valid JSON: ${r.error}` };
  const unknown = unsupportedKeywords(r.value);
  if (unknown.length) return { reason: `schema ${rel} uses keywords this validator does not support: ${unknown.join(', ')}` };
  return { schema: r.value };
}

function discoverManifests(ctx, dataDir) {
  const out = [];
  const absData = path.join(ctx.root, dataDir);
  let groups = [];
  try {
    groups = fs.readdirSync(absData, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  } catch {
    return out;
  }
  for (const g of groups) {
    for (const name of fs.readdirSync(path.join(absData, g)).sort()) {
      if (MANIFEST_FILE.test(name)) out.push({ name, rel: posix(path.join(dataDir, g, name)), abs: path.join(absData, g, name) });
    }
  }
  return out;
}

// Every value under a "card" key, at any depth, with its JSON pointer.
function cardRefs(node, ptr = '', out = []) {
  if (Array.isArray(node)) node.forEach((x, i) => cardRefs(x, `${ptr}/${i}`, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'card' && typeof v === 'string') out.push({ card: v, pointer: `${ptr}/card` });
      else cardRefs(v, `${ptr}/${k}`, out);
    }
  }
  return out;
}

function expectedCatalogs(node, ptr = '', out = []) {
  if (Array.isArray(node)) node.forEach((x, i) => expectedCatalogs(x, `${ptr}/${i}`, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'expectedCatalog' && v && typeof v === 'object') out.push({ catalog: v, pointer: `${ptr}/${k}` });
      expectedCatalogs(v, `${ptr}/${k}`, out);
    }
  }
  return out;
}

function channelKey(vc) {
  const m = /^(\d+)\.(\d+)$/.exec(String(vc));
  return m ? [Number(m[1]), Number(m[2])] : null;
}

// The manifest schema allows "a card label, or a filler range like F01-F42".
function expandCard(card) {
  const m = /^([A-Z]+)(\d+)-\1(\d+)$/.exec(card);
  if (!m) return [card];
  const [, prefix, from, to] = m;
  const width = from.length;
  const out = [];
  for (let n = Number(from); n <= Number(to); n++) out.push(prefix + String(n).padStart(width, '0'));
  return out;
}

function emit(check, artifact, rel, results) {
  if (results === null) return [];
  if (results.some((r) => r.status === 'skipped')) return results;
  return results.length ? results : [passed(check, { artifact, path: rel })];
}

// --- checks ---------------------------------------------------------------

function checkSchema(schemaInfo, instance, artifact, rel) {
  if (schemaInfo.reason) return [skipped('V-MAN-001', `${rel}: ${schemaInfo.reason}`)];
  return validate(schemaInfo.schema, instance).map((e) =>
    finding({ check: 'V-MAN-001', artifact, path: rel, location: e.pointer, message: e.message, evidence: `keyword: ${e.keyword}` }),
  );
}

function checkCases(m, file, atl) {
  if (!atl.ok) return [skipped('V-MAN-002', `${file.rel}: ${atl.reason}`)];
  const out = [];
  const f = (message, evidence, location) => finding({ check: 'V-MAN-002', artifact: m.id || file.name, path: file.rel, location, message, evidence });
  const fromName = atl.ids.fromFolderName(file.name.replace(/\.json$/i, ''));
  if (m.id !== fromName) out.push(f(`manifest id ${JSON.stringify(m.id)} does not match the file name (${fromName})`, null, '/id'));
  const pcap = atl.catalog.findArtifact(m.id || fromName);
  if (!pcap) {
    out.push(f(`${m.id || fromName} is not in the v1.1 catalogue`, null, '/id'));
    return out;
  }
  const listed = Array.isArray(m.cases) ? m.cases : [];
  listed.forEach((c, i) => {
    const tc = atl.catalog.findCase(c);
    if (!tc) out.push(f(`case ${c} is not in the v1.1 catalogue`, null, `/cases/${i}`));
    else if (!(tc.artifacts || []).some((a) => a.id === pcap.id)) out.push(f(`case ${c} does not cite ${pcap.id} among its input artifacts`, null, `/cases/${i}`));
  });
  // The handoff asks one direction (listed cases exist and cite the PCAP). The
  // reverse is only binding within the manifest's own group: Annex B adds the
  // other groups' fields with their manifests, so those omissions are notes.
  const omitted = (pcap.cases || []).filter((c) => !listed.includes(c));
  const groupOf = (c) => (atl.catalog.findCase(c) || {}).group;
  const own = omitted.filter((c) => !m.group || groupOf(c) === m.group);
  const other = omitted.filter((c) => !own.includes(c));
  if (own.length) out.push(f(`manifest omits ${m.group || 'catalogue'} cases citing ${pcap.id}: ${own.join(', ')}`, null, '/cases'));
  if (other.length) {
    const groups = [...new Set(other.map(groupOf))].join(', ');
    out.push(finding({
      check: 'V-MAN-002', severity: 'note', artifact: m.id || file.name, path: file.rel, location: '/cases',
      message: `cases of other groups citing ${pcap.id} are not covered yet: ${other.join(', ')}`,
      evidence: `manifest group ${m.group || '—'}; catalogue groups ${groups}`,
    }));
  }
  return out;
}

function checkCardRefs(m, file, labels) {
  if (labels.reason) return [skipped('V-MAN-003', `${file.rel}: ${labels.reason}`)];
  const out = [];
  for (const r of cardRefs(m)) {
    const missing = expandCard(r.card).filter((label) => !labels.set.has(label));
    if (missing.length) {
      const what = missing.length === 1 && missing[0] === r.card ? `card "${r.card}"` : `range "${r.card}": ${missing.join(', ')}`;
      out.push(finding({ check: 'V-MAN-003', artifact: m.id || file.name, path: file.rel, location: r.pointer, message: `${what} not in cards.json` }));
    }
  }
  return out;
}

function checkOrdering(m, file) {
  const out = [];
  for (const { catalog, pointer } of expectedCatalogs(m)) {
    if (!ASCENDING_CHANNEL.test(catalog.orderRule || '')) continue;
    const entries = (catalog.entries || []).map((e, i) => ({ e, i, key: channelKey(e.virtualChannel) })).filter((x) => x.key);
    for (let k = 1; k < entries.length; k++) {
      const a = entries[k - 1];
      const b = entries[k];
      if (a.key[0] > b.key[0] || (a.key[0] === b.key[0] && a.key[1] > b.key[1])) {
        out.push(finding({
          check: 'V-MAN-005', artifact: m.id || file.name, path: file.rel, location: `${pointer}/entries/${b.i}`,
          message: `entry ${b.e.card || b.i} (${b.e.virtualChannel}) comes after ${a.e.card || a.i} (${a.e.virtualChannel}); orderRule is ascending virtual channel`,
        }));
        break;
      }
    }
  }
  return out;
}

function checkBuiltCards(ctx, cards, cardsRel, fillerDir) {
  const out = [];
  const f = (severity, message, location) => finding({ check: 'V-MAN-004', severity, artifact: 'cards.json', path: cardsRel, location, message });
  const referenced = new Set();
  cards.forEach((c, i) => {
    if (c.builtIn) referenced.add(posix(path.posix.normalize(c.builtIn)));
    const exists = c.builtIn && fs.existsSync(path.join(ctx.root, c.builtIn));
    if (c.state === 'built' && !c.builtIn) out.push(f('should-fix', `card ${c.label} is built but has no builtIn folder`, `/cards/${i}`));
    else if (c.state === 'built' && !exists) out.push(f('should-fix', `card ${c.label} is built but ${c.builtIn} does not exist`, `/cards/${i}`));
    else if (c.state !== 'built' && exists) out.push(f('should-fix', `card ${c.label} is "${c.state}" but its folder ${c.builtIn} exists`, `/cards/${i}`));
  });
  // Folders without a card: also catch "proposed" cards with no builtIn whose folder exists.
  let folders = [];
  try {
    folders = fs.readdirSync(path.join(ctx.root, fillerDir), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  } catch {
    // no filler folder: nothing to cross-check
  }
  for (const name of folders) {
    const rel = path.posix.join(fillerDir, name);
    if (!referenced.has(rel)) out.push(f('should-fix', `${rel}/ has no card in cards.json (no card's builtIn points to it; a proposed card may need state \"built\" and builtIn)`, null));
  }
  return out;
}

function checkUniqueChannels(cards, cardsRel) {
  const by = new Map();
  for (const c of cards) {
    if (!c.virtualChannel) continue;
    if (!by.has(c.virtualChannel)) by.set(c.virtualChannel, []);
    by.get(c.virtualChannel).push(c.label);
  }
  return [...by]
    .filter(([, labels]) => labels.length > 1)
    .map(([vc, labels]) => finding({ check: 'V-MAN-006', artifact: 'cards.json', path: cardsRel, message: `virtual channel ${vc} is used by ${labels.join(', ')}` }));
}

// --- run -----------------------------------------------------------------

function run(ctx, targets = []) {
  const p = paths(ctx);
  if (p.reason) return checksForFamily('manifest').map((ch) => skipped(ch.id, p.reason));
  if (!fs.existsSync(path.join(ctx.root, p.dataDir))) {
    return checksForFamily('manifest').map((ch) => skipped(ch.id, `no manifests directory at ${p.dataDir}`));
  }
  const atl = loadAtlantis(ctx.root);
  const results = [];

  const manifestSchema = loadSchema(ctx, path.posix.join(p.schemaDir, 'manifest.schema.json'));
  const cardsSchema = loadSchema(ctx, path.posix.join(p.schemaDir, 'cards.schema.json'));

  // cards.json
  const cardsRel = path.posix.join(p.dataDir, 'cards.json');
  const cardsAbs = path.join(ctx.root, cardsRel);
  let labels = { reason: `${cardsRel} not found` };
  let cards = null;
  if (fs.existsSync(cardsAbs)) {
    const r = readJson(cardsAbs);
    if (r.error) {
      labels = { reason: `${cardsRel} is not valid JSON` };
    } else {
      cards = Array.isArray(r.value.cards) ? r.value.cards : [];
      labels = { set: new Set(cards.map((c) => c.label)) };
    }
  }

  const all = discoverManifests(ctx, p.dataDir);
  const scoped = (file) =>
    !targets.length ||
    targets.some((t) => {
      if (t.kind === 'id') return atl.ok && `${atl.ids.kebabId(t.value)}.json` === file.name.toLowerCase();
      return t.value === '.' || file.rel === t.value || file.rel.startsWith(`${t.value.replace(/\/$/, '')}/`) || p.dataDir.startsWith(t.value.replace(/\/$/, ''));
    });
  const cardsInScope =
    !targets.length || targets.some((t) => t.kind === 'path' && (t.value === '.' || cardsRel.startsWith(t.value.replace(/\/$/, '')) || t.value === cardsRel));

  if (cardsInScope) {
    if (cards) {
      const r = readJson(cardsAbs);
      results.push(...emit('V-MAN-001', 'cards.json', cardsRel, checkSchema(cardsSchema, r.value, 'cards.json', cardsRel)));
      results.push(...emit('V-MAN-004', 'cards.json', cardsRel, checkBuiltCards(ctx, cards, cardsRel, p.fillerDir)));
      results.push(...emit('V-MAN-006', 'cards.json', cardsRel, checkUniqueChannels(cards, cardsRel)));
    } else if (fs.existsSync(cardsAbs)) {
      results.push(finding({ check: 'V-MAN-001', artifact: 'cards.json', path: cardsRel, message: `not valid JSON: ${readJson(cardsAbs).error}` }));
      for (const c of ['V-MAN-004', 'V-MAN-006']) results.push(skipped(c, labels.reason));
    } else {
      for (const c of ['V-MAN-004', 'V-MAN-006']) results.push(skipped(c, labels.reason));
    }
  }

  const files = all.filter(scoped);
  if (!files.length && !cardsInScope) {
    return checksForFamily('manifest').map((ch) => skipped(ch.id, all.length ? 'no manifests match the targets' : `no manifests under ${p.dataDir}`));
  }
  if (!files.length) {
    for (const c of ['V-MAN-002', 'V-MAN-003', 'V-MAN-005']) results.push(skipped(c, `no manifests under ${p.dataDir}`));
  }

  for (const file of files) {
    const r = readJson(file.abs);
    const artifact = atl.ok ? atl.ids.fromFolderName(file.name.replace(/\.json$/i, '')) : file.name;
    if (r.error) {
      results.push(finding({ check: 'V-MAN-001', artifact, path: file.rel, message: `not valid JSON: ${r.error}` }));
      for (const c of ['V-MAN-002', 'V-MAN-003', 'V-MAN-005']) results.push(skipped(c, `${file.rel}: not valid JSON (V-MAN-001)`));
      continue;
    }
    const m = r.value;
    results.push(...emit('V-MAN-001', artifact, file.rel, checkSchema(manifestSchema, m, artifact, file.rel)));
    results.push(...emit('V-MAN-002', artifact, file.rel, checkCases(m, file, atl)));
    results.push(...emit('V-MAN-003', artifact, file.rel, checkCardRefs(m, file, labels)));
    results.push(...emit('V-MAN-005', artifact, file.rel, checkOrdering(m, file)));
  }
  return results;
}

module.exports = { run };
