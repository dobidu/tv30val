'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const BIN = path.join(__dirname, '..', 'bin', 'validate-normative.js');
const FAKE = path.join(__dirname, 'fixtures', 'atlantis-fake');

function cli(args) {
  const r = spawnSync(process.execPath, [BIN, '--root', FAKE, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

test('without --gate any blocking finding fails the run (unchanged behaviour)', () => {
  const r = cli(['--json']);
  assert.equal(r.code, 1);
  const j = JSON.parse(r.out);
  assert.equal(j.gate, 'all');
  assert.equal(j.summary.gatingFindings, j.summary.findings.blocking);
});

test('--gate limits failing findings to the named families', () => {
  const j = JSON.parse(cli(['--gate', 'media', '--json']).out);
  const gating = j.results.filter((r) => r.gate);
  assert.ok(gating.length > 0);
  assert.ok(gating.every((r) => r.check.startsWith('V-MED-') && r.severity === 'blocking'));
  assert.equal(j.summary.gatingFindings, gating.length);
  assert.ok(j.summary.findings.blocking > gating.length, 'other blocking findings still reported');
  assert.equal(cli(['--gate', 'media']).code, 1);
});

test('--gate on a family without blocking findings passes; none is advisory', () => {
  assert.equal(cli(['--gate', 'pcap']).code, 0);
  const r = cli(['--gate', 'none']);
  assert.equal(r.code, 0);
  assert.match(r.out, /Gate: none \(advisory\)/);
});

test('--gate accepts comma lists and repetition; unknown family exits 2', () => {
  const j = JSON.parse(cli(['--gate', 'xml,media', '--gate', 'coherence', '--json']).out);
  assert.deepEqual(j.gate, ['xml', 'media', 'coherence']);
  assert.equal(cli(['--gate', 'bogus']).code, 2);
});

test('text report marks gating findings', () => {
  const out = cli(['--gate', 'media']).out;
  assert.match(out, /\[blocking, gate\] V-MED-/);
  assert.doesNotMatch(out, /\[blocking, gate\] V-XML-/);
});
