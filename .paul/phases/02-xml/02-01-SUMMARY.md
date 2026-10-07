---
phase: 02-xml
plan: 01
subsystem: checks
tags: [xml, xmllint, xsd, catalogue-adapter]

requires:
  - phase: 01-core
    provides: CLI, catalogue, finding/skipped model, family registry
provides:
  - AtlantisPB adapter (catalog.js / layout.js / lib/ids.js required from --root)
  - minimal XML reader + xmllint wrapper with schema-error classification
  - V-XML-001..006 and 011 live
  - pass results (status "pass") counted in summary
affects: [02-xml plan 02, 03-manifest, 04-coherence]

tech-stack:
  added: []
  patterns:
    - "Team modules answer IDs and paths: lib/atlantis.js loadAtlantis(root) → {ok, catalog, layout, ids} | {ok:false, reason}"
    - "Per-file chain: 001 fail → 002..006 skipped 'not well-formed'"
    - "passed() only when the check ran with its source available; orPass() helper"
    - "Synthetic fixtures only (9xx IDs) — AtlantisPB is private"

key-files:
  created: [lib/atlantis.js, lib/xml.js, lib/normative/namespaces.js, lib/families/xml.js, test/xml.test.js, test/fixtures/atlantis-fake/**, test/fixtures/bin-fake/xmllint]
  modified: [lib/finding.js, lib/runner.js, lib/report.js, package.json, README.md]

key-decisions:
  - "Emit pass results (plan said never) — otherwise real runs falsely warned 'nothing validated'"
  - "XML dirs from layout.json xml pattern (layout.js does not export pattern)"
  - "V-XML-011 checks ESG numbers present in the tree; unbuilt catalogue ESGs → V-COH-001"

duration: ~30min
completed: 2026-10-07
description: "XML structural checks V-XML-001..006/011 on top of AtlantisPB's own catalog/layout modules; real repo: 0 findings, 24 pass, 30 justified skips"
type: Summary
about: "tv30val"
---

# Phase 2 Plan 01: XML structural checks Summary

**V-XML-001..006 and 011 live, delegating IDs/paths to AtlantisPB's own modules; schema checks skip precisely when XSD/xmllint absent; real repo run fully explainable.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 min |
| Completed | 2026-10-07 |
| Tasks | 3/3 PASS |
| Tests | 23 (12 new xml + 11 core) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Adapter | Pass | require from root, memoized; missing/throwing → 006 skipped with reason. Discovery via layout.json pattern (deviation 2) |
| AC-2: V-XML-001 | Pass | xmllint when present; else built-in reader, evidence "(partial)"; fail → 002..006 skipped |
| AC-3: 002/004/005 | Pass | skip reasons: no schemas dir / xmllint absent / XSD name not recorded / XSD not in dir / XSD won't compile; errors classified (fake xmllint test) |
| AC-4: V-XML-003 | Pass | ns + root local name; BAMT/ESG/AEAT skipped "not recorded" |
| AC-5: V-XML-006 | Pass | catalogue existence + type, header ID, layout.xmlPath |
| AC-6: V-XML-011 | Pass (narrowed) | tree-based only (deviation 3) |
| AC-7: Targets/pending | Pass | ID/path targets filter; 007..010, 012 skipped "plan 02-02" |

## Verification

- `npm test` → 23 pass, 0 fail
- Real AtlantisPB checkout (private, scratchpad, not committed): `--family xml` → 0 findings, 24 pass (001/003/006 × 8 files), 30 skipped (002/004/005 × 8: no schemas dir; 011: no ESG; 5 pending). Exit 0.

## Deviations from Plan

| # | Type | Detail |
|---|------|--------|
| 1 | Design fix | `passed()` added + summary `passed` count. Plan said "never emit a pass"; that made real runs print "all checks skipped — nothing was validated" though 3 checks ran. SKIP-never-PASS for missing sources unchanged. |
| 2 | Approach | XML dirs from `layout.json` presets[preset].xml (layout.js exports no pattern); fallback `xmls/<type>/` noted in skip reason |
| 3 | Scope narrowed | V-XML-011 only for ESG numbers present on disk; catalogue-only ESGs are V-COH-001 |
| 4 | Fix | `npm test` → `node --test test/*.test.js` (default discovery ran fixture .js files) |
| 5 | Not needed | `lib/context.js` untouched; adapter loaded lazily by family |
| 6 | Extra | README status + result statuses; repo-minimal fixture comment |

## Next Phase Readiness

**Ready:** adapter + reader give plan 02-02 header comments (`parsed.comments`), catalogue cases (`findArtifact().cases`), root attrs.

**Concerns:**
- Namespaces/XSD names for BAMT/ESG/AEAT unknown; BALD/PRRD "(to confirm)".
- Built-in reader doesn't parse nested element attrs beyond tags it walks — 02-02 needs attrs of descendants (validFrom/validUntil, URLs): extend reader to collect all elements.
- Plan text in public repo names a few AtlantisPB structural facts (exports, namespaces) — flagged to user.

**Blockers:** None.

---
*Phase: 02-xml, Plan: 01 · Completed: 2026-10-07*
