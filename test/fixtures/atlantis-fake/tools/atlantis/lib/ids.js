// Synthetic subset of AtlantisPB's lib/ids.js.
const PREFIX = 'ST3_';
const withPrefix = (id) => (String(id).trim().startsWith(PREFIX) ? String(id).trim() : PREFIX + String(id).trim());
const kebabId = (id) => withPrefix(id).toLowerCase().replace(/_/g, '-');
const fromFolderName = (name) => (/^st3-/i.test(name) ? name.toUpperCase().replace(/-/g, '_') : withPrefix(name));
module.exports = { withPrefix, kebabId, fromFolderName };
