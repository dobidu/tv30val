'use strict';

// JSON Schema (draft 2020-12) — only the subset the BTDS Annex B schemas use.
// A schema with any other keyword is reported as unsupported and must not be
// validated: partial coverage would look like a pass.

const ANNOTATIONS = new Set(['$schema', '$id', '$comment', 'title', 'description', 'examples', 'default', 'deprecated', 'readOnly', 'writeOnly']);
const SUPPORTED = new Set([
  '$defs', '$ref', 'type', 'properties', 'required', 'additionalProperties', 'items', 'enum', 'const',
  'pattern', 'minLength', 'minItems', 'minimum', 'uniqueItems', 'allOf', 'if', 'then',
]);

// Keywords whose value is a map of name → subschema, or a list of subschemas.
const SCHEMA_MAPS = new Set(['$defs', 'properties']);
const SCHEMA_LISTS = new Set(['allOf']);
const SCHEMA_SINGLE = new Set(['additionalProperties', 'items', 'if', 'then']);

function unsupportedKeywords(schema) {
  const found = new Set();
  (function walk(s) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) return;
    for (const [k, v] of Object.entries(s)) {
      if (ANNOTATIONS.has(k)) continue;
      if (!SUPPORTED.has(k)) {
        found.add(k);
        continue;
      }
      if (SCHEMA_MAPS.has(k)) Object.values(v || {}).forEach(walk);
      else if (SCHEMA_LISTS.has(k)) (v || []).forEach(walk);
      else if (SCHEMA_SINGLE.has(k)) walk(v);
    }
  })(schema);
  return [...found].sort();
}

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v;
}

function typeMatches(v, t) {
  const actual = typeOf(v);
  return actual === t || (t === 'number' && actual === 'integer');
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeOf(a) !== typeOf(b) && !(typeof a === 'number' && typeof b === 'number')) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  if (a && typeof a === 'object') {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
  }
  return false;
}

const esc = (k) => String(k).replace(/~/g, '~0').replace(/\//g, '~1');

function resolveRef(root, ref) {
  if (!ref.startsWith('#')) throw new Error(`unsupported $ref "${ref}" (only local references)`);
  let node = root;
  for (const raw of ref.slice(1).split('/').filter(Boolean)) {
    const key = decodeURIComponent(raw).replace(/~1/g, '/').replace(/~0/g, '~');
    if (node === null || typeof node !== 'object' || !(key in node)) throw new Error(`unresolvable $ref "${ref}"`);
    node = node[key];
  }
  return node;
}

function validate(schema, instance) {
  const errors = [];
  const root = schema;

  function check(s, v, ptr, out) {
    if (s === true || s === undefined) return;
    if (s === false) {
      out.push({ pointer: ptr || '/', keyword: 'false', message: 'no value allowed here' });
      return;
    }
    const err = (keyword, message) => out.push({ pointer: ptr || '/', keyword, message });

    if (s.$ref) {
      let target;
      try {
        target = resolveRef(root, s.$ref);
      } catch (e) {
        err('$ref', e.message);
        return;
      }
      check(target, v, ptr, out);
    }
    if (s.type !== undefined) {
      const types = Array.isArray(s.type) ? s.type : [s.type];
      if (!types.some((t) => typeMatches(v, t))) {
        err('type', `expected ${types.join(' or ')}, got ${typeOf(v)}`);
        return;
      }
    }
    if (s.enum && !s.enum.some((e) => deepEqual(e, v))) err('enum', `${JSON.stringify(v)} is not one of ${JSON.stringify(s.enum)}`);
    if ('const' in s && !deepEqual(s.const, v)) err('const', `expected ${JSON.stringify(s.const)}, got ${JSON.stringify(v)}`);

    if (typeof v === 'string') {
      if (s.pattern !== undefined && !new RegExp(s.pattern, 'u').test(v)) err('pattern', `"${v}" does not match /${s.pattern}/`);
      if (s.minLength !== undefined && [...v].length < s.minLength) err('minLength', `shorter than ${s.minLength}`);
    }
    if (typeof v === 'number' && s.minimum !== undefined && v < s.minimum) err('minimum', `${v} is below ${s.minimum}`);

    if (Array.isArray(v)) {
      if (s.minItems !== undefined && v.length < s.minItems) err('minItems', `fewer than ${s.minItems} items`);
      if (s.uniqueItems) {
        for (let i = 0; i < v.length; i++) {
          for (let j = i + 1; j < v.length; j++) {
            if (deepEqual(v[i], v[j])) err('uniqueItems', `items ${i} and ${j} are equal`);
          }
        }
      }
      if (s.items !== undefined) v.forEach((x, i) => check(s.items, x, `${ptr}/${i}`, out));
    }

    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const r of s.required || []) {
        if (!Object.prototype.hasOwnProperty.call(v, r)) err('required', `missing property "${r}"`);
      }
      const props = s.properties || {};
      for (const [k, sub] of Object.entries(props)) {
        if (Object.prototype.hasOwnProperty.call(v, k)) check(sub, v[k], `${ptr}/${esc(k)}`, out);
      }
      if (s.additionalProperties !== undefined) {
        for (const k of Object.keys(v)) {
          if (Object.prototype.hasOwnProperty.call(props, k)) continue;
          if (s.additionalProperties === false) err('additionalProperties', `unexpected property "${k}"`);
          else check(s.additionalProperties, v[k], `${ptr}/${esc(k)}`, out);
        }
      }
    }

    for (const sub of s.allOf || []) check(sub, v, ptr, out);
    if (s.if !== undefined) {
      const probe = [];
      check(s.if, v, ptr, probe);
      if (!probe.length && s.then !== undefined) check(s.then, v, ptr, out);
    }
  }

  check(schema, instance, '', errors);
  return errors;
}

module.exports = { validate, unsupportedKeywords, SUPPORTED };
