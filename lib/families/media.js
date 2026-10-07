'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { checksForFamily } = require('../catalogue');
const { finding, skipped, passed } = require('../finding');
const { loadAtlantis } = require('../atlantis');
const { sniff } = require('../media');
const { FORMATS, FOLDERS } = require('../normative/media-formats');
const { summarize } = require('../streams');
const { rulesFor } = require('../normative/stream-requirements');

// Manual §6.5.7: assets/ only holds these folders (check-structure.js enforces it).
const ASSET_FOLDERS = ['audios', 'fonts', 'hstreams', 'images', 'texts', 'videos'];
const MEDIA_TYPES = new Set(['IMAGE', 'HSTREAM', 'HVIDEO', 'MHAUDIO', 'HFILE', 'HREF', 'MMEDIA', 'AUDIO', 'TEXT']);
const SNIFF_BYTES = 512;

const posix = (p) => p.split(path.sep).join('/');

function preset(ctx) {
  const l = ctx.layout;
  return l && l.presets && l.presets[l.preset] ? l.presets[l.preset] : {};
}

function listDir(abs) {
  try {
    return fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

function emit(check, artifact, rel, results) {
  if (results === null) return [];
  if (results.some((r) => r.status === 'skipped')) return results;
  return results.length ? results : [passed(check, { artifact, path: rel })];
}

// A media item is a top-level entry of an asset folder: a file, or a directory
// holding a multi-file stream (manifest + segments).
function discover(ctx) {
  const roots = (preset(ctx).appRoots || ['applications/*', 'applications-staging/*']).map((r) => r.replace(/\/\*$/, ''));
  const filler = preset(ctx).fillerGroup || 'applications-staging';
  const items = [];
  for (const root of roots) {
    for (const app of listDir(path.join(ctx.root, root)).filter((d) => d.isDirectory())) {
      const appRel = `${root}/${app.name}`;
      for (const folder of ASSET_FOLDERS) {
        const folderRel = `${appRel}/assets/${folder}`;
        for (const e of listDir(path.join(ctx.root, folderRel))) {
          if (!e.isFile() && !e.isDirectory()) continue;
          items.push({ app: app.name, appRel, filler: root === filler, folder, name: e.name, rel: `${folderRel}/${e.name}`, isDir: e.isDirectory() });
        }
      }
    }
  }
  return items;
}

function filesOf(ctx, item) {
  if (!item.isDir) return [item.rel];
  const out = [];
  (function walk(rel) {
    for (const e of listDir(path.join(ctx.root, rel))) {
      const r = `${rel}/${e.name}`;
      if (e.isDirectory()) walk(r);
      else if (e.isFile()) out.push(r);
    }
  })(item.rel);
  return out;
}

function readHead(abs) {
  const fd = fs.openSync(abs, 'r');
  try {
    const buf = Buffer.alloc(SNIFF_BYTES);
    const n = fs.readSync(fd, buf, 0, SNIFF_BYTES, 0);
    return buf.subarray(0, n);
  } finally {
    fs.closeSync(fd);
  }
}

const stem = (name) => name.replace(/\.[^.]+$/, '');
const extOf = (name) => (/\.([^.]+)$/.exec(name) || [])[1];

// --- checks ---------------------------------------------------------------

function checkCatalogued(item, atl) {
  if (item.folder === 'fonts') return null; // fonts are not catalogued media
  if (!atl.ok) return [skipped('V-MED-001', `${item.rel}: ${atl.reason}`)];
  const name = item.isDir ? item.name : stem(item.name);
  const isId = /^st3-/i.test(name);
  const id = isId ? atl.ids.fromFolderName(name) : name;
  const f = (severity, message, evidence) => finding({ check: 'V-MED-001', severity, artifact: id, path: item.rel, message, evidence });
  if (!isId) {
    return [f('blocking', `"${item.name}" is not named after a media ID`, 'Manual §6.5.7: files are named after their media ID (e.g. st3-hstream-001)')];
  }
  const art = atl.catalog.findArtifact(id);
  if (!art) return [f('blocking', `${id} is not in the v1.1 catalogue`)];
  if (!MEDIA_TYPES.has(art.type)) return [f('blocking', `${id} is catalogued as ${art.type}, not as a media artifact`)];
  if (!(art.cases || []).length) return [f('blocking', `${id} is not cited by any test case`)];
  if (!item.filler) {
    const appId = atl.ids.fromFolderName(item.app);
    const app = atl.catalog.findArtifact(appId);
    if (app && !(app.cases || []).some((c) => art.cases.includes(c))) {
      return [f('should-fix', `${id} is in ${appId}'s assets but no case of ${appId} uses it`, `${id} cases: ${art.cases.join(', ')}`)];
    }
  }
  return [];
}

function checkFile(ctx, item, fileRel, artifact) {
  const abs = path.join(ctx.root, fileRel);
  const name = path.posix.basename(fileRel);
  const ext = (extOf(name) || '').toLowerCase();
  let size = 0;
  try {
    size = fs.statSync(abs).size;
  } catch {
    return { r002: [skipped('V-MED-002', `${fileRel}: unreadable`)], r003: [skipped('V-MED-003', `${fileRel}: unreadable`)] };
  }
  const f = (check, severity, message, evidence) => finding({ check, severity, artifact, path: fileRel, message, evidence });
  if (size === 0) return { r002: [f('V-MED-002', 'blocking', 'empty file')], r003: [skipped('V-MED-003', `${fileRel}: empty file`)] };

  const format = sniff(readHead(abs));
  if (!format) {
    return {
      r002: [f('V-MED-002', 'note', `format not recognised from the file's first bytes (declared .${ext || '—'})`)],
      r003: [skipped('V-MED-003', `${fileRel}: format not recognised`)],
    };
  }
  const def = FORMATS[format];
  const r002 = [];
  if (!ext || !def.ext.includes(ext)) {
    r002.push(f('V-MED-002', 'blocking', `content is ${format} but the extension is .${ext || '(none)'}`, `extensions for ${format}: ${def.ext.join(', ')}`));
  }
  const allowed = FOLDERS[item.folder] || [];
  const r003 = allowed.includes(def.kind)
    ? []
    : [f('V-MED-003', 'should-fix', `${/^[aeiou]/.test(def.kind) ? 'an' : 'a'} ${def.kind} file (${format}) in ${item.folder}/`, `${item.folder}/ holds: ${allowed.join(', ')}`)];
  return { r002, r003 };
}

// HSTREAM manifest: a single .mpd/.m3u8 item, or inside a stream directory the
// top-level MPD, else the HLS master playlist, else the only playlist.
function findManifest(ctx, item) {
  if (!item.isDir) return /\.(mpd|m3u8?)$/i.test(item.name) ? { rel: item.rel, others: [] } : null;
  const names = listDir(path.join(ctx.root, item.rel)).filter((e) => e.isFile()).map((e) => e.name);
  const mpds = names.filter((n) => /\.mpd$/i.test(n));
  if (mpds.length) return { rel: `${item.rel}/${mpds[0]}`, others: mpds.slice(1) };
  const lists = names.filter((n) => /\.m3u8?$/i.test(n));
  const master = lists.find((n) => /#EXT-X-STREAM-INF/.test(fs.readFileSync(path.join(ctx.root, item.rel, n), 'utf8')));
  if (master) return { rel: `${item.rel}/${master}`, others: lists.filter((n) => n !== master) };
  if (lists.length === 1) return { rel: `${item.rel}/${lists[0]}`, others: [] };
  return lists.length ? { rel: null, ambiguous: lists } : null;
}

function checkStream(ctx, item, artifact, atl) {
  if (item.folder !== 'hstreams' || !atl.ok) return null;
  const art = atl.catalog.findArtifact(artifact);
  if (!art || art.type !== 'HSTREAM') return null; // V-MED-001 reports it
  const description = String(art.description || '').replace(/^ST3_HSTREAM_\d+\s*/, '');
  const req = rulesFor(description);
  if (req.notCheckable) return [skipped('V-MED-004', `${item.rel}: requirement not machine-checkable from the manifest: ${req.notCheckable}`)];

  const f = (message, evidence, rel = item.rel) => finding({ check: 'V-MED-004', artifact, path: rel, message, evidence });
  const manifest = findManifest(ctx, item);
  if (manifest && manifest.ambiguous) return [f(`several playlists and no master: ${manifest.ambiguous.join(', ')}`, 'cannot tell which manifest the stream uses')];
  const summary = manifest ? summarize(manifest.rel, fs.readFileSync(path.join(ctx.root, manifest.rel), 'utf8')) : null;

  if (req.expectInvalid) {
    return summary && summary.valid ? [f('the case expects an invalid or unavailable manifest, but this one is valid', `${summary.kind.toUpperCase()} manifest parses`, manifest.rel)] : [];
  }
  if (!summary) return [f('no DASH or HLS manifest found')];
  if (!summary.valid) return [f(`manifest is not valid: ${summary.error}`, null, manifest.rel)];
  const out = [];
  for (const rule of req.rules) {
    const problem = rule.test(summary);
    if (problem) out.push(f(`requirement not met: ${rule.label}`, `${problem}${manifest.others.length ? `; other manifests: ${manifest.others.join(', ')}` : ''}`, manifest.rel));
  }
  return out;
}

// --- run -----------------------------------------------------------------

function run(ctx, targets = []) {
  const atl = loadAtlantis(ctx.root);
  const all = discover(ctx);
  if (!all.length) return checksForFamily('media').map((ch) => skipped(ch.id, 'no media assets in applications'));

  const idTargets = targets.filter((t) => t.kind === 'id').map((t) => t.value.toLowerCase().replace(/_/g, '-'));
  const pathTargets = targets.filter((t) => t.kind === 'path').map((t) => t.value.replace(/\/$/, ''));
  const scoped = (item) =>
    !targets.length ||
    idTargets.some((k) => item.app.toLowerCase() === k || stem(item.name).toLowerCase() === k || item.name.toLowerCase() === k) ||
    pathTargets.some((p) => p === '.' || item.rel === p || item.rel.startsWith(`${p}/`) || item.appRel === p || item.appRel.startsWith(`${p}/`));
  const items = all.filter(scoped);
  if (!items.length) return checksForFamily('media').map((ch) => skipped(ch.id, 'no media assets match the targets'));

  const results = [];
  for (const item of items) {
    const name = item.isDir ? item.name : stem(item.name);
    const artifact = atl.ok && /^st3-/i.test(name) ? atl.ids.fromFolderName(name) : name;
    results.push(...emit('V-MED-001', artifact, item.rel, checkCatalogued(item, atl)));
    for (const fileRel of filesOf(ctx, item)) {
      const { r002, r003 } = checkFile(ctx, item, fileRel, artifact);
      results.push(...emit('V-MED-002', artifact, fileRel, r002));
      results.push(...emit('V-MED-003', artifact, fileRel, r003));
    }
  }
  const streams = items.filter((i) => i.folder === 'hstreams');
  for (const item of streams) {
    const name = item.isDir ? item.name : stem(item.name);
    const artifact = atl.ok && /^st3-/i.test(name) ? atl.ids.fromFolderName(name) : name;
    results.push(...emit('V-MED-004', artifact, item.rel, checkStream(ctx, item, artifact, atl)));
  }
  if (!results.some((r) => r.check === 'V-MED-004')) {
    results.push(skipped('V-MED-004', atl.ok ? 'no catalogued HSTREAM assets' : atl.reason));
  }
  return results;
}

module.exports = { run, discover };
