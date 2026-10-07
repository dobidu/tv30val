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
  const r = spawnSync(process.execPath, [BIN, '--root', root, '--family', 'manifest', '--json', ...extra], {
    encoding: 'utf8',
    env: { ...process.env, ATLANTIS_SCHEMAS: '' },
  });
  assert.notEqual(r.status, 2, r.stderr);
  return JSON.parse(r.stdout);
}

const J = run(FAKE);
const pick = (j, check, file, status = 'finding') =>
  j.results.filter((r) => r.check === check && r.status === status && (r.path || r.reason || '').includes(file));

function copyFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-man-'));
  fs.cpSync(FAKE, dir, { recursive: true });
  return dir;
}

test('V-MAN-001 validates manifests and cards.json against their schemas', () => {
  const [f] = pick(J, 'V-MAN-001', 'st3-f-pcap-902');
  assert.match(f.message, /unexpected property "typo"/);
  assert.equal(f.severity, 'blocking');
  assert.equal(pick(J, 'V-MAN-001', 'st3-f-pcap-901', 'pass').length, 1);
  assert.equal(pick(J, 'V-MAN-001', 'cards.json', 'pass').length, 1);
  assert.match(pick(J, 'V-MAN-001', 'st3-f-pcap-904')[0].message, /not valid JSON/);
  for (const c of ['V-MAN-002', 'V-MAN-003', 'V-MAN-005']) assert.equal(pick(J, c, 'st3-f-pcap-904', 'skipped').length, 1, c);
});

test('V-MAN-001 skips (never passes) when a schema uses an unsupported keyword', () => {
  const dir = copyFixture();
  const p = path.join(dir, 'docs/annex-b/manifest-schema/manifest.schema.json');
  const s = JSON.parse(fs.readFileSync(p, 'utf8'));
  s.properties.group = { oneOf: [{ type: 'string' }, { type: 'null' }] };
  fs.writeFileSync(p, JSON.stringify(s));
  const j = run(dir);
  const skips = pick(j, 'V-MAN-001', 'st3-f-pcap-90', 'skipped');
  assert.ok(skips.length >= 2);
  assert.ok(skips.every((x) => /does not support: oneOf/.test(x.reason)));
  assert.equal(pick(j, 'V-MAN-001', 'st3-f-pcap-901', 'pass').length, 0);
});

test('V-MAN-002 checks id, listed cases, and omissions scoped by group', () => {
  const msgs = pick(J, 'V-MAN-002', 'st3-f-pcap-902').map((f) => f.message).join('\n');
  assert.match(msgs, /ST3_F_TC_901_099 is not in the v1\.1 catalogue/);
  assert.match(msgs, /omits ST3_F_G_901 cases citing ST3_F_PCAP_902: ST3_F_TC_901_004/);
  assert.match(pick(J, 'V-MAN-002', 'st3-f-pcap-903')[0].message, /does not match the file name/);
  const [note] = pick(J, 'V-MAN-002', 'st3-f-pcap-901');
  assert.equal(note.severity, 'note');
  assert.match(note.message, /other groups.*ST3_F_TC_902_001/);
});

test('V-MAN-003 resolves card labels and filler ranges', () => {
  const msgs = pick(J, 'V-MAN-003', 'st3-f-pcap-902').map((f) => f.message);
  assert.deepEqual(msgs, ['card "Z99" not in cards.json', 'range "F01-F03": F03 not in cards.json']);
  assert.equal(pick(J, 'V-MAN-003', 'st3-f-pcap-901', 'pass').length, 1, 'F01-F02 range resolves');
});

test('V-MAN-004 cross-checks card state with staging folders', () => {
  const msgs = pick(J, 'V-MAN-004', 'cards.json').map((f) => f.message).join('\n');
  assert.match(msgs, /A02 is "proposed" but its folder .*g901-proposed exists/);
  assert.match(msgs, /A03 is built but .*g901-missing does not exist/);
  assert.match(msgs, /g901-orphan\/ has no card/);
  assert.doesNotMatch(msgs, /g901-built/);
});

test('V-MAN-005 finds out-of-order entries at any depth', () => {
  const [f] = pick(J, 'V-MAN-005', 'st3-f-pcap-902');
  assert.equal(f.location, '/combinations/0/expectedCatalog/entries/1');
  assert.equal(pick(J, 'V-MAN-005', 'st3-f-pcap-901', 'pass').length, 1);
});

test('V-MAN-006 flags duplicate virtual channels', () => {
  assert.match(pick(J, 'V-MAN-006', 'cards.json')[0].message, /10\.1 is used by A01, A03/);
});

test('targets narrow manifests; cards checks only without target or with a cards path', () => {
  const j = run(FAKE, ['ST3_F_PCAP_901']);
  const paths = new Set(j.results.map((r) => r.path).filter(Boolean));
  assert.deepEqual([...paths], ['docs/annex-b/manifests/g901/st3-f-pcap-901.json']);
  const k = run(FAKE, ['docs/annex-b/manifests/cards.json']);
  assert.ok(k.results.some((r) => r.check === 'V-MAN-006'));
  assert.ok(!k.results.some((r) => (r.path || '').includes('st3-f-pcap')));
});

test('no layout or no annex-b → all six skipped with reason', () => {
  const j = run(fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-')));
  assert.equal(j.results.length, 6);
  assert.ok(j.results.every((r) => r.status === 'skipped' && /layout\.json unavailable/.test(r.reason)));
});
