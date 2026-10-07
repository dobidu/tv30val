// Synthetic subset of AtlantisPB's lib/ids.js.
const PREFIX = 'ST3_';
const withPrefix = (id) => (String(id).trim().startsWith(PREFIX) ? String(id).trim() : PREFIX + String(id).trim());
const kebabId = (id) => withPrefix(id).toLowerCase().replace(/_/g, '-');
const fromFolderName = (name) =>
  /^st3-/i.test(name) ? name.toUpperCase().replace(/-/g, '_').replace(/(\dG[HN])APP/, '$1App') : withPrefix(name);
const normalizeCaseId = (id) => {
  const m = /^(\d{3}|MHA)_(\d{3})$/.exec(String(id).trim());
  return m ? `ST3_F_TC_${m[1]}_${m[2]}` : withPrefix(id);
};
module.exports = { withPrefix, kebabId, fromFolderName, normalizeCaseId };
