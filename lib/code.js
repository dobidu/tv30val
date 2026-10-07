'use strict';

// Splits source into lines with comments blanked out and string contents kept,
// for JS/CSS (// and /* */), Lua (-- and --[[ ]]) and HTML/NCL (<!-- -->).
// Good enough for line-oriented checks; not a parser.

function stripComments(text, ext) {
  const out = [];
  let i = 0;
  let mode = null; // null | 'block' | 'html' | 'luablock' | quote char
  const n = text.length;
  const js = ['.js', '.css'].includes(ext);
  const lua = ext === '.lua';
  const html = ['.html', '.htm', '.ncl', '.xml'].includes(ext);
  while (i < n) {
    const c = text[i];
    const two = text.slice(i, i + 2);
    if (mode === 'block') {
      if (two === '*/') { mode = null; i += 2; continue; }
      out.push(c === '\n' ? '\n' : ' '); i++; continue;
    }
    if (mode === 'html') {
      if (text.startsWith('-->', i)) { mode = null; i += 3; continue; }
      out.push(c === '\n' ? '\n' : ' '); i++; continue;
    }
    if (mode === 'luablock') {
      if (two === ']]') { mode = null; i += 2; continue; }
      out.push(c === '\n' ? '\n' : ' '); i++; continue;
    }
    if (mode) { // inside a string
      out.push(c);
      if (c === '\\') { out.push(text[i + 1] || ''); i += 2; continue; }
      if (c === mode || (c === '\n' && mode !== '`')) mode = null;
      i++; continue;
    }
    if (html && text.startsWith('<!--', i)) { mode = 'html'; i += 4; continue; }
    if (js && two === '/*') { mode = 'block'; i += 2; continue; }
    if (js && two === '//' && text[i - 1] !== ':') { while (i < n && text[i] !== '\n') i++; continue; }
    if (lua && text.startsWith('--[[', i)) { mode = 'luablock'; i += 4; continue; }
    if (lua && two === '--') { while (i < n && text[i] !== '\n') i++; continue; }
    if ((js || lua) && (c === '"' || c === "'" || (js && c === '`'))) { mode = c; out.push(c); i++; continue; }
    out.push(c); i++;
  }
  return out.join('').split('\n');
}

const STRING = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
const strings = (line) => [...line.matchAll(STRING)].map((m) => m[2]);
const htmlText = (line) => line.replace(/<[^>]*>/g, ' ');

module.exports = { stripComments, strings, htmlText };
