---
phase: 07-app
plan: 01
subsystem: checks
tags: [applications, readme, catalogue, bald]

requires:
  - phase: 06-module
    provides: patterns; adapter
provides:
  - lib/readme.js (README tables by heading/column)
  - V-APP-001..005 live; IMAGE media type
affects: [07-app plan 02, 09-api-index]

key-files:
  created: [lib/readme.js, lib/families/app.js, test/app.test.js, fixture apps 901 README/js, st3-f-3gnapp-901, staging g901-built js]
  modified: [lib/families/media.js (IMAGE), test/coherence.test.js (scoped), fixture catalog.js, README.md]

key-decisions:
  - "V-APP-003 counts only loaded references (src/href/import/require/fetch/url()); comments are provenance"
  - "README tables read by column name (column order varies across apps)"
  - "V-APP-004 omissions = note; V-APP-005 both directions blocking"

duration: ~30min
completed: 2026-10-07
description: "App family V-APP-001..005: folder/ID, entry point vs signalling, package hygiene, README cases and inputs vs catalogue"
type: Summary
about: "tv30val"
---

# Phase 7 Plan 01: App family part 1 Summary

**V-APP-001..005 live; real repo 0 findings, 75 pass — detection proven by mutating a scratch copy of a real README.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: V-APP-001 | Pass | catalogued app type, APPLICATION_ID match, fillers "N/A" |
| AC-2: V-APP-002 | Pass | index.html / main.ncl; BALD bcastEntryPointUrl exists |
| AC-3: V-APP-003 | Pass (refined) | loaded references only (deviation 1); test files |
| AC-4: V-APP-004 | Pass | listed cases exist and cite app; omissions note |
| AC-5: V-APP-005 | Pass | PCAP+XML per case both directions; missing rows |
| AC-6: Placeholders + IMAGE | Pass | 006/007 → API index; 008..011 → 07-02 |
| AC-7: Real run | Pass | 0 findings, 75 pass, 6 skipped; full exit 0 |

## Verification

- `npm test` → 81 pass
- Real tables parse (11 rows each on a sample app); scratch-copy mutation (one XML ID removed) → exactly one V-APP-005 finding; copy deleted

## Deviations

| # | Type | Detail |
|---|------|--------|
| 1 | Spec bug (real data) | First real run: 35 V-APP-003 hits, all provenance comments citing docs/tools → restricted to loading constructs; fixture proves comments ignored |
| 2 | Test assumption | coherence "README variants" assumed app 901 was the only formal app → scoped |
| 3 | Consistency | V-APP-001 label → ID form for formal folders |

## Next Phase Readiness

**Ready:** 07-02 (V-APP-008..011) can reuse folders(), walk(), readme tables.

**Known for 07-02:** five apps inline a localhost webservices base URL — to be a note asking the team (configuration vs normative constant).

---
*Phase: 07-app, Plan: 01 · Completed: 2026-10-07*
