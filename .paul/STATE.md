---
description: "tv30val — current position and accumulated context"
type: ProjectState
about: "tv30val"
---

# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-10-07)

**Core value:** Normative conformance findings with a citable source on every check — missing sources = SKIP, never PASS.
**Current focus:** v0.1 — Phase 3 (Manifest family)

## Current Position

Milestone: v0.1 Initial Release
Phase: 3 of 4 (Manifest family)
Plan: Not started
Status: Ready to plan
Last activity: 2026-10-07 — Phase 2 complete (02-01, 02-02 unified), transitioned to Phase 3

Progress:
- Milestone: [█████░░░░░] 50%
- Phase 3: [░░░░░░░░░░] 0%

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
- Phase 3: check which JSON Schema keywords Annex B schemas use before planning subset validator
- AtlantisPB is PRIVATE, tv30val PUBLIC: fixtures synthetic only, never copy repo content

### Git State
Last commit: feat(02-xml) phase commit
Branch: main
Feature branches merged: none

## Session Continuity

Last session: 2026-10-07
Stopped at: Phase 2 complete, ready to plan Phase 3
Next action: /paul:plan for Phase 3 (Manifest family)
Resume file: .paul/ROADMAP.md

---
*STATE.md — Updated after every significant action*
