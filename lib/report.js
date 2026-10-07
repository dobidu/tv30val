'use strict';

const { CHECKS } = require('./catalogue');
const pkg = require('../package.json');

function listChecks(json) {
  if (json) return JSON.stringify(CHECKS, null, 2);
  const rows = CHECKS.map((c) => [c.id, c.family, c.severity, c.source]);
  const w = [0, 1, 2].map((i) => Math.max(...rows.map((r) => r[i].length)));
  return rows.map((r) => `${r[0].padEnd(w[0])}  ${r[1].padEnd(w[1])}  ${r[2].padEnd(w[2])}  ${r[3]}`).join('\n');
}

function sourceLine(name, s) {
  if (s.available) {
    const extra = s.version ? ` (${s.version})` : s.via ? ` (via ${s.via})` : '';
    return `  ${name.padEnd(8)} available  ${s.path || ''}${extra}`.trimEnd();
  }
  return `  ${name.padEnd(8)} MISSING    ${s.reason}`;
}

function text(ctx, out) {
  const lines = [`tv30val ${pkg.version} — root ${ctx.root}`, '', 'Sources:'];
  for (const [name, s] of Object.entries(ctx.sources)) lines.push(sourceLine(name, s));

  const findings = out.results.filter((r) => r.status === 'finding');
  const skips = out.results.filter((r) => r.status === 'skipped');

  if (findings.length) {
    lines.push('', 'Findings:');
    const byArtifact = new Map();
    for (const f of findings) {
      const key = f.artifact || f.path || '(repository)';
      if (!byArtifact.has(key)) byArtifact.set(key, []);
      byArtifact.get(key).push(f);
    }
    for (const [artifact, list] of byArtifact) {
      lines.push(`  ${artifact}`);
      for (const f of list) {
        const loc = [f.path, f.location].filter(Boolean).join(' ');
        lines.push(`    [${f.severity}] ${f.check} ${f.message}${loc ? ` — ${loc}` : ''}`);
        lines.push(`      source: ${f.source}`);
        if (f.evidence) lines.push(`      evidence: ${f.evidence}`);
      }
    }
  }

  if (skips.length) {
    lines.push('', `Skipped (${skips.length}):`);
    for (const s of skips) lines.push(`  ${s.check}  ${s.reason}`);
  }

  const { findings: n, skipped, checks } = out.summary;
  lines.push(
    '',
    `Summary: ${n.blocking} blocking, ${n['should-fix']} should-fix, ${n.note} note, ${skipped} skipped — ${checks} checks in ${out.families.join(', ')}`,
  );
  if (out.summary.allSkipped) lines.push('WARNING: all checks skipped — nothing was validated.');
  return lines.join('\n');
}

function json(ctx, out) {
  return JSON.stringify(
    {
      tool: 'tv30val',
      version: pkg.version,
      root: ctx.root,
      sources: ctx.sources,
      families: out.families,
      results: out.results,
      summary: out.summary,
      exitCode: out.exitCode,
    },
    null,
    2,
  );
}

module.exports = { listChecks, text, json };
