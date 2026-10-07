---
description: "tv30val — current position and accumulated context"
type: ProjectState
about: "tv30val"
---

# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-10-07)

**Core value:** Normative conformance findings with a citable source on every check — missing sources = SKIP, never PASS.
**Current focus:** v0.1 — Phase 4 (Coherence family + DoD)

## Current Position

Milestone: v0.1 Initial Release
Phase: 4 of 4 (Coherence family + DoD wrap-up) — In progress
Plan: 04-01 complete; 04-02 (DoD wrap-up + integration decision) not yet planned
Status: Ready to plan 04-02
Last activity: 2026-10-07 — 04-01 unified

Progress:
- Milestone: [████████▊░] 87%
- Phase 4: [█████░░░░░] 50%

## Loop Position

```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete - ready for next PLAN]
```

## Accumulated Context

### Decisions
- Standalone repo github.com/dobidu/tv30val; targets AtlantisPB checkout via --root (default cwd)
- V-XML-010: st3- name missing from catalogue = blocking; non-kebab = note (Phase 2)
- Emit pass results only when check ran with source available (Phase 2)
- Consume AtlantisPB catalog.js/layout.js/ids.js via require from --root (Phase 2)
- Family = lib/families/<name>.js; absent module → stub skips (Phase 1)
- engines node >=18.3; npm test = `node --test` (Phase 1)
- Quick-and-dirty mode; handoff recommendations = defaults (xmllint, advisory, v0.1 = xml/manifest/coherence)

### Deferred Issues
- api-index.json commit permission (coordinators) — blocks v0.2 app family
- XSD availability — affects V-XML-002..005
- Namespaces for BAMT/ESG/AEAT unknown (V-XML-003 skips)
- V-XML-009 deliberate windows rely on header wording (Phase 2)
- Real layout.json shape for test fixture (Phase 1)

### Blockers/Concerns
- JSON Schema subset; unsupported keyword → skip (Phase 3)
- Card ranges F01-F42 expanded; V-MAN-002 omissions group-scoped (Phase 3)
- Handoff DoD items live in AtlantisPB (README row, decisions.md, npm run check) — need user decision before touching it (plan 04-02)
- AtlantisPB is PRIVATE, tv30val PUBLIC: fixtures synthetic only, never copy repo content

### Git State
Last commit: feat(03-manifest) phase commit
Branch: main
Feature branches merged: none

## Session Continuity

Last session: 2026-10-07
Stopped at: Plan 04-01 unified
Next action: /paul:plan 04-02 (DoD wrap-up)
Resume file: .paul/phases/04-coherence/04-01-SUMMARY.md

---
*STATE.md — Updated after every significant action*
