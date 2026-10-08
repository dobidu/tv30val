'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const BIN = path.join(__dirname, '..', 'bin', 'validate-normative.js');
const FAKE = path.join(__dirname, 'fixtures', 'atlantis-fake');
const FAKE_PY = path.join(__dirname, 'fixtures', 'bin-fake-python');
const COMP_DOCS = path.join(__dirname, 'fixtures', 'complementary-root', 'docs');
const NO_TOOLS = path.join(os.tmpdir(), 'tv30val-no-tools');

function run(root, env = {}) {
  const r = spawnSync(process.execPath, [BIN, '--root', root, '--family', 'app', '--json'], {
    encoding: 'utf8',
    env: { ...process.env, ATLANTIS_SCHEMAS: '', PATH: NO_TOOLS, ATLANTIS_PYTHON: '', ...env },
  });
  assert.notEqual(r.status, 2, r.stderr);
  return JSON.parse(r.stdout);
}

function rootWithSchemas() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-ncl-'));
  fs.cpSync(FAKE, dir, { recursive: true });
  fs.rmSync(path.join(dir, 'schemas'), { recursive: true });
  fs.cpSync(COMP_DOCS, path.join(dir, 'docs'), { recursive: true });
  return dir;
}

const ncl = (j, id) => j.results.filter((r) => r.check === 'V-APP-012' && (r.artifact === id || (r.reason || '').includes(id.toLowerCase().replace(/_/g, '-'))));

test('V-APP-012: NCL 3.0 placeholder namespace is reported, not schema-validated', () => {
  const [f] = ncl(run(FAKE), 'ST3_F_3GNApp_902');
  assert.equal(f.severity, 'blocking');
  assert.match(f.message, /NCL3\.0\/EDTVProfile.*expected the NCL 4\.0 profile/);
  assert.match(f.evidence, /scaffold writes the NCL 3\.0 EDTV profile/);
});

test('V-APP-012: NCL 4.0 documents are validated with the remote imports mapped locally', () => {
  const dir = rootWithSchemas();
  const [f] = ncl(run(dir, { PATH: FAKE_PY }), 'ST3_F_3GNApp_903');
  assert.equal(f.status, 'finding');
  assert.equal(f.location, '/ncl/body');
  const local = path.join(dir, 'docs/specs/abnt-nbr-25608-2025-complementary-files', 'NCL4.0');
  assert.equal(f.message, `mapped http://www.ncl.org.br/NCL4.0/ -> ${local}`);
  assert.match(f.evidence, /xmlschema against NCL4\.0\/profiles\/NCL40\.xsd/);
});

test('V-APP-012: skips with the missing piece; HTML5 apps get no result; no main.ncl → skipped', () => {
  const j = run(FAKE);
  assert.match(ncl(j, 'ST3_F_3GNApp_903')[0].reason, /no schema directory/);
  assert.match(ncl(j, 'ST3_F_3GNApp_901')[0].reason, /no main\.ncl/);
  assert.ok(!j.results.some((r) => r.check === 'V-APP-012' && r.artifact === 'ST3_F_3GHApp_901'));
});

test('no Ginga-NCL applications → one skipped result', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-'));
  fs.cpSync(FAKE, dir, { recursive: true });
  for (const n of ['st3-f-3gnapp-901', 'st3-f-3gnapp-902', 'st3-f-3gnapp-903']) fs.rmSync(path.join(dir, 'applications', n), { recursive: true });
  const r = run(dir).results.filter((x) => x.check === 'V-APP-012');
  assert.deepEqual(r.map((x) => [x.status, x.reason]), [['skipped', 'no Ginga-NCL applications']]);
});
