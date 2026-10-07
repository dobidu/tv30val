'use strict';

const { FAMILIES, checksForFamily } = require('../catalogue');
const { skipped } = require('../finding');

const PHASE = { xml: 'v0.1 phase 2', manifest: 'v0.1 phase 3', coherence: 'v0.1 phase 4', app: 'v0.2', module: 'v0.2' };

const PCAP_REASON = 'no massa de teste exists in the repository; owner undefined (decisions.md)';

function stub(family) {
  return {
    run() {
      return checksForFamily(family).map((ch) => skipped(ch.id, `not implemented yet (${PHASE[family]})`));
    },
  };
}

const pcap = {
  run() {
    return checksForFamily('pcap').map((ch) => skipped(ch.id, PCAP_REASON));
  },
};

// A family module exports { run(ctx, targets) → results[] }. Families are
// replaced one at a time as they are implemented; until then they skip.
function load(family) {
  if (family === 'pcap') return pcap;
  try {
    return require(`./${family}`);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && err.message.includes(`./${family}`)) return stub(family);
    throw err;
  }
}

const REGISTRY = Object.fromEntries(FAMILIES.map((f) => [f, load(f)]));

module.exports = { REGISTRY, PCAP_REASON };
