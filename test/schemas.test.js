'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { classifySchemaError } = require('../lib/families/xml');

const BIN = path.join(__dirname, '..', 'bin', 'validate-normative.js');
const FAKE = path.join(__dirname, 'fixtures', 'atlantis-fake');
const FAKE_PY = path.join(__dirname, 'fixtures', 'bin-fake-python');
const COMP = path.join(__dirname, 'fixtures', 'complementary-root', 'docs', 'specs', 'abnt-nbr-25608-2025-complementary-files');
const NO_TOOLS = path.join(os.tmpdir(), 'tv30val-no-tools');

function run(root, extra = [], env = {}) {
  const r = spawnSync(process.execPath, [BIN, '--root', root, '--family', 'xml', '--json', ...extra], {
    encoding: 'utf8',
    env: { ...process.env, ATLANTIS_SCHEMAS: '', PATH: NO_TOOLS, ATLANTIS_PYTHON: '', ...env },
  });
  assert.notEqual(r.status, 2, r.stderr);
  return JSON.parse(r.stdout);
}

test('the committed complementary-files folder is found and searched recursively', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-comp-'));
  fs.cpSync(FAKE, dir, { recursive: true });
  fs.rmSync(path.join(dir, 'schemas'), { recursive: true });
  fs.cpSync(path.join(__dirname, 'fixtures', 'complementary-root', 'docs'), path.join(dir, 'docs'), { recursive: true });
  const j = run(dir, [], { PATH: FAKE_PY });
  assert.equal(j.sources.schemas.via, 'complementary files');
  assert.equal(j.sources.validator.kind, 'xmlschema');
  const f = j.results.filter((r) => r.status === 'finding' && (r.path || '').endsWith('st3-bald-901.xml') && /^V-XML-00[245]$/.test(r.check));
  assert.deepEqual(f.map((x) => x.check).sort(), ['V-XML-004', 'V-XML-005']);
  assert.ok(f.every((x) => /^xmlschema against BALD-1\.0-202511\.xsd$/.test(x.evidence)));
  assert.equal(f.find((x) => x.check === 'V-XML-005').location, '/bald:BALD/bald:EntryPackage');
  const p002 = j.results.filter((r) => r.check === 'V-XML-002' && r.status === 'pass' && (r.path || '').endsWith('st3-bald-901.xml'));
  assert.equal(p002.length, 0, 'an invalid file must never pass V-XML-002');
  assert.equal(j.results.filter((r) => r.check === 'V-XML-002' && r.status === 'pass' && (r.path || '').endsWith('st3-bald-902.xml')).length, 1);
});

test('ATLANTIS_PYTHON selects the interpreter; no validator → specific skip', () => {
  const j = run(FAKE, ['--schemas', path.join(FAKE, 'schemas')], { ATLANTIS_PYTHON: path.join(FAKE_PY, 'python3') });
  assert.equal(j.sources.validator.kind, 'xmlschema');
  assert.equal(j.sources.validator.version, '9.9.9-fake');
  const k = run(FAKE, ['--schemas', path.join(FAKE, 'schemas')]);
  assert.equal(k.sources.validator.available, false);
  assert.match(k.results.find((r) => r.check === 'V-XML-002').reason, /no XSD validator/);
});

test('xmlschema messages are classified like xmllint ones', () => {
  assert.equal(classifySchemaError("The content of element 'x' is not complete. Tag 'y' expected.", 'XMLSchemaChildrenValidationError'), 'V-XML-005');
  assert.equal(classifySchemaError('Unexpected child with tag z at position 2', 'XMLSchemaChildrenValidationError'), 'V-XML-005');
  assert.equal(classifySchemaError("value doesn't match any pattern of ['\\\\d+']", 'XMLSchemaPatternValidationError'), 'V-XML-004');
  assert.equal(classifySchemaError('value must be one of [A, B]', 'XMLSchemaValidationError'), 'V-XML-004');
  assert.equal(classifySchemaError("missing required attribute 'a'", 'XMLSchemaValidationError'), 'V-XML-002');
});

test('BAMT namespace is recorded and taken from the official XSD', () => {
  const ns = require('../lib/normative/namespaces');
  assert.equal(ns.BAMT.ns, 'tag:sbtvd.org.br,2025:XMLSchemas/TV30/Delivery/BAMT/1.0/');
  for (const t of ['BALD', 'PRRD', 'BAMT']) assert.match(ns[t].source, /namespace from the official XSD/);
});
