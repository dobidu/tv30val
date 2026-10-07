'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { parse } = require('../lib/xml');
const { classifySchemaError } = require('../lib/families/xml');

const BIN = path.join(__dirname, '..', 'bin', 'validate-normative.js');
const FAKE = path.join(__dirname, 'fixtures', 'atlantis-fake');
const FAKE_BIN = path.join(__dirname, 'fixtures', 'bin-fake');
const NO_TOOLS = path.join(os.tmpdir(), 'tv30val-no-tools');

function cli(args, env = {}) {
  const r = spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ATLANTIS_SCHEMAS: '', PATH: NO_TOOLS, ...env },
  });
  assert.notEqual(r.status, 2, r.stderr);
  return { code: r.status, json: args.includes('--json') ? JSON.parse(r.stdout) : null, out: r.stdout };
}

const xmlRun = (extra = [], env) => cli(['--root', FAKE, '--family', 'xml', '--json', ...extra], env).json;
const of = (j, check, file) => j.results.filter((r) => r.check === check && (!file || (r.path || r.reason || '').includes(file)));

test('reader extracts root namespace and rejects malformed input with a line', () => {
  const ok = parse('<?xml version="1.0"?>\n<!-- ST3_BALD_901 -->\n<b:BALD xmlns:b="urn:x"><b:E/></b:BALD>');
  assert.equal(ok.ok, true);
  assert.equal(ok.root.local, 'BALD');
  assert.equal(ok.root.ns, 'urn:x');
  assert.equal(ok.comments[0].line, 2);
  for (const bad of ['<a><b></a>', '<a x="1" x="2"/>', '<a/><b/>', '', '<a>\n<b>', 'junk<a/>']) {
    const r = parse(bad);
    assert.equal(r.ok, false, bad);
    assert.ok(r.error.line >= 1);
  }
});

test('V-XML-001 without xmllint uses the built-in reader and says so', () => {
  const j = xmlRun();
  const [f] = of(j, 'V-XML-001', 'st3-bald-903');
  assert.equal(f.status, 'finding');
  assert.equal(f.severity, 'blocking');
  assert.match(f.evidence, /built-in reader \(partial\)/);
  assert.equal(of(j, 'V-XML-001', 'st3-bald-901')[0].status, 'pass');
});

test('a malformed file never reaches V-XML-002..006', () => {
  const j = xmlRun();
  for (const c of ['V-XML-002', 'V-XML-003', 'V-XML-004', 'V-XML-005', 'V-XML-006']) {
    const r = of(j, c, 'st3-bald-903');
    assert.equal(r.length, 1, c);
    assert.equal(r[0].status, 'skipped');
    assert.match(r[0].reason, /not well-formed/);
  }
});

test('schema checks skip with the specific missing piece', () => {
  let j = xmlRun();
  assert.match(of(j, 'V-XML-002', 'st3-bald-901')[0].reason, /no schema directory/);
  j = xmlRun(['--schemas', path.join(FAKE, 'schemas')]);
  assert.match(of(j, 'V-XML-002', 'st3-bald-901')[0].reason, /xmllint not on PATH/);
  j = xmlRun(['--schemas', path.join(FAKE, 'schemas')], { PATH: FAKE_BIN });
  assert.match(of(j, 'V-XML-002', 'st3-prrd-901')[0].reason, /XSD PRRD-1\.0-202511\.xsd not in/);
  assert.match(of(j, 'V-XML-004', 'st3-esg-service-901')[0].reason, /XSD file name for ESG not recorded/);
});

