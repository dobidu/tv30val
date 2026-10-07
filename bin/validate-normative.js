#!/usr/bin/env node
'use strict';

const { validateCatalogue } = require('../lib/catalogue');
const { parse, classifyTargets, UsageError, USAGE } = require('../lib/args');
const { buildContext, ContextError } = require('../lib/context');
const { run } = require('../lib/runner');
const report = require('../lib/report');

function main(argv) {
  validateCatalogue();
  const opts = parse(argv);
  if (opts.help) {
    console.log(USAGE);
    return 0;
  }
  if (opts.listChecks) {
    console.log(report.listChecks(opts.json));
    return 0;
  }
  const ctx = buildContext({ root: opts.root, schemas: opts.schemas });
  const targets = classifyTargets(opts.targets, ctx.root);
  const out = run(ctx, { families: opts.families, targets, severity: opts.severity });
  console.log(opts.json ? report.json(ctx, out) : report.text(ctx, out));
  return out.exitCode;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (err) {
  console.error(`validate-normative: ${err.message}`);
  if (err instanceof UsageError) console.error(`\n${USAGE}`);
  else if (!(err instanceof ContextError)) console.error(err.stack);
  process.exitCode = 2;
}
