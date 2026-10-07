'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const readme = require('../lib/readme');

const BIN = path.join(__dirname, '..', 'bin', 'validate-normative.js');
const FAKE = path.join(__dirname, 'fixtures', 'atlantis-fake');

function run(root, extra = []) {
  const r = spawnSync(process.execPath, [BIN, '--root', root, '--family', 'app', '--json', ...extra], { encoding: 'utf8' });
  assert.notEqual(r.status, 2, r.stderr);
  return JSON.parse(r.stdout);
}

const J = run(FAKE);
const res = (check, artifact, status = 'finding') => J.results.filter((r) => r.check === check && r.status === status && r.artifact === artifact);

test('README tables are read by heading and column name', () => {
  const t = readme.tables('# X\n\n## Input artifacts per test case\n\n| Test case ID | Execution form | PCAP/TS ID | XML IDs |\n| --- | --- | --- | --- |\n| ST3_F_TC_1 | Manual | ST3_F_PCAP_1 | ST3_BALD_1, ST3_PRRD_1 |\n');
  const tab = readme.findTable(t, /^Input artifacts/);
  assert.equal(tab.rows.length, 1);
  assert.deepEqual(readme.ids(tab.rows[0].cells['XML IDs']), ['ST3_BALD_1', 'ST3_PRRD_1']);
  assert.deepEqual(readme.ids('- ST3_A_1<br>- ST3_B_2'), ['ST3_A_1', 'ST3_B_2']);
});

test('V-APP-001: folder must be a catalogued app; fillers declare N/A', () => {
  assert.match(res('V-APP-001', 'ST3_F_3GHApp_903')[0].message, /not in the v1\.1 catalogue/);
  assert.match(res('V-APP-001', 'g901-built')[0].message, /fillers use "N\/A"/);
  assert.equal(res('V-APP-001', 'ST3_F_3GHApp_901', 'pass').length, 1, 'APPLICATION_ID matches');
});

test('V-APP-002: entry point per technology and per BALD announcement', () => {
  assert.match(res('V-APP-002', 'ST3_F_3GNApp_901')[0].message, /Ginga-NCL application has no main\.ncl/);
  const [bald] = res('V-APP-002', 'ST3_F_3GHApp_901');
  assert.match(bald.message, /BALD announces entry point "missing\.html"/);
  assert.match(bald.evidence, /st3-bald-908\.xml/);
});

test('V-APP-003: only loaded references count, not provenance comments', () => {
  const f = res('V-APP-003', 'ST3_F_3GHApp_901');
  assert.equal(f.length, 1);
  assert.match(f[0].message, /loads \.\.\/\.\.\/tools\/dev-helper\.js/);
  assert.equal(f[0].location, 'line 3');
});

test('V-APP-004: README cases exist and cite the app', () => {
  assert.deepEqual(res('V-APP-004', 'ST3_F_3GHApp_901').map((f) => f.message), ['ST3_F_TC_901_077 is not in the v1.1 catalogue']);
});

test('V-APP-005: README input artifacts match the catalogue both ways', () => {
  const msgs = res('V-APP-005', 'ST3_F_3GHApp_901').map((f) => f.message);
  assert.deepEqual(msgs, [
    'ST3_F_TC_901_001: catalogue input artifacts missing from the README: ST3_PRRD_901',
    'ST3_F_TC_901_002: catalogue input artifacts missing from the README: ST3_F_PCAP_901',
    'ST3_F_TC_901_002: README lists input artifacts the catalogue does not: ST3_F_PCAP_902',
  ]);
});

test('API checks wait for the index; 008..011 wait for plan 07-02', () => {
  const reason = (c) => J.results.find((r) => r.check === c).reason;
  assert.match(reason('V-APP-006'), /API index/);
  assert.match(reason('V-APP-007'), /API index/);
  for (const c of ['V-APP-008', 'V-APP-009', 'V-APP-010', 'V-APP-011']) assert.match(reason(c), /07-02/);
});

test('no application folders → all skipped', () => {
  const e = run(fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-')));
  assert.equal(e.results.length, 11);
  assert.ok(e.results.every((r) => r.status === 'skipped'));
});
