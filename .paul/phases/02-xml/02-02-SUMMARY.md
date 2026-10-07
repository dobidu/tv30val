---
phase: 02-xml
plan: 02
subsystem: checks
tags: [xml, header-convention, bald, validity, placeholders]

requires:
  - phase: 02-xml
    provides: adapter, reader, xml family 001..006/011 (plan 01)
provides:
  - header parser (lib/header.js)
  - reader collects all elements + text nodes
  - V-XML-007, 008, 009, 010, 012 live → xml family complete
affects: [03-manifest, 04-coherence]

tech-stack:
  added: []
  patterns:
    - "emit(check, file, results): null = not applicable, [] = pass, skips pass through"
    - "Unresolvable input → note finding, never silent pass (V-XML-010)"

key-files:
  created: [lib/header.js, test/xml-semantic.test.js, test/fixtures/atlantis-fake/applications/**, test/fixtures/atlantis-fake/xmls/bald/st3-bald-90{6..9}.xml]
  modified: [lib/xml.js, lib/families/xml.js, test/xml.test.js, test/fixtures/atlantis-fake/tools/atlantis/*, README.md]

key-decisions:
  - "Assumptions label may wrap across lines — match label word, not colon"
  - "V-XML-010: st3- name not in catalogue = blocking; non-kebab package name = note"
  - "V-XML-009 deliberate past window recognised only via header 'Validity windows:' wording"

duration: ~25min
completed: 2026-10-07
description: "XML header/semantic checks 007..010, 012; xml family complete; real repo 0 findings, 56 pass, 25 justified skips"
type: Summary
about: "tv30val"
---

# Phase 2 Plan 02: XML header and semantic checks Summary

**V-XML-007/008/009/010/012 live; all 12 xml checks run or skip with reason; real AtlantisPB run clean and explainable.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~25 min |
| Tasks | 3/3 PASS |
| Tests | 31 (8 new semantic) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: V-XML-007 header fields | Pass | one should-fix per missing field; "no header comment" case |
| AC-2: V-XML-008 cases ↔ catalogue | Pass | both directions; skips: no Used by / adapter / artifact absent |
| AC-3: V-XML-009 validity | Pass | absent windows pass; undeclared past → blocking; declared deliberate → pass; bad date → blocking; BALD only |
| AC-4: V-XML-010 URLs | Pass | not-in-catalogue / missing dir / missing entry → blocking; non-kebab name → note |
| AC-5: V-XML-012 placeholders | Pass | example domains + urn: vs Assumptions; note |
| AC-6: Phase 2 complete | Pass | no "not implemented" in xml; real run below |

## Verification

- `npm test` → 31 pass
- Real AtlantisPB (private, not committed): 0 findings, 56 pass, 25 skipped (002/004/005 × 8 no schemas; 011 no ESG). 009/010 applicable to 4 BALD.

## Deviations

| # | Type | Detail |
|---|------|--------|
| 1 | Real-data fix | Assumptions label wraps lines in BALD_032 / PRRD_005 → regex loosened; would have produced false 007 findings |
| 2 | Spec tightening | 010 first draft returned note for st3- names missing from catalogue; split to blocking per AC-4 |
| 3 | Test update | xml.test.js assertion on "plan 02-02" pending reason replaced by "nothing unimplemented" |
| 4 | Bug fixed during task 1 | header flush overwrote usedBy list |

## Next Phase Readiness

**Ready:** adapter pattern + emit/orPass helpers reusable by manifest and coherence families.

**Concerns:**
- 009 cannot map deliberate windows to specific cases (006_018) — relies on header wording.
- Only BALD/PRRD namespaces known.
- Manifest family needs a JSON Schema 2020-12 subset validator — check which keywords `docs/annex-b/manifest-schema/*.json` actually use before planning.

**Blockers:** None.

---
*Phase: 02-xml, Plan: 02 · Completed: 2026-10-07*
