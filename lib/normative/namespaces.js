'use strict';

// Expected root namespace and XSD file per XML signalling type.
// Values were taken from the header comments of the AtlantisPB signalling
// files (which record them as written-against, never validated-against) and
// from the handoff. Confirm every entry against ABNT NBR 25608:2025 before
// clearing the "(to confirm)" marks.

const SOURCE = 'ABNT NBR 25608:2025, 10.1 (to confirm)';

module.exports = {
  BALD: { ns: 'tag:sbtvd.org.br,2025:XMLSchemas/TV30/AppSignaling/BALD/1.0/', xsd: 'BALD-1.0-202511.xsd', source: SOURCE },
  PRRD: { ns: 'tag:sbtvd.org.br,2025:XMLSchemas/TV30/AppSignaling/PRRD/1.0/', xsd: 'PRRD-1.0-202511.xsd', source: 'ABNT NBR 25608:2025, 8.8.2 (to confirm)' },
  BAMT: { ns: null, xsd: 'BAMT-1.0-202511.xsd', source: SOURCE },
  ESG: { ns: null, xsd: null, source: 'GT-ST Manual §6.4.2' },
  AEAT: { ns: null, xsd: null, source: SOURCE },
};
