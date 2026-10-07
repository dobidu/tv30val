---
phase: 04-coherence
plan: 01
subsystem: checks
tags: [coherence, catalogue, evidence, escalations, retired-ids]

requires:
  - phase: 03-manifest
    provides: adapter usage, emit pattern, manifest discovery
provides:
  - coherence family V-COH-001..006 → all v0.1 families implemented
affects: [04-coherence plan 02]

tech-stack:
  added: []
  patterns:
    - "Formal app = type F_3G[HN]App and id not _SCRIPT/_AUX_NNN"
    - "Retired-ID scan over layout codeRoots + xml dir + annexB; decision records excluded"

key-files:
  created: [lib/families/coherence.js, test/coherence.test.js, fixture apps/evidence/README/docs/project]
  modified: [test/fixtures/atlantis-fake/tools/atlantis/{catalog.js,layout.js,layout.json}, README.md]

key-decisions:
  - "V-COH-003 absence of a stated version = note; mismatch = should-fix"
  - "V-COH-004 links escalations through the app's cases (case.escalations ∩ open)"

duration: ~25min
completed: 2026-10-07
description: "Coherence family V-COH-001..006; real repo 16 notes (unstarted apps), 73 pass, no false findings"
type: Summary
about: "tv30val"
---

# Phase 4 Plan 01: Coherence family Summary

**V-COH-001..006 live; all three v0.1 families complete; real AtlantisPB run: 16 justified notes, 73 pass.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~25 min |
| Tasks | 2/2 PASS |
| Tests | 54 (8 new) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: V-COH-001 | Pass | note per unstarted formal app with cases; scripts excluded |
| AC-2: V-COH-002 | Pass | app folders, XMLs, manifests; fillers out of scope |
| AC-3: V-COH-003 | Pass | singular/plural/ST3_F_G forms; absent → note; no README → skipped |
| AC-4: V-COH-004 | Pass | open escalations via case links; closed ignored |
| AC-5: V-COH-005 | Pass | self-test.md exists; Summary cases both directions |
| AC-6: V-COH-006 | Pass | word-bounded, line-located; docs/specs, docs/project, catalog-overrides excluded |
| AC-7: Targets/real run | Pass | see below |

## Verification

- `npm test` → 54 pass
- Real AtlantisPB (private, not committed): 0 blocking, 0 should-fix, 16 notes (V-COH-001: catalogued formal apps without folder), 73 pass (001×9, 002×36, 003×8→9 after fix, 004×9, 005×9, 006×1), 0 skipped. Independent grep confirms no retired IDs in scope.

## Deviations

| # | Type | Detail |
|---|------|--------|
| 1 | Code bug (real data) | `ST3_F_3GHApp_011_SCRIPT` has app type → excluded via id suffix (plan intent, missed in first cut) |
| 2 | Code bug (real data) | README "G004 and G015 group documents v1.1" not matched → 2 false notes; pattern extended + test |
| 3 | Gap | No open escalation touches a built app in the real repo → V-COH-004 real-data pass is vacuous; fixture covers it |

## Next Phase Readiness

**Ready:** all v0.1 check families done; plan 04-02 = DoD wrap-up.

**Concerns:**
- Handoff DoD artifacts (tools/atlantis/README.md row, decisions.md note, `npm run check` passing) belong to AtlantisPB — integration needs a user decision.
- `npm run check` (AtlantisPB lint-manual etc.) never run against tv30val code — style may not match the team's coding standard.

**Blockers:** None.

---
*Phase: 04-coherence, Plan: 01 · Completed: 2026-10-07*
