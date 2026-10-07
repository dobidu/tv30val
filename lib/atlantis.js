'use strict';

const path = require('node:path');

// Adapter for the AtlantisPB tooling under --root. Identifiers and paths are
// always answered by the team's own modules (catalog.js, layout.js,
// lib/ids.js) — never re-implemented here.

const cache = new Map();

function loadAtlantis(root) {
  if (cache.has(root)) return cache.get(root);
  const base = path.join(root, 'tools', 'atlantis');
  let result;
  try {
    const ids = require(path.join(base, 'lib', 'ids.js'));
    const catalog = require(path.join(base, 'catalog.js'));
    const layout = require(path.join(base, 'layout.js'));
    // catalog.load() reads the consolidated JSON; fail here rather than mid-check.
    if (typeof catalog.load === 'function') catalog.load();
    result = { ok: true, ids, catalog, layout };
  } catch (err) {
    const msg = err.code === 'MODULE_NOT_FOUND' ? `AtlantisPB tooling not found under ${base}` : err.message;
    result = { ok: false, reason: `catalogue unavailable: ${msg.split('\n')[0]}` };
  }
  cache.set(root, result);
  return result;
}

module.exports = { loadAtlantis };
