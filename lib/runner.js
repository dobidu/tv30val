'use strict';

const { FAMILIES, SEVERITIES, getCheck } = require('./catalogue');
const { REGISTRY } = require('./families');

// gate: null = every family gates (default); [] = advisory; [...] = these families.
function run(ctx, { families = [], targets = [], severity = 'note', gate = null } = {}) {
  const selected = families.length ? FAMILIES.filter((f) => families.includes(f)) : FAMILIES;
  const all = [];
  for (const family of selected) all.push(...REGISTRY[family].run(ctx, targets));

  for (const r of all) {
    if (!getCheck(r.check)) throw new Error(`result for unknown check ${r.check}`);
    if (!r.source) throw new Error(`result for ${r.check} has no source`);
  }

  const gating = (r) => r.status === 'finding' && r.severity === 'blocking' && (gate === null || gate.includes(getCheck(r.check).family));
  for (const r of all) if (gating(r)) r.gate = true;

  const min = SEVERITIES.indexOf(severity);
  // Severity filters findings only; skips are always reported.
  const results = all.filter((r) => r.status !== 'finding' || SEVERITIES.indexOf(r.severity) >= min);

  const findings = { blocking: 0, 'should-fix': 0, note: 0 };
  let skippedCount = 0;
  let passedCount = 0;
  for (const r of all) {
    if (r.status === 'skipped') skippedCount++;
    else if (r.status === 'pass') passedCount++;
    else findings[r.severity]++;
  }
  const summary = {
    findings,
    passed: passedCount,
    skipped: skippedCount,
    checks: new Set(all.map((r) => r.check)).size,
    allSkipped: all.length > 0 && skippedCount === all.length,
    gatingFindings: all.filter(gating).length,
  };
  return { results, summary, exitCode: summary.gatingFindings > 0 ? 1 : 0, families: selected, gate };
}

module.exports = { run };
