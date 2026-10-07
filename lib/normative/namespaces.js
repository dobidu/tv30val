'use strict';

// Expected root namespace and XSD file per XML signalling type. Namespaces
// and XSD names verified against the targetNamespace of the official XSDs in
// the NBR 25608:2025 complementary files (2026-10-07). Clause numbers taken
// from repository documentation keep their "(to confirm)" mark.

const SOURCE = 'ABNT NBR 25608:2025, 10.1 (to confirm); namespace from the official XSD';

module.exports = {
  BALD: { ns: 'tag:sbtvd.org.br,2025:XMLSchemas/TV30/AppSignaling/BALD/1.0/', xsd: 'BALD-1.0-202511.xsd', source: SOURCE },
  PRRD: { ns: 'tag:sbtvd.org.br,2025:XMLSchemas/TV30/AppSignaling/PRRD/1.0/', xsd: 'PRRD-1.0-202511.xsd', source: 'ABNT NBR 25608:2025, 8.8.2; namespace from the official XSD' },
  BAMT: { ns: 'tag:sbtvd.org.br,2025:XMLSchemas/TV30/Delivery/BAMT/1.0/', xsd: 'BAMT-1.0-202511.xsd', source: 'ABNT NBR 25608:2025, 8.4.4 (to confirm); namespace from the official XSD' },
  ESG: { ns: null, xsd: null, source: 'GT-ST Manual §6.4.2' },
  AEAT: { ns: null, xsd: null, source: SOURCE },
};
