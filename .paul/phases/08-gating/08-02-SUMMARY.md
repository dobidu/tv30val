---
phase: 08-gating
plan: 02
subsystem: checks
tags: [xsd, xmlschema, xmllint, release]

requires:
  - phase: 08-gating
    provides: --gate (plan 01)
provides:
  - schema discovery in AtlantisPB's committed complementary files
  - xmlschema backend; verified namespaces (BALD, PRRD, BAMT)
  - v0.2.0 release
affects: [v0.3]

key-files:
  created: [test/schemas.test.js, test/fixtures/bin-fake-python/python3, test/fixtures/complementary-root/**]
  modified: [lib/context.js, lib/xml.js, lib/families/xml.js, lib/normative/namespaces.js, test/xml.test.js, docs/*, README.md, package.json]

key-decisions:
  - "Complementary-files folder is the last schema fallback (team decision 2026-10-07)"
  - "Validator: xmllint, else Python xmlschema ($ATLANTIS_PYTHON)"
  - "V-XML-002 passes only on clean validation"

duration: ~35min
completed: 2026-10-07
description: "Official NBR 25608 XSDs wired in; real validation reproduces the team's PRRD backlog item exactly; v0.2.0 released"
type: Summary
about: "tv30val"
---

# Phase 8 Plan 02: Official XSDs + v0.2.0 Summary

**Schema-backed XML checks live on real data: 4 BALD valid, 4 PRRD invalid (9 errors: 2/2/1/4) — identical to the team's own backlog analysis. v0.2.0 released.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Schema discovery | Pass | complementary folder fallback; recursive XSD lookup |
| AC-2: Validator backends | Pass | xmllint → xmlschema; sources.validator; classification extended |
| AC-3: Verified namespaces | Pass | BALD/PRRD/BAMT == XSD targetNamespace; BAMT added (…/Delivery/BAMT/1.0/) |
| AC-4: Real validation | Pass | 9 blocking V-XML-005 on PRRD 002..005; matches backlog item error-for-error |
| AC-5: Docs and release | Pass | integration/README/decisions; tag + GitHub release v0.2.0 |

## Verification

- `npm test` → 93 pass
- Real: full run exit 1 (PRRD schema errors, justified); `--gate manifest,coherence,media,module,app` exit 0
- xmlschema 4.3.2 in a scratch venv (outside the repo)

## Deviations

| # | Type | Detail |
|---|------|--------|
| 1 | Bug (real data) | V-XML-002 passed for files whose errors were classified 004/005 → now passes only on clean validation; test added |

## Notes

- Team backlog also asks for a single schema-validation command; tv30val covers XML; NCL/JSON → v0.3 Phase 10.

---
*Phase: 08-gating, Plan: 02 · Completed: 2026-10-07*
