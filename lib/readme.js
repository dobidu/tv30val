'use strict';

// Reads the markdown pipe tables of an application README (GT-ST Manual
// §6.5.4) by section heading and column name. It does not judge the README's
// structure — that is tools/atlantis/readme.js's job.

const ID = /\bST3_[A-Za-z0-9_]+\b/g;

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

// { "<heading>": { header: [...], rows: [{ cells: {col: value}, line }] } }
function tables(md) {
  const out = {};
  const lines = md.split('\n');
  let heading = null;
  for (let i = 0; i < lines.length; i++) {
    const h = /^##\s+(.+?)\s*$/.exec(lines[i]);
    if (h) {
      heading = h[1];
      continue;
    }
    if (!heading || out[heading] || !lines[i].trim().startsWith('|')) continue;
    if (!lines[i + 1] || !/^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) continue;
    const header = splitRow(lines[i]);
    const rows = [];
    let j = i + 2;
    for (; j < lines.length && lines[j].trim().startsWith('|'); j++) {
      const cells = splitRow(lines[j]);
      rows.push({ cells: Object.fromEntries(header.map((name, k) => [name, cells[k] || ''])), line: j + 1 });
    }
    out[heading] = { header, rows, line: i + 1 };
    i = j - 1;
  }
  return out;
}

function findTable(all, headingPattern) {
  const key = Object.keys(all).find((k) => headingPattern.test(k));
  return key ? all[key] : null;
}

const ids = (cell) => (String(cell || '').match(ID) || []);

module.exports = { tables, findTable, ids };
