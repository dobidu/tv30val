'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Minimal XML reader. It is NOT a validator: it finds structural errors
// (unbalanced tags, duplicate attributes, junk after the root) and extracts the
// root element, its namespace and the comments. Schema validation is xmllint's
// job (V-XML-002).

const NAME = /[A-Za-z_:][-A-Za-z0-9_.:]*/y;

function lineAt(text, idx) {
  let n = 1;
  for (let i = 0; i < idx; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

function parse(text) {
  const comments = [];
  const elements = [];
  const texts = [];
  const stack = [];
  let root = null;
  let rootClosed = false;
  let i = 0;
  const fail = (message, at = i) => ({ ok: false, error: { message, line: lineAt(text, at) }, root, comments, elements, texts });

  if (text.charCodeAt(0) === 0xfeff) i = 1;

  while (i < text.length) {
    const lt = text.indexOf('<', i);
    const chunk = text.slice(i, lt === -1 ? text.length : lt);
    if (chunk.trim()) {
      if (stack.length === 0) return fail('text outside the root element', i);
      texts.push({ text: chunk.trim(), line: lineAt(text, i + chunk.search(/\S/)) });
    }
    if (lt === -1) break;
    i = lt;

    if (text.startsWith('<!--', i)) {
      const end = text.indexOf('-->', i + 4);
      if (end === -1) return fail('unterminated comment');
      comments.push({ text: text.slice(i + 4, end), line: lineAt(text, i) });
      i = end + 3;
    } else if (text.startsWith('<![CDATA[', i)) {
      if (!stack.length) return fail('CDATA outside the root element');
      const end = text.indexOf(']]>', i);
      if (end === -1) return fail('unterminated CDATA section');
      const cdata = text.slice(i + 9, end);
      if (cdata.trim()) texts.push({ text: cdata.trim(), line: lineAt(text, i) });
      i = end + 3;
    } else if (text.startsWith('<?', i)) {
      const end = text.indexOf('?>', i);
      if (end === -1) return fail('unterminated processing instruction');
      i = end + 2;
    } else if (text.startsWith('<!', i)) {
      const end = text.indexOf('>', i);
      if (end === -1) return fail('unterminated declaration');
      i = end + 1;
    } else if (text.startsWith('</', i)) {
      NAME.lastIndex = i + 2;
      const m = NAME.exec(text);
      if (!m) return fail('malformed end tag');
      const open = stack.pop();
      if (!open) return fail(`unexpected end tag </${m[0]}>`);
      if (open.name !== m[0]) return fail(`end tag </${m[0]}> does not match <${open.name}> opened on line ${open.line}`);
      const close = text.indexOf('>', NAME.lastIndex);
      if (close === -1 || text.slice(NAME.lastIndex, close).trim()) return fail('malformed end tag');
      i = close + 1;
      if (!stack.length) rootClosed = true;
    } else {
      const start = i;
      NAME.lastIndex = i + 1;
      const m = NAME.exec(text);
      if (!m) return fail('malformed start tag');
      if (rootClosed || (root && !stack.length)) return fail(`second root element <${m[0]}>`);
      i = NAME.lastIndex;
      const attrs = {};
      let selfClosing = false;
      for (;;) {
        while (/\s/.test(text[i] || '')) i++;
        if (i >= text.length) return fail(`unterminated start tag <${m[0]}>`, start);
        if (text.startsWith('/>', i)) { selfClosing = true; i += 2; break; }
        if (text[i] === '>') { i++; break; }
        NAME.lastIndex = i;
        const a = NAME.exec(text);
        if (!a) return fail(`malformed attribute in <${m[0]}>`);
        i = NAME.lastIndex;
        while (/\s/.test(text[i] || '')) i++;
        if (text[i] !== '=') return fail(`attribute ${a[0]} has no value`);
        i++;
        while (/\s/.test(text[i] || '')) i++;
        const q = text[i];
        if (q !== '"' && q !== "'") return fail(`attribute ${a[0]} value not quoted`);
        const end = text.indexOf(q, i + 1);
        if (end === -1) return fail(`unterminated value for attribute ${a[0]}`);
        if (Object.prototype.hasOwnProperty.call(attrs, a[0])) return fail(`duplicate attribute ${a[0]}`);
        attrs[a[0]] = { value: text.slice(i + 1, end), line: lineAt(text, i) };
        i = end + 1;
      }
      const parent = stack.length ? stack[stack.length - 1] : null;
      const el = {
        name: m[0],
        local: m[0].includes(':') ? m[0].split(':')[1] : m[0],
        line: lineAt(text, start),
        attrs,
        depth: stack.length,
        parent: parent ? parent.index : -1,
        index: elements.length,
      };
      elements.push(el);
      if (!root) root = el;
      if (!selfClosing) stack.push(el);
      else if (!stack.length) rootClosed = true;
    }
  }
  if (stack.length) return fail(`element <${stack[stack.length - 1].name}> opened on line ${stack[stack.length - 1].line} is never closed`, text.length);
  if (!root) return fail('no root element', 0);

  const [prefix, local] = root.name.includes(':') ? root.name.split(':', 2) : [null, root.name];
  const nsAttr = prefix ? `xmlns:${prefix}` : 'xmlns';
  return {
    ok: true,
    root: { ...root, prefix, local, ns: root.attrs[nsAttr] ? root.attrs[nsAttr].value : null },
    comments,
    elements,
    texts,
  };
}

// Runs xmllint and returns its error lines as { line, message }.
function xmllint(args, env) {
  const r = spawnSync('xmllint', args, { encoding: 'utf8', env: env ? { ...process.env, ...env } : process.env });
  if (r.error) return { code: null, errors: [{ line: null, message: r.error.message }] };
  const errors = [];
  for (const raw of (r.stderr || '').split('\n')) {
    const m = /^.*?:(\d+):\s*(?:element [^:]+:\s*)?(?:[\w ]+ )?error\s*:\s*(.*)$/.exec(raw);
    if (m) errors.push({ line: Number(m[1]), message: m[2].trim() });
  }
  if (r.status !== 0 && !errors.length) {
    const msg = (r.stderr || '').split('\n').find((l) => l.trim() && !/ validates$| fails to validate$/.test(l));
    if (msg) errors.push({ line: null, message: msg.trim() });
  }
  return { code: r.status, errors };
}

// xmlschema backend: prints one tab-separated line per error.
const XMLSCHEMA_SCRIPT = [
  'import sys, pathlib, xmlschema',
  'kw = {}',
  'if len(sys.argv) > 4:',
  '    remote, local = sys.argv[3], pathlib.Path(sys.argv[4])',
  '    kw["uri_mapper"] = lambda uri: (local / uri[len(remote):]).as_uri() if uri.startswith(remote) else uri',
  'try:',
  '    s = xmlschema.XMLSchema(sys.argv[1], **kw)',
  'except Exception as e:',
  '    print("SCHEMA\\t" + str(e).splitlines()[0]); sys.exit(5)',
  'n = 0',
  'for e in s.iter_errors(sys.argv[2]):',
  '    n += 1',
  '    line = getattr(e, "sourceline", None) or ""',
  '    print("%s\\t%s\\t%s\\t%s" % (line, e.path or "", type(e).__name__, (e.reason or str(e)).replace("\\n", " ")))',
  'sys.exit(3 if n else 0)',
].join('\n');

function xmlschemaValidate(python, xsd, file, uriMap) {
  const args = ['-I', '-c', XMLSCHEMA_SCRIPT, xsd, file];
  if (uriMap) args.push(uriMap.from, uriMap.to);
  const r = spawnSync(python, args, { encoding: 'utf8' });
  if (r.error) return { code: null, errors: [{ line: null, message: r.error.message }] };
  const errors = [];
  for (const raw of (r.stdout || '').split('\n').filter(Boolean)) {
    const [line, xpath, type, message] = raw.split('\t');
    if (line === 'SCHEMA') return { code: 5, errors: [{ line: null, message: xpath }] };
    errors.push({ line: line ? Number(line) : null, path: xpath || null, type, message: message || '' });
  }
  return { code: r.status, errors };
}

// xmllint resolves remote schema imports through an XML catalog; this one
// rewrites uriMap.from to the local folder so validation never goes online.
function catalogFor(uriMap) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-catalog-'));
  const target = `${pathToFileURL(uriMap.to).href.replace(/\/?$/, '/')}`;
  const file = path.join(dir, 'catalog.xml');
  fs.writeFileSync(file, `<?xml version="1.0"?>
<catalog xmlns="urn:oasis:names:tc:entity:xmlns:xml:catalog">
  <rewriteURI uriStartString="${uriMap.from}" rewritePrefix="${target}"/>
  <rewriteSystem systemIdStartString="${uriMap.from}" rewritePrefix="${target}"/>
</catalog>
`);
  return file;
}

// Validates file against xsd with the available backend. uriMap = { from, to }
// maps remote schema imports (e.g. the NCL 4.0 modules) to a local folder.
function validateXsd(validator, xsd, file, uriMap) {
  if (validator.kind === 'xmlschema') return xmlschemaValidate(validator.python, xsd, file, uriMap);
  if (!uriMap) return xmllint(['--noout', '--schema', xsd, file]);
  return xmllint(['--noout', '--nonet', '--schema', xsd, file], { XML_CATALOG_FILES: catalogFor(uriMap) });
}

module.exports = { parse, xmllint, validateXsd };
