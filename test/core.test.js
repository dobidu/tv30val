'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { CHECKS, validateCatalogue } = require('../lib/catalogue');
const { PCAP_REASON } = require('../lib/families');

const BIN = path.join(__dirname, '..', 'bin', 'validate-normative.js');
const FIXTURE = path.join(__dirname, 'fixtures', 'repo-minimal');

function cli(args, env = {}) {
  const r = spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ATLANTIS_SCHEMAS: '', ...env },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function emptyDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-'));
}

test('catalogue validates and every check has a source', () => {
  assert.equal(validateCatalogue(), true);
  assert.equal(CHECKS.length, 43);
  for (const ch of CHECKS) assert.ok(ch.source && ch.source.trim(), `${ch.id} has no source`);
});

test('catalogue rejects an entry without a source', () => {
  assert.throws(() => validateCatalogue([{ id: 'X', family: 'xml', severity: 'note', title: 't', source: '' }]), /no source/);
});

test('--list-checks prints every check with its clause and exits 0', () => {
  const r = cli(['--list-checks']);
  assert.equal(r.code, 0);
  for (const ch of CHECKS) {
    const line = r.out.split('\n').find((l) => l.startsWith(`${ch.id} `));
    assert.ok(line, `${ch.id} missing from --list-checks`);
    assert.ok(line.includes(ch.source), `${ch.id} printed without its source`);
  }
  assert.match(r.out, /\(to confirm\)/);
  assert.match(r.out, /team convention, not normative/);
});

test('missing schema directory yields skipped and exit 0', () => {
  const root = emptyDir();
  const r = cli(['--root', root, '--family', 'xml', '--json']);
  assert.equal(r.code, 0);
  const j = JSON.parse(r.out);
  assert.equal(j.sources.schemas.available, false);
  assert.ok(j.sources.schemas.reason);
  assert.equal(j.results.length, 12);
  assert.ok(j.results.every((x) => x.status === 'skipped' && x.reason));
});

test('--json results always carry a source; skips carry a reason', () => {
  const r = cli(['--root', emptyDir(), '--json']);
  assert.equal(r.code, 0);
  const j = JSON.parse(r.out);
  for (const k of ['tool', 'version', 'root', 'sources', 'results', 'summary']) assert.ok(k in j, `missing ${k}`);
  assert.equal(j.results.length, 43);
  for (const x of j.results) {
    assert.ok(x.source, `${x.check} without source`);
    if (x.status === 'skipped') assert.ok(x.reason, `${x.check} skipped without reason`);
  }
  assert.equal(j.summary.allSkipped, true);
});

test('text output always shows skips and warns when everything skipped', () => {
  const r = cli(['--root', emptyDir(), '--severity', 'blocking']);
  assert.equal(r.code, 0);
  assert.match(r.out, /Skipped \(43\):/);
  assert.match(r.out, /WARNING: all checks skipped/);
});

test('pcap family reports the fixed deferral reason', () => {
  const j = JSON.parse(cli(['--root', emptyDir(), '--family', 'pcap', '--json']).out);
  assert.deepEqual(j.results.map((x) => [x.check, x.status, x.reason]), [['V-PCAP-000', 'skipped', PCAP_REASON]]);
  assert.equal(PCAP_REASON, 'no massa de teste exists in the repository; owner undefined (decisions.md)');
});

test('exit 2 when the tool cannot run', () => {
  assert.equal(cli(['--root', '/definitely/not/here']).code, 2);
  assert.equal(cli(['--family', 'bogus']).code, 2);
  assert.equal(cli(['--severity', 'fatal']).code, 2);
  assert.equal(cli(['--root', emptyDir(), 'not-a-target']).code, 2);
  assert.equal(cli(['--root', emptyDir(), '--schemas', '/definitely/not/here']).code, 2);
  assert.equal(cli(['--bogus-flag']).code, 2);
});

test('artifact ID targets are accepted', () => {
  assert.equal(cli(['--root', emptyDir(), 'ST3_BALD_032', '--family', 'xml']).code, 0);
});

test('schemas resolve from $ATLANTIS_SCHEMAS and reference/schemas', () => {
  const root = emptyDir();
  const env = emptyDir();
  let j = JSON.parse(cli(['--root', root, '--json', '--family', 'pcap'], { ATLANTIS_SCHEMAS: env }).out);
  assert.equal(j.sources.schemas.via, '$ATLANTIS_SCHEMAS');
  fs.mkdirSync(path.join(root, 'reference', 'schemas'), { recursive: true });
  j = JSON.parse(cli(['--root', root, '--json', '--family', 'pcap']).out);
  assert.equal(j.sources.schemas.via, 'reference/schemas');
});

test('layout.json is read from the root when present', () => {
  const j = JSON.parse(cli(['--root', FIXTURE, '--json', '--family', 'pcap']).out);
  assert.equal(j.sources.layout.available, true);
  const k = JSON.parse(cli(['--root', emptyDir(), '--json', '--family', 'pcap']).out);
  assert.equal(k.sources.layout.available, false);
  assert.ok(k.sources.layout.reason);
});
