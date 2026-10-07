'use strict';

// Parser for the header comment that the AtlantisPB XML convention puts at
// the top of every signalling document (.claude/rules/xml-signaling.md):
//
//   <ID> (<TYPE>) — Consolidation vX / group document <GROUP> vY
//   Used by:
//   NNN_NNN: <PCAP> (<artifacts>)
//   Purpose: …
//   Specification variant: …
//   Validity windows: …            (BALD)
//   Assumptions to confirm …:
//     - …

const LABELS = [
  ['usedBy', /^used by\s*:/i],
  ['purpose', /^purpose\s*:/i],
  ['variant', /^specification variant\s*:/i],
  ['validity', /^validity windows?\s*:/i],
  ['syntax', /^syntax and semantics\s*:/i],
  ['assumptions', /^assumptions\b.*?(:|$)/i],
];

const USED_BY = /^\s*((?:\d{3}|MHA)_\d{3})\s*:/;

function parseHeader(comment) {
  if (!comment) return null;
  const lines = comment.text.split('\n');
  const firstIdx = lines.findIndex((l) => l.trim());
  const first = firstIdx === -1 ? '' : lines[firstIdx].trim();
  const head = /^(ST3_[A-Za-z0-9_]+)\s*\((\w+)\)/.exec(first);
  const header = {
    line: comment.line,
    id: head ? head[1] : null,
    type: head ? head[2] : null,
    versions: first.match(/\bv\d+(?:\.\d+)?\b/g) || [],
    usedBy: null,
    purpose: null,
    variant: null,
    validity: null,
    syntax: null,
    assumptions: null,
  };

  let current = null;
  let buf = [];
  const flush = () => {
    if (current && current !== 'usedBy') header[current] = buf.join('\n').trim();
  };
  for (let n = firstIdx + 1; n < lines.length && firstIdx !== -1; n++) {
    const raw = lines[n];
    const t = raw.trim();
    const label = LABELS.find(([, re]) => re.test(t));
    if (label) {
      flush();
      current = label[0];
      buf = [t.replace(label[1], '').trim()];
      if (current === 'usedBy') header.usedBy = [];
      continue;
    }
    if (current === 'usedBy') {
      const m = USED_BY.exec(raw);
      if (m) {
        header.usedBy.push({ caseShort: m[1], line: comment.line + n });
        continue;
      }
      if (!t) continue;
    }
    buf.push(t);
  }
  flush();
  return header;
}

module.exports = { parseHeader };
