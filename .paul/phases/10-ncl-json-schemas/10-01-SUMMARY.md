---
phase: 10-ncl-json-schemas
plan: 01
subsystem: checks
tags: [ncl, xsd, uri-mapping, xmlschema, xmllint-catalog]

requires:
  - phase: 08-gating
    provides: schema discovery, validator backends
provides:
  - V-APP-012 (44 checks)
  - validateXsd uriMap (xmlschema uri_mapper; xmllint XML catalog + --nonet)
affects: [11-v03-release]

key-files:
  created: [test/ncl.test.js, fixture st3-f-3gnapp-903, complementary-root NCL40.xsd placeholder]
  modified: [lib/xml.js, lib/families/app.js, lib/catalogue.js, test/core.test.js, test/app.test.js, fixture catalog.js + st3-f-3gnapp-902 (NCL 3.0 ns), bin-fake-python, docs/decisions-draft.md, README.md, docs/integration.md]

key-decisions:
  - "NCL 3.0 namespace → one blocking finding, no schema run"
  - "JSON schemas deferred (no reports; keywords beyond subset) → jsonschema backend later"
  - "nga 'minmum' typo reported in decisions draft for the forum"

duration: ~30min
completed: 2026-10-07
description: "Ginga-NCL main.ncl validated against the official NCL 4.0 profile with offline import mapping; JSON deferred"
type: Summary
about: "tv30val"
---

# Phase 10 Plan 01: NCL profile validation Summary

**V-APP-012 live; mapping verified end-to-end against the real NCL 4.0 profile with the team's validator; real repo has no NCL apps yet (skipped).**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Catalogue | Pass | V-APP-012; 44 checks |
| AC-2: Namespace pre-check | Pass | NCL 3.0 placeholder evidence |
| AC-3: Mapped validation | Pass | xmlschema uri_mapper; xmllint catalog + --nonet; skips with reason |
| AC-4: Real profile | Pass | temp root (not committed): valid doc pass, broken doc fails at /ncl/body |
| AC-5: JSON deferral | Pass | decisions-draft v0.3 entry incl. nga typo |

## Verification

- `npm test` → 97 pass
- Real run: V-APP-012 skipped (no NCL apps); other results unchanged (9 PRRD blocking, 4 should-fix, 23 note); skips 35 → 12 with xmlschema available

## Deviations

| # | Type | Detail |
|---|------|--------|
| 1 | Test expectation | skip reason order: no schema dir reported before validator (code correct) |
| 2 | Scope (planned) | JSON part of Phase 10 deferred with reasons |

---
*Phase: 10-ncl-json-schemas, Plan: 01 · Completed: 2026-10-07*
