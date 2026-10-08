---
phase: 09-api-index
plan: 01
subsystem: data
tags: [api-index, nbr-25608, annex-c, annex-d, generator]

requires:
  - phase: 08-gating
    provides: v0.2 baseline
provides:
  - tools/build-api-index.js (generator; parsing logic only, committed)
  - reference/api-index.json (generated locally from the licensed standard; gitignored)
affects: [09-api-index plan 02 (V-APP-006/007, V-MOD-003)]

key-decisions:
  - "Executed on the user's direct instruction ('build the API index from Annexes C and D'); no separate PLAN.md"
  - "Index stays out of every repo (licensed copy, watermark names the licensee); commit is the coordinators' call"
  - "Skeleton from Table C.2 / Table D.1; endpoints and Lua functions from each clause body"

duration: ~45min
completed: 2026-10-07
description: "API index generator: 66 tv3ws ids / 67 endpoints, 27 NCLua ids / 50 functions + event classes, built locally from NBR 25608 Annexes C/D"
type: Summary
about: "tv30val"
---

# Phase 9 Plan 01: API index generator Summary

**Generator committed; index generated locally (gitignored). Coverage: all 66 Table C.2 ids resolved to a clause body with endpoints (38 GET, 22 POST, 6 DELETE + 1 variant); 27 Table D.1 ids with 50 Lua functions and 16 event classes.**

## Source handling

- Standard: user-provided English PDF (544 pp.), licensed copy (per-page watermark naming the licensee). Text extracted with mutool into the session scratchpad only.
- Nothing from the standard is committed: generator holds parsing logic; tests use an invented, standard-shaped fixture.

## Verification

- `npm test` → 101 pass (4 new generator tests)
- Method counts match an independent count of the operation rows (research agent)
- Cross-check: every /tv3 path the real AtlantisPB apps call matches an index entry (one miss was a comment's trailing period)

## Parser issues fixed during build

| Issue | Fix |
|---|---|
| "(continues)" captions stripped by noise filter → table not found | keep captions; skip own-table captions in the row loop |
| page-number filter also removed the "0" clause cells → columns shifted | rows built by pattern (id starts a row; clause/version by shape); filter digits ≥1 only |
| "Table C.2 (conclusion)" (no dash) ended the table early | skip any caption of the same table |
| table cells "C.6.3.1" taken as headings | heading = number + title line (not a version, not an id) |
| bodies cut at first subclause | body ends only at a heading outside the clause |
| "Operation Type:" label variant | both labels accepted |
| numbered URL variants glued | split per "(n)" / scheme; query split off; "[?…]" optional query moved to query |

## Known limits (for 09-02)

- `/tv3/<service-context-id>` is a one-segment wildcard: matching must prefer literal paths.
- Clauses inferred for 3 ids whose table cell extracted as "0" (flagged `inferredClause`).
- Some query strings keep extraction artefacts (informational only).
- Annex A (NCL APIs) not indexed; HTML5 W3C/CTA APIs have no ids in the standard.

---
*Phase: 09-api-index, Plan: 01 · Completed: 2026-10-07*
