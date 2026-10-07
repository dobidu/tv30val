---
description: "Every AtlantisPB artifact checked against what NBR 25608:2025 and the GT-ST Manual require, with a citable clause per check"
type: Project
about: "tv30val"
---

# tv30val — Normative Artifact Validator

## What This Is

Dependency-free Node 18.3+ checker for `AtlantisTV3PB/AtlantisPB` artifacts, built as standalone repo github.com/dobidu/tv30val and pointed at an AtlantisPB checkout via `--root` (handoff originally proposed `tools/atlantis/validate-normative.js` in-repo). Answers one question per artifact: does it conform to what ABNT NBR 25608:2025 and the GT-ST Manual require? Complements existing form checks (lint-manual, check-structure, readme validate, catalog check, evidence) — does not rebuild them.

Full spec: `.paul/HANDOFF.md` (handoff of 2026-10-02).

## Core Value

Normative conformance findings with a citable source on every check — and missing sources reported as SKIP, never PASS.

## Current State

| Attribute | Value |
|-----------|-------|
| Type | Application (CLI tool) |
| Version | 0.1.0-dev |
| Status | Prototype — Phase 2 of 4 done |
| Last Updated | 2026-10-07 |

## Requirements

### Core Features

- CLI contract (HANDOFF §4): targets by ID/path/all, `--family`, `--schemas`, `--severity`, `--json`, `--list-checks`; exit 0/1/2
- Finding format (§5) with mandatory `source`, `(to confirm)` marks
- Check families: `xml` (V-XML-001..012), `manifest` (V-MAN-001..006), `coherence` (V-COH-001..006), `app` (V-APP-001..011), `module` (V-MOD-001..003), `pcap` stub (skip)
- `api-index.json` data file for V-APP-006 / V-MOD-003 (generated once, reviewed as PR)
- Tests under `test/` with fixtures per check; node built-in runner

### Validated (Shipped)
- ✓ CLI contract (§4) + `--root` for standalone use — Phase 1
- ✓ Finding format (§5) with source copied from catalogue — Phase 1
- ✓ Full check catalogue metadata (39 checks), `--list-checks` — Phase 1
- ✓ Skip-never-pass; `pcap` family stub — Phase 1
- ✓ XML family complete, V-XML-001..012 — Phase 2
- ✓ Tests: missing schema → skipped + exit 0; every check has source — Phase 1

### Active (In Progress)
None yet.

### Planned (Next)
- v0.1: core + `xml`, `manifest`, `coherence`
- then `app` (needs API index), then `module`

### Out of Scope
- PCAP/TS stream validation — no massa de teste, owner undefined; `pcap` family reports skipped only
- Adding to `npm run check` (PR gate) — advisory for v0.1
- Rebuilding checks already covered by existing tools
- Writing to artifacts (read-only)

## Constraints

### Technical Constraints
- Node 18+, no new runtime deps (unless team lifts rule — decision in `docs/project/decisions.md`)
- XSD validation via `xmllint --schema` shell-out; skip with install hint if absent
- JSON Schema 2020-12: implement only subset Annex B schemas use; unsupported keywords → skipped
- All IDs via `tools/atlantis/catalog.js` + `lib/ids.js`; all paths via `tools/atlantis/layout.json`
- Absent source (XSD, Annex table) = `skipped` with reason; never changes exit code; always printed
- Never parse standard PDF at runtime

### Business Constraints
- Standard PDF + XSDs protected — never committed; live in `reference/` (gitignored) or `$ATLANTIS_SCHEMAS`
- Committing `api-index.json` requires coordinator confirmation
- Proposal not yet team-approved; repo files English, board/PRs Portuguese

## Key Decisions

| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Quick-and-dirty mode; adopt handoff recommendations as defaults | User request at init | 2026-10-07 | Active |
| `xmllint` shell-out for XSD (HANDOFF §7 opt 1) | Keeps repo dependency-free | 2026-10-07 | Active (pending team) |
| Advisory only, not in `npm run check` | Team hasn't agreed to gate PRs | 2026-10-07 | Active |
| v0.1 families: xml, manifest, coherence | HANDOFF §10.5 recommendation | 2026-10-07 | Active |
| Standalone repo + `--root` instead of living in AtlantisPB | Build fast outside team repo; port later | 2026-10-07 | Active |
| Node >=18.3 (`util.parseArgs`); `npm test` = `node --test` | No deps; works 18–24 | 2026-10-07 | Active |
| Pass results only when check ran with source available | Avoid false "nothing validated" | 2026-10-07 | Active |
| Load AtlantisPB catalog/layout/ids via require from --root | Principles 4/5: team modules answer IDs and paths | 2026-10-07 | Active |
| V-XML-010: unknown st3- app = blocking, non-kebab name = note | Never pass silently, never guess | 2026-10-07 | Active |
| Family modules with stub fallback | Each phase adds one file; skip until implemented | 2026-10-07 | Active |

## Success Metrics (Definition of Done, HANDOFF §9)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| `--list-checks` prints every check + clause | all checks | - | Not started |
| Run over repo: all findings explainable (A03/B01/B02, missing PCAPs, absent XSDs) | 0 unjustified | - | Not started |
| `npm run test:tools` green incl. new tests (missing schema → skipped + exit 0; every check emits `source`) | green | - | Not started |
| Tool passes `npm run check` | pass | - | Not started |
| `tools/atlantis/README.md` row + `decisions.md` note | done | - | Not started |

## Tech Stack / Tools

| Layer | Technology | Notes |
|-------|------------|-------|
| Runtime | Node 18+ (plain JS, CommonJS like siblings) | No deps |
| XSD validation | `xmllint` (libxml2) via child_process | Optional; skip if absent |
| Tests | `node --test` | `npm run test:tools` |
| Data | `tools/atlantis/normative/api-index.json` | Generated once from Annexes C/D |

## Open Questions (HANDOFF §10)

- AtlantisPB checkout needed for real runs (layout.json shape, catalog.js API)
- Are XSDs obtainable? If not, V-XML-002..005 permanently skipped.

---
*Created: 2026-10-07 · Last updated: 2026-10-07 after Phase 2*
