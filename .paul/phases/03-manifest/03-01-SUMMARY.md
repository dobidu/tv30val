---
phase: 03-manifest
plan: 01
subsystem: checks
tags: [json-schema, annex-b, manifests, cards]

requires:
  - phase: 02-xml
    provides: adapter, emit/pass pattern
provides:
  - lib/jsonschema.js (2020-12 subset, unsupported keyword detection)
  - manifest family V-MAN-001..006
affects: [04-coherence]

tech-stack:
  added: []
  patterns:
    - "Schema with unsupported keyword → skipped per file, never validated"
    - "Group-scoped bidirectional checks: own group blocking, other groups note"

key-files:
  created: [lib/jsonschema.js, lib/families/manifest.js, test/jsonschema.test.js, test/manifest.test.js, test/fixtures/atlantis-fake/docs/annex-b/**, test/fixtures/atlantis-fake/applications-staging/**]
  modified: [test/fixtures/atlantis-fake/tools/atlantis/{layout.json,catalog.js}, README.md]

key-decisions:
  - "Card refs accept filler ranges (F01-F42) — documented in the manifest schema"
  - "V-MAN-002 reverse direction: own group blocking, other groups note"
  - "manifest-schema/ and manifests/ sub-paths under layout annexB are assumed (documented in Annex B README, not layout.json)"

duration: ~30min
completed: 2026-10-07
description: "Manifest family with dependency-free JSON Schema subset; real repo surfaces exactly the known A03/B01/B02 divergence"
type: Summary
about: "tv30val"
---

# Phase 3 Plan 01: Manifest family Summary

**V-MAN-001..006 live on a 17-keyword JSON Schema subset; real AtlantisPB run reports exactly the handoff-predicted divergence (A03/B01/B02) plus one justified note.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 min |
| Tasks | 3/3 PASS |
| Tests | 46 (15 new) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Schema subset | Pass | 17 validation keywords + annotations; unsupported detection skips data positions; local $ref only |
| AC-2: V-MAN-001 | Pass | per-file errors with JSON pointer; invalid JSON → finding; unsupported schema → skipped |
| AC-3: V-MAN-002 | Pass (refined) | id ↔ file name ↔ catalogue; listed cases exist and cite PCAP; omissions group-scoped (deviation 2) |
| AC-4: V-MAN-003 | Pass (refined) | any-depth `card` refs; filler ranges expanded (deviation 1) |
| AC-5: V-MAN-004 | Pass | built↔folder, proposed-with-folder, orphan staging folders |
| AC-6: V-MAN-005/006 | Pass | ascending major.minor at any depth; duplicate channels |
| AC-7: Targets/real run | Pass | see below |

## Verification

- `npm test` → 46 pass
- Validator sanity on real schemas: injected errors (unknown prop, bad id pattern, missing cases, wrong type, bad enum, bad color pattern) all detected.
- Real AtlantisPB (private, not committed): 0 blocking, 3 should-fix (staging folders g001-individual-presentation, g002-individual-favorite-1/2 — cards A03/B01/B02 `proposed` without builtIn), 1 note (PCAP_012 cited by G006 cases not in G001 manifest), 77 pass, 0 skipped.

## Deviations

| # | Type | Detail |
|---|------|--------|
| 1 | Spec gap | First real run: 8 false "unknown card F01-F42". Schema documents card as "label, or a filler range like F01-F42" → ranges expanded |
| 2 | Over-reach corrected | Plan required both directions for cases; handoff asks one. Manifests are group-scoped (Annex B README) → other-group omissions are notes |
| 3 | Test expectation | `if` passes vacuously when property absent → `then` applies; test fixed, validator correct |
| 4 | Message | V-MAN-004 orphan-folder hint added ("a proposed card may need state built and builtIn") |

## Next Phase Readiness

**Ready:** coherence family can reuse adapter, cards/manifests readers, staging-folder scan.

**Concerns:**
- 004 can't link orphan folders to their proposed card (no builtIn) — message hints only.
- Coherence needs evidence layout (`docs/evidence/{kebabId}`), README group-doc versions, escalation list, retired IDs — check sources exist in catalog before planning.

**Blockers:** None.

---
*Phase: 03-manifest, Plan: 01 · Completed: 2026-10-07*
