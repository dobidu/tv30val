'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const BIN = path.join(__dirname, '..', 'bin', 'validate-normative.js');
const FAKE = path.join(__dirname, 'fixtures', 'atlantis-fake');

function run(root, extra = []) {
  const r = spawnSync(process.execPath, [BIN, '--root', root, '--family', 'module', '--json', ...extra], { encoding: 'utf8' });
  assert.notEqual(r.status, 2, r.stderr);
  return JSON.parse(r.stdout);
}

const J = run(FAKE);
const res = (check, artifact) => J.results.filter((r) => r.check === check && r.artifact === artifact);

test('V-MOD-001: Manual modules present pass; AudioVideoPlayer must not carry lua/', () => {
  for (const m of ['ButtonsBox', 'ResultsBox', 'TV30WebServices']) assert.equal(res('V-MOD-001', m)[0].status, 'pass', m);
  assert.match(res('V-MOD-001', 'AudioVideoPlayer')[0].message, /lua\/ folder.*Ginga-NCL/);
});

test('V-MOD-001: absent Manual modules need a recorded deviation', () => {
  const [ib] = res('V-MOD-001', 'InformationBox');
  assert.equal(ib.severity, 'note');
  assert.match(ib.message, /recorded deviation/);
  for (const m of ['GingaCCWebServices', 'NotificationBar']) {
    const [f] = res('V-MOD-001', m);
    assert.equal(f.severity, 'should-fix', m);
    assert.match(f.message, /no deviation is recorded/);
  }
});

test('V-MOD-001: team additions must be declared (paragraph-level match)', () => {
  assert.equal(res('V-MOD-001', 'TeamWidget')[0].status, 'pass');
  assert.match(res('V-MOD-001', 'extra-widget')[0].message, /not declared as a team addition/);
});

test('V-MOD-002: suite IDs and application paths in module code, not in README', () => {
  const msgs = res('V-MOD-002', 'ResultsBox').map((f) => `${f.location} ${f.message}`);
  assert.deepEqual(msgs, [
    'line 2 suite identifier ST3_F_TC_901_001 in module code ties ResultsBox to specific cases or applications',
    'line 3 ResultsBox refers to an application path',
  ]);
  assert.equal(res('V-MOD-002', 'ButtonsBox')[0].status, 'pass');
});

test('V-MOD-003 skipped until the API index exists; no modules → all skipped', () => {
  assert.match(J.results.find((r) => r.check === 'V-MOD-003').reason, /API index/);
  const e = run(fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-')));
  assert.equal(e.results.length, 3);
  assert.ok(e.results.every((r) => r.status === 'skipped' && /no common modules/.test(r.reason)));
});

test('no decisions record → additions and omissions are should-fix', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-mod-'));
  fs.cpSync(FAKE, dir, { recursive: true });
  fs.rmSync(path.join(dir, 'docs/project/decisions.md'));
  const j = run(dir);
  const f = j.results.find((r) => r.check === 'V-MOD-001' && r.artifact === 'TeamWidget');
  assert.equal(f.severity, 'should-fix');
  assert.match(f.evidence, /no docs\/project\/decisions\.md/);
});
