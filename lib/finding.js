'use strict';

const { getCheck, SEVERITIES } = require('./catalogue');

// A finding always takes its source from the catalogue: a check cannot report
// without the clause it enforces.
function finding({ check, severity, artifact, path, location, message, evidence }) {
  const entry = getCheck(check);
  if (!entry) throw new Error(`finding: unknown check ${check}`);
  const sev = severity || entry.severity;
  if (!SEVERITIES.includes(sev)) throw new Error(`finding: unknown severity ${sev}`);
  return {
    status: 'finding',
    check,
    severity: sev,
    artifact: artifact || null,
    path: path || null,
    location: location || null,
    message,
    source: entry.source,
    evidence: evidence || null,
  };
}

// Absence of a source, or of an implementation, is SKIP — never PASS.
function skipped(check, reason) {
  const entry = getCheck(check);
  if (!entry) throw new Error(`skipped: unknown check ${check}`);
  if (!reason) throw new Error(`skipped: ${check} needs a reason`);
  return { status: 'skipped', check, reason, source: entry.source };
}

module.exports = { finding, skipped };
