---
phase: 01-core
plan: 01
subsystem: cli
tags: [node, cli, node-test, zero-deps]

requires: []
provides:
  - validate-normative CLI (handoff §4 contract + --root)
  - check catalogue (39 checks, source per check, validated at startup)
  - finding/skipped result model with mandatory source
  - family registry with stub fallback (one module per family)
affects: [02-xml, 03-manifest, 04-coherence]

tech-stack:
  added: []
  patterns:
    - "Family = lib/families/<name>.js exporting run(ctx, targets) → results[]; absent module → stub that skips"
    - "Results only via finding()/skipped() so source is always copied from catalogue"
    - "ctx.sources.{layout,catalog,schemas,xmllint} = {available, path, reason}; families skip using reason"

key-files:
  created: [bin/validate-normative.js, lib/catalogue.js, lib/finding.js, lib/context.js, lib/args.js, lib/runner.js, lib/report.js, lib/families/index.js, test/core.test.js]
  modified: [package.json, README.md]

key-decisions:
  - "Standalone repo: --root points at AtlantisPB checkout (default cwd)"
  - "engines node >=18.3 for util.parseArgs"
  - "npm test = `node --test` (default discovery; dir arg breaks on Node 22+)"

duration: ~20min
completed: 2026-10-07
description: "Zero-dependency validate-normative CLI with 39-check sourced catalogue, skip-never-pass semantics, JSON/text reports and exit codes 0/1/2"
type: Summary
about: "tv30val"
---

# Phase 1 Plan 01: Core Summary

**Zero-dependency `validate-normative` CLI: 39-check catalogue with source clauses, SKIP-never-PASS enforced structurally, text/JSON reporting, exit codes 0/1/2, 11 tests green.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Completed | 2026-10-07 |
| Tasks | 3/3 completed (all PASS on qualify) |
| Files | 11 created, 2 modified (595 lines JS) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Check catalogue listing | Pass | 39 lines, each with source; `(to confirm)` and convention marks present; exit 0 |
| AC-2: Every check has a source | Pass | `validateCatalogue()` runs at startup; throws on missing field/dup → exit 2 |
| AC-3: Skip, never pass | Pass | Empty root → 39 skipped, warning, exit 0; pcap reason exact |
| AC-4: Root and schemas resolution | Pass | --schemas → $ATLANTIS_SCHEMAS → reference/schemas → reason; xmllint probed; bad root / bad --schemas → 2 |
| AC-5: CLI contract and exit codes | Pass | family filter, severity filter (findings only), --json shape, ID/path targets, malformed target → 2 |

## Verification

- `npm test` → 11 pass, 0 fail
- `--list-checks` → 39 checks, exit 0
- `--root <empty>` → all skipped + WARNING, exit 0
- exit 2: bad root, unknown family, bad severity, malformed target, unreadable --schemas, unknown flag
- `package.json` → no dependencies

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `bin/validate-normative.js` | Created | Entry; wires parse → context → run → report; exit 2 on errors |
| `lib/catalogue.js` | Created | 39 checks from handoff §6 with clause, severity, normative flag |
| `lib/finding.js` | Created | `finding()` / `skipped()` — source copied from catalogue |
| `lib/context.js` | Created | Root, layout.json, catalog.js presence, schemas resolution, xmllint probe |
| `lib/args.js` | Created | `util.parseArgs` CLI, target classification, usage |
| `lib/runner.js` | Created | Family selection, severity filter, summary, exit code |
| `lib/report.js` | Created | Text (sources, findings, skipped, summary, warning) and JSON |
| `lib/families/index.js` | Created | Registry; stub fallback; pcap fixed skip |
| `test/core.test.js` | Created | 11 tests incl. handoff §8 required ones |
| `test/fixtures/repo-minimal/tools/atlantis/layout.json` | Created | Placeholder layout |
| `package.json`, `README.md` | Modified | Scripts/engines; real usage section |

## Deviations from Plan

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 3 | Minor, no scope change |
| Deferred | 1 | layout.json real shape |

1. **engines `>=18.3`** (plan said 18+) — `util.parseArgs` requires 18.3.
2. **`npm test` = `node --test`** (plan said `node --test test/`) — Node 22+ treats the dir arg as a file pattern and fails; default discovery works on 18–24.
3. **`allSkipped` simplified** in runner during qualify.
4. **Added test** for `ATLANTIS_SCHEMAS`/`reference/schemas` resolution and unknown-flag exit 2 (beyond plan list; covers AC-4).

### Deferred
- Fixture `layout.json` is a placeholder; real AtlantisPB layout shape unknown until a checkout is available.

## Next Phase Readiness

**Ready:**
- Phase 2 creates `lib/families/xml.js`; registry picks it up automatically.
- `ctx.sources.schemas` / `ctx.sources.xmllint` give the skip reasons V-XML-002..005 need.

**Concerns:**
- Real runs need an AtlantisPB checkout (layout.json, catalog.js, xmls/).
- No XSDs available → V-XML-002..005 will be skipped in practice.
- How to consume `catalog.js` (require vs. spawn CLI) undecided — needed for V-XML-006/008.

**Blockers:** None for planning phase 2.

---
*Phase: 01-core, Plan: 01 · Completed: 2026-10-07*
