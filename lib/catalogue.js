'use strict';

// Check catalogue, transcribed from the handoff (§6). Every entry must cite a
// source. "(to confirm)" marks clauses taken from repository documentation
// rather than read from the standard itself; clear the mark once verified.

const FAMILIES = ['xml', 'app', 'module', 'manifest', 'coherence', 'media', 'pcap'];

// Ascending order: index is used for --severity filtering.
const SEVERITIES = ['note', 'should-fix', 'blocking'];

const TBC = ' (to confirm)';
const CONVENTION = ' — team convention, not normative';

function c(id, family, severity, title, source, normative = true) {
  return { id, family, severity, title, source, normative };
}

const CHECKS = [
  // 6.1 XML signalling
  c('V-XML-001', 'xml', 'blocking', 'Well-formed XML', 'W3C XML 1.0 well-formedness (prerequisite)'),
  c('V-XML-002', 'xml', 'blocking', 'Validates against its XSD', 'ABNT NBR 25608:2025, 10.1 (BALD), 8.8.2 Table 8 (PRRD)' + TBC),
  c('V-XML-003', 'xml', 'blocking', 'Root namespace matches type and version', 'ABNT NBR 25608:2025, 10.1' + TBC),
  c('V-XML-004', 'xml', 'blocking', 'Values inside the enumerations the schema declares', 'XSD enumerations (normative schemas)'),
  c('V-XML-005', 'xml', 'blocking', "Element order follows the standard's table", 'ABNT NBR 25608:2025, 8.8.2 Table 8' + TBC),
  c('V-XML-006', 'xml', 'blocking', 'File name matches declared ID; ID exists in v1.1 catalogue', 'GT-ST Manual §6.5.7; catalog.js'),
  c('V-XML-007', 'xml', 'should-fix', 'Header comment present with ID, type, version, cases, variant, assumptions', '.claude/rules/xml-signaling.md' + CONVENTION, false),
  c('V-XML-008', 'xml', 'should-fix', 'Header cases match catalogue cases citing this artifact', 'catalog.js artifact <ID>'),
  c('V-XML-009', 'xml', 'blocking', 'BALD validity windows relative to execution or in the future', 'ABNT NBR 25608:2025, 10.1.3' + TBC + '; group documents v1.1'),
  c('V-XML-010', 'xml', 'blocking', 'Signalled URLs resolve inside applications/<kebabId>/', 'GT-ST Manual §6.5.7; case input artifacts'),
  c('V-XML-011', 'xml', 'blocking', 'ESG delivered as SERVICE / SCHEDULE / CONTENT, all present', 'GT-ST Manual §6.4.2'),
  c('V-XML-012', 'xml', 'note', 'Placeholder URNs and example domains declared as assumptions', 'project convention (E6 open)' + CONVENTION, false),

  // 6.2 Test applications
  c('V-APP-001', 'app', 'blocking', 'Folder name is a catalogue kebab ID; staging folders use APPLICATION_ID "N/A"', 'GT-ST Manual §6.5.7; decision of 2026-09-22'),
  c('V-APP-002', 'app', 'blocking', 'Entry point exists and matches the signalling', 'ABNT NBR 25608:2025, 10.1' + TBC),
  c('V-APP-003', 'app', 'should-fix', 'Package contains only what the application needs', 'GT-ST Manual §6.5.7, §6.5.10'),
  c('V-APP-004', 'app', 'blocking', 'README case table cases exist in catalogue and cite this application', 'GT-ST Manual §6.5.4; catalog.js'),
  c('V-APP-005', 'app', 'blocking', 'README input artifacts match catalogue, both directions', 'GT-ST Manual §6.5.4'),
  c('V-APP-006', 'app', 'blocking', 'Called APIs exist in the Annexes with documented name and arity', 'ABNT NBR 25608:2025, Annexes C and D'),
  c('V-APP-007', 'app', 'should-fix', 'API group matches the case', 'ABNT NBR 25608:2025, Annex C.6.11' + TBC + '; group documents v1.1'),
  c('V-APP-008', 'app', 'blocking', 'Receiver/environment-specific values live in configuration/, not inline', 'GT-ST Manual §6.5.6'),
  c('V-APP-009', 'app', 'should-fix', 'Uses common modules rather than reimplementing tester UI', 'GT-ST Manual §6.5.5'),
  c('V-APP-010', 'app', 'note', 'Result keys: GREEN = Pass, RED = Fail, YELLOW = Skip', 'F-ARQ proposal, pending the Doctor' + CONVENTION, false),
  c('V-APP-011', 'app', 'note', 'No placeholder text in tester-facing text', 'placeholder text; Manual v1.0 sets no language for tester-facing text' + CONVENTION, false),

  // 6.3 Common modules
  c('V-MOD-001', 'module', 'should-fix', "Module folders match the Manual's list; additions declared", 'GT-ST Manual §6.5.5; decisions.md 2026-09-29'),
  c('V-MOD-002', 'module', 'should-fix', 'No application-specific logic or hard-coded case data', 'GT-ST Manual §6.5.5'),
  c('V-MOD-003', 'module', 'blocking', 'tv30-webservices exposes only APIs present in the Annexes', 'ABNT NBR 25608:2025, Annexes C and D'),

  // 6.4 BTDS Annex B manifests
  c('V-MAN-001', 'manifest', 'blocking', 'Manifests and cards.json validate against their JSON Schemas', 'Annex B draft; decision of 2026-09-30'),
  c('V-MAN-002', 'manifest', 'blocking', 'Every manifest case exists in catalogue and cites that PCAP', 'catalog.js'),
  c('V-MAN-003', 'manifest', 'blocking', 'Every referenced card exists in cards.json', 'Annex B draft'),
  c('V-MAN-004', 'manifest', 'should-fix', 'Built cards point to existing folders; every staging folder has a card', 'repository state (decision of 2026-10-02)'),
  c('V-MAN-005', 'manifest', 'should-fix', 'Expected-catalogue ordering follows ascending virtual channel', 'ABNT NBR 25608:2025, ACFR-06' + TBC),
  c('V-MAN-006', 'manifest', 'blocking', 'Virtual channels unique across cards.json', 'Annex B draft'),

  // 6.5 Cross-artifact coherence
  c('V-COH-001', 'coherence', 'note', 'Every case citing a formal application has a folder or is reported not started', 'v1.1 catalogue'),
  c('V-COH-002', 'coherence', 'should-fix', 'Every artifact is cited by at least one case', 'v1.1 catalogue'),
  c('V-COH-003', 'coherence', 'should-fix', 'README group document version matches catalog.js sources', 'decision of 2026-09-30'),
  c('V-COH-004', 'coherence', 'should-fix', 'Open escalations affecting an artifact recorded as risk in its README', 'decision of 2026-09-14'),
  c('V-COH-005', 'coherence', 'should-fix', 'Layer-1 evidence exists for every built artifact and covers its case list', 'GT-ST Manual §6.5.9'),
  c('V-COH-006', 'coherence', 'blocking', 'Retired identifiers are not reused', 'project principle'),

  // Media assets (v0.2; not in the handoff)
  c('V-MED-001', 'media', 'blocking', 'Media file is a catalogued media ID used by the application', 'GT-ST Manual §6.5.7; catalog.js'),
  c('V-MED-002', 'media', 'blocking', 'File content matches its extension', "GT-ST Manual §6.5.7 — file named after its media ID with its format's extension" + TBC),
  c('V-MED-003', 'media', 'should-fix', 'Media kind matches its assets folder', 'GT-ST Manual §6.5.7 asset folders' + TBC),
  c('V-MED-004', 'media', 'blocking', 'Stream content meets the catalogue description', 'v1.1 catalogue (HSTREAM descriptions); ABNT NBR 25608:2025, Annex B.4.3' + TBC),

  // 6.6 Deferred
  c('V-PCAP-000', 'pcap', 'note', 'PCAP/TS stream validation (deferred)', 'docs/project/decisions.md (owner undefined)'),
];

const BY_ID = new Map(CHECKS.map((ch) => [ch.id, ch]));

function validateCatalogue(checks = CHECKS) {
  const seen = new Set();
  for (const ch of checks) {
    const where = ch && ch.id ? ch.id : JSON.stringify(ch);
    for (const field of ['id', 'family', 'severity', 'title', 'source']) {
      if (typeof ch[field] !== 'string' || ch[field].trim() === '') {
        throw new Error(`catalogue: ${where} has no ${field}`);
      }
    }
    if (!FAMILIES.includes(ch.family)) throw new Error(`catalogue: ${where} has unknown family "${ch.family}"`);
    if (!SEVERITIES.includes(ch.severity)) throw new Error(`catalogue: ${where} has unknown severity "${ch.severity}"`);
    if (seen.has(ch.id)) throw new Error(`catalogue: duplicate id ${ch.id}`);
    seen.add(ch.id);
  }
  return true;
}

function getCheck(id) {
  return BY_ID.get(id);
}

function checksForFamily(family) {
  return CHECKS.filter((ch) => ch.family === family);
}

module.exports = { CHECKS, FAMILIES, SEVERITIES, validateCatalogue, getCheck, checksForFamily };
