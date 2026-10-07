'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { summaryCases } = require('../lib/families/coherence');

const BIN = path.join(__dirname, '..', 'bin', 'validate-normative.js');
const FAKE = path.join(__dirname, 'fixtures', 'atlantis-fake');

function run(root, extra = []) {
  const r = spawnSync(process.execPath, [BIN, '--root', root, '--family', 'coherence', '--json', ...extra], { encoding: 'utf8' });
  assert.notEqual(r.status, 2, r.stderr);
  return JSON.parse(r.stdout);
}

const J = run(FAKE);
const pick = (check, status = 'finding', j = J) => j.results.filter((r) => r.check === check && r.status === status);

test('V-COH-001 reports unstarted formal apps as notes, ignoring scripts', () => {
  const notes = pick('V-COH-001');
  assert.deepEqual(notes.map((n) => n.artifact), ['ST3_F_3GHApp_902']);
  assert.equal(notes[0].severity, 'note');
  assert.match(notes[0].evidence, /ST3_F_TC_901_010/);
  assert.ok(!J.results.some((r) => r.artifact === 'ST3_F_3GHApp_902_SCRIPT'));
  assert.ok(pick('V-COH-001', 'pass').some((r) => r.artifact === 'ST3_F_3GHApp_901'));
});

test('V-COH-002 flags repository artifacts the catalogue does not know', () => {
  const ids = pick('V-COH-002').map((f) => f.artifact).sort();
  assert.deepEqual(ids, ['ST3_BALD_904', 'ST3_F_3GHApp_903', 'ST3_F_PCAP_903', 'ST3_F_PCAP_904']);
  assert.ok(!J.results.some((r) => r.check === 'V-COH-002' && /applications-staging/.test(r.path || '')), 'fillers out of scope');
});

test('V-COH-003 compares README group-document versions with catalogue sources', () => {
  const [f] = pick('V-COH-003');
  assert.match(f.message, /G901 group document v1\.0, catalogue sources have v1\.1/);
  assert.equal(f.severity, 'should-fix');
});

test('V-COH-004 requires open escalations in the README, not closed ones', () => {
  const msgs = pick('V-COH-004').map((f) => f.message);
  assert.equal(msgs.length, 1);
  assert.match(msgs[0], /open escalation E91 affects ST3_F_TC_901_001/);
});

test('V-COH-005 compares the evidence summary with the catalogue cases', () => {
  const msgs = pick('V-COH-005').map((f) => f.message).join('\n');
  assert.match(msgs, /does not cover ST3_F_TC_901_002/);
  assert.match(msgs, /does not attach to ST3_F_3GHApp_901: ST3_F_TC_901_099/);
  assert.deepEqual([...summaryCases('## Summary\n| ST3_F_TC_1_1 | Pass |\n## Next\n| ST3_F_TC_9_9 | x |')], ['ST3_F_TC_1_1']);
  assert.equal(summaryCases('# no summary'), null);
});

test('V-COH-006 finds retired identifiers in governed code but not in decision records', () => {
  const hits = pick('V-COH-006');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].path, 'applications/st3-f-3ghapp-901/js/app.js');
  assert.equal(hits[0].location, 'line 2');
  assert.equal(hits[0].severity, 'blocking');
});

test('README variants: plural group documents and no README', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-coh-'));
  fs.cpSync(FAKE, dir, { recursive: true });
  const readme = path.join(dir, 'applications/st3-f-3ghapp-901/README.md');
  fs.writeFileSync(readme, 'Cases follow the G901 and G902 group documents v1.1. Risk: E91.\n');
  let j = run(dir);
  assert.equal(pick('V-COH-003', 'finding', j).length, 0);
  assert.equal(pick('V-COH-004', 'finding', j).length, 0);
  fs.rmSync(readme);
  j = run(dir);
  assert.match(pick('V-COH-003', 'skipped', j)[0].reason, /no README\.md/);
});

test('ID target narrows to one artifact; no tooling → all skipped', () => {
  const j = run(FAKE, ['ST3_F_3GHApp_901']);
  const artifacts = new Set(j.results.filter((r) => r.status !== 'skipped' && r.check !== 'V-COH-006').map((r) => r.artifact));
  assert.deepEqual([...artifacts], ['ST3_F_3GHApp_901']);
  const k = run(fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-')));
  assert.equal(k.results.length, 6);
  assert.ok(k.results.every((r) => r.status === 'skipped' && /catalogue unavailable/.test(r.reason)));
});
