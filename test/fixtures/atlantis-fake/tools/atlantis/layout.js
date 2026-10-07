// Synthetic subset of AtlantisPB's layout.js.
const catalog = require('./catalog');
const ids = require('./lib/ids');
const xmlPath = (id) => {
  const a = catalog.requireArtifact(id);
  return `xmls/${a.type.toLowerCase()}/${ids.kebabId(a.id)}.xml`;
};
const appDir = (id) => `applications/${ids.kebabId(catalog.requireArtifact(id).id)}`;
module.exports = { xmlPath, appDir };
