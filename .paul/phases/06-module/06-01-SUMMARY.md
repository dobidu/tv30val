---
phase: 06-module
plan: 01
subsystem: checks
tags: [modules, manual-6.5.5, decisions]

requires:
  - phase: 05-media
    provides: emit/pass patterns, adapter
provides:
  - lib/normative/modules.js (Manual v1.0 §6.5.5 list, read from the Manual PDF)
  - V-MOD-001..002 live; V-MOD-003 skipped pending API index
affects: [07-app]

key-files:
  created: [lib/normative/modules.js, lib/families/module.js, test/module.test.js, fixture common/modules/**]
  modified: [fixture layout.json + docs/project/decisions.md, README.md]

key-decisions:
  - "Module list taken from the Manual PDF (mutool text extraction), not inferred"
  - "Additions/deviations judged per decisions.md paragraph, not per line"

duration: ~20min
completed: 2026-10-07
description: "Module family: module set vs Manual §6.5.5 with declared additions/deviations, no app-specific data in modules"
type: Summary
about: "tv30val"
---

# Phase 6 Plan 01: Module family Summary

**V-MOD-001..002 live against the Manual's own §6.5.5 list; real repo: 1 recorded-deviation note, 16 pass; V-MOD-003 waits for the API index.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: V-MOD-001 | Pass | present / declared addition / recorded deviation (note) / undeclared (should-fix); AudioVideoPlayer lua/ rule |
| AC-2: V-MOD-002 | Pass | suite IDs (team's ids.extractIds) and application paths in code files, line-located; READMEs ignored |
| AC-3: V-MOD-003 | Pass | skipped "needs the API index (v0.2 Phase 7)" |
| AC-4: Real run | Pass | 1 note (absent module with recorded deviation), 16 pass, 1 skipped |

## Verification

- `npm test` → 73 pass
- Real AtlantisPB: module family as AC-4; full run exit 0

## Deviations

| # | Type | Detail |
|---|------|--------|
| 1 | Real-data fix | Team-module declaration wraps lines → per-line match gave a false should-fix; switched to paragraph match + fixture |
| 2 | No change needed | catalogue V-MOD sources already cite §6.5.5 without "(to confirm)" |

## Next Phase Readiness

**Phase 7 blocked:** needs the coordinators' answer on committing `api-index.json` and access to NBR 25608 Annexes C/D.

**Note:** recorded-deviation evidence quotes the decisions.md paragraph start (may contain names) — runtime output only.

---
*Phase: 06-module, Plan: 01 · Completed: 2026-10-07*
