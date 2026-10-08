'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { build } = require('../tools/build-api-index');

// Invented, standard-shaped text: no content from ABNT NBR 25608.
const index = build(fs.readFileSync(path.join(__dirname, 'fixtures', 'api-index', 'standard-like.txt'), 'utf8'));
const ws = (id) => index.tv3ws.find((a) => a.id === id);

test('Table C.2 rows survive page breaks, continuation captions and "0" clauses', () => {
  assert.deepEqual(index.tv3ws.map((a) => [a.id, a.clause, a.version]), [
    ['tv3ws-example-thing', 'C.6.1.1', '2.0'],
    ['tv3ws-example-gone', 'C.6.1.2', '2.0'],
    ['tv3ws-example-variants', 'C.6.1.3', '2.0'],
  ]);
  assert.equal(ws('tv3ws-example-gone').inferredClause, true);
  assert.ok(index.tv3ws.every((a) => a.headingFound), 'headings found in the body, not in the TOC or the table');
});

test('endpoints: split URLs, optional query, "Operation Type:" label, numbered variants', () => {
  assert.deepEqual(ws('tv3ws-example-thing').endpoints, [{ method: 'GET', path: '/tv3/example/<thing-id>', query: 'verbose=<bool>' }]);
  assert.deepEqual(ws('tv3ws-example-gone').endpoints, [{ method: 'DELETE', path: '/tv3/example/<thing-id>' }]);
  assert.deepEqual(ws('tv3ws-example-variants').endpoints.map((e) => e.path), ['/tv3/variant/a', '/tv3/variant/b']);
});

test('Table D.1 and Lua functions/event classes by clause, including subclauses only', () => {
  const thing = index.nclua.find((a) => a.id === 'nclua-thing');
  assert.equal(thing.clause, 'D.4');
  assert.deepEqual(thing.functions.map((f) => f.name), ['thing:draw', 'thing.new', 'thing:erase']);
  assert.deepEqual(thing.functions[0].params, ['mode', 'x', 'y']);
  assert.deepEqual(index.nclua.find((a) => a.id === 'nclua-event-thing').eventClasses, ['thing']);
  assert.equal(index.nclua.find((a) => a.id === 'lua-version').clause, null);
});

test('the index states its source and that it holds no normative text', () => {
  assert.match(index.source, /Annex C Table C\.2.*Annex D Table D\.1/);
  assert.match(index.note, /names, clause numbers and paths only/);
});
