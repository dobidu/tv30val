'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { parseHeader } = require('../lib/header');

const BIN = path.join(__dirname, '..', 'bin', 'validate-normative.js');
const FAKE = path.join(__dirname, 'fixtures', 'atlantis-fake');

function xmlRun() {
  const r = spawnSync(process.execPath, [BIN, '--root', FAKE, '--family', 'xml', '--json'], {
    encoding: 'utf8',
    env: { ...process.env, ATLANTIS_SCHEMAS: '', PATH: path.join(os.tmpdir(), 'tv30val-no-tools') },
  });
  assert.notEqual(r.status, 2, r.stderr);
  return JSON.parse(r.stdout);
}

const J = xmlRun();
const of = (check, file) => J.results.filter((r) => r.check === check && (r.path || r.reason || '').includes(file));
const findings = (check, file) => of(check, file).filter((r) => r.status === 'finding');

test('header parser reads labelled paragraphs, cases and a wrapped Assumptions label', () => {
  const h = parseHeader({
    line: 2,
    text: [
      '',
      '  ST3_BALD_901 (BALD) — synthetic v1.0 / group document ST3_F_G_901 v1.1',
      '  Used by:',
      '  901_001: ST3_F_PCAP_901 (ST3_BALD_901)',
      '  MHA_002: ST3_F_PCAP_901 (ST3_BALD_901)',
      '',
      '  Specification variant: none.',
      '',
      '  Validity windows: relative to execution.',
      '',
      '  Assumptions to confirm (an annex still being',
      '  drafted):',
      '    - URNs are placeholders.',
    ].join('\n'),
  });
  assert.equal(h.id, 'ST3_BALD_901');
  assert.equal(h.type, 'BALD');
  assert.deepEqual(h.versions, ['v1.0', 'v1.1']);
  assert.deepEqual(h.usedBy.map((u) => u.caseShort), ['901_001', 'MHA_002']);
  assert.equal(h.variant, 'none.');
  assert.match(h.validity, /relative/);
  assert.match(h.assumptions, /URNs are placeholders/);
  assert.equal(parseHeader(undefined), null);
});

test('the fully documented fixture passes every semantic check', () => {
  for (const c of ['V-XML-007', 'V-XML-008', 'V-XML-009', 'V-XML-010', 'V-XML-012']) {
    const r = of(c, 'st3-bald-901');
    assert.equal(r.length, 1, c);
    assert.equal(r[0].status, 'pass', `${c}: ${JSON.stringify(r[0])}`);
  }
});

test('V-XML-007 names each missing header field (should-fix, team convention)', () => {
  const msgs = findings('V-XML-007', 'st3-bald-906').map((f) => f.message);
  assert.deepEqual(msgs, ['header comment has no "Specification variant:"', 'header comment has no "Assumptions" section']);
  assert.ok(findings('V-XML-007', 'st3-bald-906').every((f) => f.severity === 'should-fix' && /not normative/.test(f.source)));
});

test('V-XML-008 reports cases in both directions', () => {
  const msgs = findings('V-XML-008', 'st3-bald-906').map((f) => f.message).join('\n');
  assert.match(msgs, /does not attach to ST3_BALD_906: ST3_F_TC_901_099/);
  assert.match(msgs, /omits catalogue cases: ST3_F_TC_901_007/);
  assert.match(of('V-XML-008', 'st3-prrd-901')[0].reason, /header lists no cases/);
});

test('V-XML-009 flags undeclared past windows and bad dates, accepts declared ones', () => {
  const [past] = findings('V-XML-009', 'st3-bald-907');
  assert.equal(past.severity, 'blocking');
  assert.match(past.message, /ended 2000-01-01/);
  const f908 = findings('V-XML-009', 'st3-bald-908');
  assert.equal(f908.length, 1, 'declared past window must not be flagged');
  assert.match(f908[0].message, /validFrom "soon"/);
  assert.equal(of('V-XML-009', 'st3-prrd-901').length, 0, 'not applicable to PRRD');
});

test('V-XML-010 resolves packages to applications and never passes silently', () => {
  assert.match(findings('V-XML-010', 'st3-bald-907')[0].message, /ST3_F_3GHApp_999, which is not in the v1.1 catalogue/);
  assert.match(findings('V-XML-010', 'st3-bald-908')[0].message, /entry point "missing.html" not found/);
  const [unresolved] = findings('V-XML-010', 'st3-bald-909');
  assert.equal(unresolved.severity, 'note');
  assert.match(unresolved.message, /could not resolve/);
});

test('V-XML-012 flags undeclared example domains and URNs', () => {
  assert.match(findings('V-XML-012', 'st3-bald-909')[0].message, /cdn\.example\.net/);
  assert.match(findings('V-XML-012', 'st3-bald-906')[0].message, /urn: identifiers/);
  assert.ok(findings('V-XML-012', 'st3-bald-906').every((f) => f.severity === 'note'));
});

test('no xml check is left unimplemented', () => {
  assert.ok(J.results.every((r) => !/not implemented/.test(r.reason || '')));
});
