---
description: "tv30val — current position and accumulated context"
type: ProjectState
about: "tv30val"
---

# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-10-07)

**Core value:** Normative conformance findings with a citable source on every check — missing sources = SKIP, never PASS.
**Current focus:** v0.1 — Phase 2 (XML family)

## Current Position

Milestone: v0.1 Initial Release
Phase: 2 of 4 (XML family) — In progress
Plan: 02-01 complete; 02-02 (header/semantic checks 007..010, 012) not yet planned
Status: Ready to plan 02-02
Last activity: 2026-10-07 — 02-01 unified

Progress:
- Milestone: [██▌░░░░░░░] 25%
- Phase 2: [█████░░░░░] 50%

## Loop Position

```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete - ready for next PLAN]
```

## Accumulated Context

### Decisions
- Standalone repo github.com/dobidu/tv30val; targets AtlantisPB checkout via --root (default cwd)
- Emit pass results only when check ran with source available (Phase 2)
- Consume AtlantisPB catalog.js/layout.js/ids.js via require from --root (Phase 2)
- Family = lib/families/<name>.js; absent module → stub skips (Phase 1)
- engines node >=18.3; npm test = `node --test` (Phase 1)
- Quick-and-dirty mode; handoff recommendations = defaults (xmllint, advisory, v0.1 = xml/manifest/coherence)

### Deferred Issues
- api-index.json commit permission (coordinators) — blocks v0.2 app family
- XSD availability — affects V-XML-002..005
- Real layout.json shape for test fixture (Phase 1)

### Blockers/Concerns
- Phase 2+: need AtlantisPB checkout for real runs
- AtlantisPB is PRIVATE, tv30val PUBLIC: fixtures synthetic only, never copy repo content

### Git State
Last commit: see `git log` (phase 1 feat commit)
Branch: main
Feature branches merged: none

## Session Continuity

Last session: 2026-10-07
Stopped at: Plan 02-01 unified
Next action: /paul:plan 02-02 (V-XML-007..010, 012)
Resume file: .paul/phases/02-xml/02-01-SUMMARY.md

---
*STATE.md — Updated after every significant action*
