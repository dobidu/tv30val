'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validate, unsupportedKeywords } = require('../lib/jsonschema');

const kw = (schema, value) => validate(schema, value).map((e) => e.keyword);

test('type, enum, const', () => {
  assert.deepEqual(kw({ type: 'integer' }, 1), []);
  assert.deepEqual(kw({ type: 'integer' }, 1.5), ['type']);
  assert.deepEqual(kw({ type: 'number' }, 2), []);
  assert.deepEqual(kw({ type: ['string', 'null'] }, null), []);
  assert.deepEqual(kw({ enum: ['a', 'b'] }, 'c'), ['enum']);
  assert.deepEqual(kw({ const: { a: [1] } }, { a: [1] }), []);
  assert.deepEqual(kw({ const: 1 }, 2), ['const']);
});

test('string and number keywords', () => {
  assert.deepEqual(kw({ pattern: '^\\d+\\.\\d+$' }, '10.1'), []);
  assert.deepEqual(kw({ pattern: '^\\d+$' }, '1a'), ['pattern']);
  assert.deepEqual(kw({ minLength: 2 }, 'é'), ['minLength']);
  assert.deepEqual(kw({ minimum: 0 }, -1), ['minimum']);
});

test('arrays', () => {
  assert.deepEqual(kw({ minItems: 1 }, []), ['minItems']);
  assert.deepEqual(kw({ uniqueItems: true }, [{ a: 1 }, { a: 1 }]), ['uniqueItems']);
  const errs = validate({ items: { type: 'string' } }, ['a', 2]);
  assert.equal(errs[0].pointer, '/1');
});

test('objects', () => {
  const s = { type: 'object', required: ['id'], properties: { id: { type: 'string' } }, additionalProperties: false };
  assert.deepEqual(kw(s, { id: 'x' }), []);
  assert.deepEqual(kw(s, {}), ['required']);
  assert.deepEqual(kw(s, { id: 'x', extra: 1 }), ['additionalProperties']);
  assert.deepEqual(validate({ additionalProperties: { type: 'number' } }, { 'a/b': 'x' })[0].pointer, '/a~1b');
});

test('$ref, allOf, if/then', () => {
  const s = {
    $defs: { card: { type: 'string', pattern: '^[A-Z]\\d{2}$' } },
    type: 'object',
    properties: { card: { $ref: '#/$defs/card' }, state: { enum: ['built', 'proposed'] } },
    allOf: [{ if: { properties: { state: { const: 'built' } } }, then: { required: ['builtIn'] } }],
  };
  assert.deepEqual(kw(s, { card: 'A01', state: 'proposed' }), []);
  assert.deepEqual(kw(s, { card: 'A01', state: 'built' }), ['required']);
  // `if` passes vacuously when `state` is absent, so `then` applies (2020-12 semantics).
  assert.deepEqual(kw(s, { card: 'x' }), ['pattern', 'required']);
  assert.match(validate({ $ref: 'other.json#/x' }, 1)[0].message, /only local/);
  assert.match(validate({ $ref: '#/$defs/nope' }, 1)[0].message, /unresolvable/);
});

test('unsupported keywords are found anywhere in the schema, but not in data positions', () => {
  const s = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 't',
    $defs: { x: { oneOf: [{}] } },
    properties: { format: { type: 'string', format: 'uri' }, oneOf: { type: 'string' } },
    enum: [{ anyOf: 1 }],
  };
  assert.deepEqual(unsupportedKeywords(s), ['format', 'oneOf']);
  assert.deepEqual(unsupportedKeywords({ type: 'object', properties: { a: { const: { not: 1 } } } }), []);
});
