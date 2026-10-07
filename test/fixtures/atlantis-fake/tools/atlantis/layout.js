// Synthetic subset of AtlantisPB's layout.js.
const catalog = require('./catalog');
const ids = require('./lib/ids');
const xmlPath = (id) => {
  const a = catalog.requireArtifact(id);
  return `xmls/${a.type.toLowerCase()}/${ids.kebabId(a.id)}.xml`;
};
const appDir = (id) => {
  const a = catalog.requireArtifact(id);
  if (/_SCRIPT$/.test(a.id)) throw new Error(`${a.id} is not a test application`);
  return `applications/${ids.kebabId(a.id)}`;
};
const evidenceDir = (id) => `docs/evidence/${ids.kebabId(catalog.requireArtifact(id).id)}`;
module.exports = { xmlPath, appDir, evidenceDir };
