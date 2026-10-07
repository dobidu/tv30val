'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

class ContextError extends Error {}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function readable(p) {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function loadLayout(root) {
  const p = path.join(root, 'tools', 'atlantis', 'layout.json');
  if (!fs.existsSync(p)) {
    return { info: { available: false, path: p, reason: 'tools/atlantis/layout.json not found under root' }, layout: null };
  }
  try {
    return { info: { available: true, path: p }, layout: JSON.parse(fs.readFileSync(p, 'utf8')) };
  } catch (err) {
    return { info: { available: false, path: p, reason: `layout.json unreadable: ${err.message}` }, layout: null };
  }
}

// --schemas → $ATLANTIS_SCHEMAS → <root>/reference/schemas → unavailable.
// An explicit --schemas that cannot be read is an operator error (exit 2).
function resolveSchemas(root, explicit, env) {
  if (explicit) {
    const p = path.resolve(explicit);
    if (!isDir(p) || !readable(p)) throw new ContextError(`--schemas ${explicit}: not a readable directory`);
    return { available: true, path: p, via: '--schemas' };
  }
  if (env.ATLANTIS_SCHEMAS) {
    const p = path.resolve(env.ATLANTIS_SCHEMAS);
    if (isDir(p)) return { available: true, path: p, via: '$ATLANTIS_SCHEMAS' };
    return { available: false, path: p, reason: `$ATLANTIS_SCHEMAS points to ${p}, which is not a directory` };
  }
  const p = path.join(root, 'reference', 'schemas');
  if (isDir(p)) return { available: true, path: p, via: 'reference/schemas' };
  return { available: false, path: null, reason: 'no schema directory (--schemas, $ATLANTIS_SCHEMAS, reference/schemas/)' };
}

function probeXmllint() {
  const r = spawnSync('xmllint', ['--version'], { encoding: 'utf8' });
  if (r.error) {
    return { available: false, reason: 'xmllint not on PATH (install libxml2-utils / libxml2)' };
  }
  const m = /xmllint: using libxml version (\S+)/.exec(`${r.stderr}${r.stdout}`);
  return { available: true, version: m ? m[1] : 'unknown' };
}

function buildContext({ root, schemas, env = process.env }) {
  if (!isDir(root)) throw new ContextError(`root ${root} is not a directory`);
  const { info: layoutInfo, layout } = loadLayout(root);
  const catalogPath = path.join(root, 'tools', 'atlantis', 'catalog.js');
  const catalog = fs.existsSync(catalogPath)
    ? { available: true, path: catalogPath }
    : { available: false, path: catalogPath, reason: 'tools/atlantis/catalog.js not found under root' };
  return {
    root,
    layout,
    sources: {
      layout: layoutInfo,
      catalog,
      schemas: resolveSchemas(root, schemas, env),
      xmllint: probeXmllint(),
    },
  };
}

module.exports = { buildContext, ContextError };
