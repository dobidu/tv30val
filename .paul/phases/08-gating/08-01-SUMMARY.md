---
phase: 08-gating
plan: 01
subsystem: cli
tags: [gating, ci, docs]

requires:
  - phase: 07-app
    provides: all v0.2 families except API index
provides:
  - --gate option (per-family exit control; none = advisory)
  - decisions draft v0.2 entry; integration guide gating + CI examples
affects: [08-gating plan 02]

key-decisions:
  - "Default gate = all families (v0.1 behaviour unchanged)"
  - "Release moved to 08-02 (wire official XSDs first) — user decision"
  - "Phase 9 (API index) → v0.3 — user decision"

duration: ~25min
completed: 2026-10-07
description: "Opt-in per-family gating and v0.2 team docs; real run 0 blocking, new genuine V-COH-003 drift detected upstream"
type: Summary
about: "tv30val"
---

# Phase 8 Plan 01: Gating + docs Summary

**`--gate` shipped with tests and CI docs; release deferred to 08-02 by decision after upstream committed the official NBR 25608 XSDs.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: --gate | Pass | comma/repeat, none, unknown → 2, report marks, JSON fields; 5 tests |
| AC-2: Docs | Pass | decisions v0.2 entry, integration Gating + GitLab/GitHub CI, README usage |
| AC-3: Release verification | Pass | real full run exit 0 (0 blocking, 4 should-fix, 23 note, 348 pass, 35 skipped); all-family gate exit 0 |
| AC-4: Phase 9 decision | Pass | → v0.3 |
| AC-5: Release | Deferred | moved to 08-02 (user decision) |

## Verification

- `npm test` → 89 pass
- New real finding after upstream pull: V-COH-003 — an app README follows a group document v1.1 while the catalogue moved to v1.2 (genuine drift)

## Deviations

| # | Type | Detail |
|---|------|--------|
| 1 | Scope (user decision) | Release moved to 08-02 so the official XSDs ship in v0.2.0 |

## Next

08-02: schema discovery in the committed complementary files folder (per-type subfolders), xmlschema backend (team's documented method), verified namespaces, real validation run, v0.2.0 release.

---
*Phase: 08-gating, Plan: 01 · Completed: 2026-10-07*
