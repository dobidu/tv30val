'use strict';

const { parseArgs } = require('node:util');
const fs = require('node:fs');
const path = require('node:path');
const { FAMILIES, SEVERITIES } = require('./catalogue');

class UsageError extends Error {}

const USAGE = `Usage: validate-normative [target …] [options]

  target            artifact ID (ST3_F_3GHApp_009, ST3_BALD_032), a path
                    relative to --root, or omitted for everything
  --root <dir>      AtlantisPB checkout to validate (default: cwd)
  --family <f>      ${FAMILIES.join(' | ')}  (repeatable)
  --schemas <dir>   XSD directory (else $ATLANTIS_SCHEMAS, else <root>/reference/schemas)
  --severity <s>    minimum severity to report: ${SEVERITIES.join(' | ')} (default: note)
  --json            machine-readable output
  --list-checks     print the check catalogue with clauses and exit
  -h, --help        show this help

Exit codes: 0 no blocking finding · 1 blocking finding(s) · 2 could not run.
Skipped checks never change the exit code but are always reported.`;

const ID_RE = /^ST3_[A-Za-z0-9_]+$/;

function parse(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        root: { type: 'string' },
        family: { type: 'string', multiple: true },
        schemas: { type: 'string' },
        severity: { type: 'string', default: 'note' },
        json: { type: 'boolean', default: false },
        'list-checks': { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
      },
    });
  } catch (err) {
    throw new UsageError(err.message);
  }
  const v = parsed.values;
  const families = v.family || [];
  for (const f of families) {
    if (!FAMILIES.includes(f)) throw new UsageError(`unknown family "${f}" (expected ${FAMILIES.join(', ')})`);
  }
  if (!SEVERITIES.includes(v.severity)) {
    throw new UsageError(`unknown severity "${v.severity}" (expected ${SEVERITIES.join(', ')})`);
  }
  return {
    root: path.resolve(v.root || process.cwd()),
    families,
    schemas: v.schemas,
    severity: v.severity,
    json: v.json,
    listChecks: v['list-checks'],
    help: v.help,
    targets: parsed.positionals,
  };
}

// Targets are either catalogue IDs or paths under root. Resolving IDs against
// the catalogue is the families' job; here we only reject malformed input.
function classifyTargets(targets, root) {
  return targets.map((t) => {
    if (ID_RE.test(t)) return { kind: 'id', value: t };
    const abs = path.resolve(root, t);
    if (fs.existsSync(abs)) return { kind: 'path', value: path.relative(root, abs) || '.' };
    throw new UsageError(`target "${t}" is neither an artifact ID (ST3_…) nor an existing path under ${root}`);
  });
}

module.exports = { parse, classifyTargets, UsageError, USAGE };
