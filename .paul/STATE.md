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
Phase: 2 of 4 (XML family)
Plan: Not started
Status: Ready to plan
Last activity: 2026-10-07 — Phase 1 complete (01-01 unified), transitioned to Phase 2

Progress:
- Milestone: [██▌░░░░░░░] 25%
- Phase 2: [░░░░░░░░░░] 0%

## Loop Position

```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete - ready for next PLAN]
```

## Accumulated Context

### Decisions
- Standalone repo github.com/dobidu/tv30val; targets AtlantisPB checkout via --root (default cwd)
- Family = lib/families/<name>.js; absent module → stub skips (Phase 1)
- engines node >=18.3; npm test = `node --test` (Phase 1)
- Quick-and-dirty mode; handoff recommendations = defaults (xmllint, advisory, v0.1 = xml/manifest/coherence)

### Deferred Issues
- api-index.json commit permission (coordinators) — blocks v0.2 app family
- XSD availability — affects V-XML-002..005
- Real layout.json shape for test fixture (Phase 1)

### Blockers/Concerns
- Phase 2+: need AtlantisPB checkout for real runs
- Phase 2: how to consume catalog.js (require vs spawn) — needed for V-XML-006/008

### Git State
Last commit: see `git log` (phase 1 feat commit)
Branch: main
Feature branches merged: none

## Session Continuity

Last session: 2026-10-07
Stopped at: Phase 1 complete, ready to plan Phase 2
Next action: /paul:plan for Phase 2 (XML family)
Resume file: .paul/ROADMAP.md

---
*STATE.md — Updated after every significant action*
