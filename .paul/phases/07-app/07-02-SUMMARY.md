---
phase: 07-app
plan: 02
subsystem: checks
tags: [applications, configuration, common-modules, placeholders]

requires:
  - phase: 07-app
    provides: app family part 1, folders/walk/readme helpers
provides:
  - lib/code.js (comment-aware line scanner)
  - V-APP-008, 009, 011 live; 010 skipped pending decision
affects: [08-gating, 09-api-index]

key-files:
  created: [lib/code.js, fixture st3-f-3gnapp-902, fixture configuration/receiver-specific]
  modified: [lib/families/app.js, lib/catalogue.js (V-APP-011), test/app.test.js, fixture app 901 + catalog.js, README.md]

key-decisions:
  - "Local URLs in app code = note (team decides configuration vs normative constant); numeric key codes = should-fix"
  - "TV30WebServices/NotificationBar absence never flagged (Manual exceptions)"
  - "V-APP-011 = team convention note (Manual sets no language for tester-facing text)"

duration: ~25min
completed: 2026-10-07
description: "App family part 2: configuration placement, common-module use, placeholder text; V-APP-010 pending decision"
type: Summary
about: "tv30val"
---

# Phase 7 Plan 02: App family part 2 Summary

**V-APP-008/009/011 live; real repo: 5 justified V-APP-008 notes (inline emulator WebServices URL), everything else passes; exit 0.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: V-APP-008 | Pass | local URLs note; key codes should-fix; comments and configuration/ ignored |
| AC-2: V-APP-009 | Pass | info/buttons/results modules; media without audio-video-player; NCL via main.ncl/lua; fillers excluded |
| AC-3: V-APP-010 | Pass | skipped, pending decision |
| AC-4: V-APP-011 | Pass | placeholders in tester-facing text only; language skipped; catalogue reclassified |
| AC-5: Real run | Pass | 5 notes (008), 009 9/9 pass, 011 24/24 pass |

## Verification

- `npm test` → 84 pass; real full run exit 0

## Deviations

| # | Type | Detail |
|---|------|--------|
| 1 | Catalogue | V-APP-011 severity should-fix → note, team convention (no Manual rule) |
| 2 | Fixture | NCL module test moved to new st3-f-3gnapp-902 so 07-01's "no main.ncl" case stays |
| 3 | Test bug | skipped results carry no artifact → match by reason |

## Next Phase Readiness

**Phase 7 complete** (V-APP-006/007 → Phase 9). Phase 8 (gating + v0.2.0) ready.

---
*Phase: 07-app, Plan: 02 · Completed: 2026-10-07*