test('xmllint schema errors are classified into V-XML-002/004/005', { skip: process.platform === 'win32' }, () => {
  const j = xmlRun(['--schemas', path.join(FAKE, 'schemas')], { PATH: FAKE_BIN });
  assert.equal(j.sources.xmllint.available, true);
  const pick = (c) => of(j, c, 'st3-bald-901').filter((r) => r.status === 'finding');
  assert.match(pick('V-XML-004')[0].message, /not an element of the set/);
  assert.equal(pick('V-XML-004')[0].location, 'line 6');
  assert.match(pick('V-XML-005')[0].message, /not expected/);
  assert.match(pick('V-XML-002')[0].message, /No matching global declaration/);
  // Files that validate get a pass for all three.
  for (const c of ['V-XML-002', 'V-XML-004', 'V-XML-005']) assert.equal(of(j, c, 'st3-bald-902')[0].status, 'pass');
  // With xmllint present, well-formedness comes from xmllint.
  assert.equal(of(j, 'V-XML-001', 'st3-bald-903')[0].evidence, 'xmllint --noout');
  assert.equal(j.exitCode, 1);
});

test('classifier maps known xmllint messages', () => {
  assert.equal(classifySchemaError("[facet 'enumeration'] The value 'x' is not an element of the set"), 'V-XML-004');
  assert.equal(classifySchemaError("Element 'a': This element is not expected."), 'V-XML-005');
  assert.equal(classifySchemaError("Element 'a': Missing child element(s)."), 'V-XML-005');
  assert.equal(classifySchemaError('No matching global declaration available'), 'V-XML-002');
});

test('V-XML-003 flags a wrong namespace and skips types without a recorded one', () => {
  const j = xmlRun();
  const [f] = of(j, 'V-XML-003', 'st3-bald-902');
  assert.equal(f.status, 'finding');
  assert.match(f.evidence, /BALD\/1\.0\//);
  assert.equal(of(j, 'V-XML-003', 'st3-bald-901')[0].status, 'pass');
  assert.equal(of(j, 'V-XML-003', 'st3-prrd-901')[0].status, 'pass');
  assert.match(of(j, 'V-XML-003', 'st3-esg-service-901')[0].reason, /not recorded/);
});

test('V-XML-006 checks catalogue, header ID and layout path', () => {
  const j = xmlRun();
  assert.match(of(j, 'V-XML-006', 'st3-bald-904')[0].message, /not in the v1\.1 catalogue/);
  assert.match(of(j, 'V-XML-006', 'st3-bald-905')[0].message, /header declares ST3_BALD_999/);
  assert.equal(of(j, 'V-XML-006', 'st3-bald-901')[0].status, 'pass');
});

test('V-XML-006 skips when the AtlantisPB tooling is absent', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-'));
  fs.mkdirSync(path.join(root, 'xmls', 'bald'), { recursive: true });
  fs.copyFileSync(path.join(FAKE, 'xmls', 'bald', 'st3-bald-901.xml'), path.join(root, 'xmls', 'bald', 'st3-bald-901.xml'));
  const j = cli(['--root', root, '--family', 'xml', '--json']).json;
  assert.match(of(j, 'V-XML-006')[0].reason, /catalogue unavailable/);
  assert.equal(of(j, 'V-XML-001')[0].status, 'pass');
});

test('V-XML-011 reports an incomplete ESG triple', () => {
  const [f] = of(xmlRun(), 'V-XML-011');
  assert.equal(f.status, 'finding');
  assert.match(f.message, /ST3_ESG_SCHEDULE_901, ST3_ESG_CONTENT_901/);
});

test('targets narrow the files; no XML → all skipped', () => {
  let j = xmlRun(['ST3_BALD_901']);
  const paths = new Set(j.results.filter((r) => r.path && r.path.endsWith('.xml')).map((r) => r.path));
  assert.deepEqual([...paths], ['xmls/bald/st3-bald-901.xml']);
  assert.ok(j.results.every((r) => !/not implemented/.test(r.reason || '')));
  j = xmlRun(['xmls/prrd']);
  assert.ok(j.results.every((r) => !r.path || !r.path.includes('bald')));
  j = cli(['--root', fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-')), '--family', 'xml', '--json']).json;
  assert.equal(j.results.length, 12);
  assert.ok(j.results.every((r) => r.status === 'skipped' && /no XML files found/.test(r.reason)));
});

test('blocking findings set exit code 1', () => {
  assert.equal(cli(['--root', FAKE, '--family', 'xml']).code, 1);
});
