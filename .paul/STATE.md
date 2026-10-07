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
Phase: 3 of 4 (Manifest family) — Planning
Plan: 03-01 created, awaiting approval
Status: PLAN created, ready for APPLY
Last activity: 2026-10-07 — Created .paul/phases/03-manifest/03-01-PLAN.md

Progress:
- Milestone: [█████░░░░░] 50%
- Phase 3: [░░░░░░░░░░] 0%

## Loop Position

```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ○        ○     [Plan created, awaiting approval]
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
- Annex B schemas use 19 keywords; subset validator skips on anything else (Phase 3)
- AtlantisPB is PRIVATE, tv30val PUBLIC: fixtures synthetic only, never copy repo content

### Git State
Last commit: feat(02-xml) phase commit
Branch: main
Feature branches merged: none

## Session Continuity

Last session: 2026-10-07
Stopped at: Plan 03-01 created
Next action: Approve, then /paul:apply .paul/phases/03-manifest/03-01-PLAN.md
Resume file: .paul/phases/03-manifest/03-01-PLAN.md

---
*STATE.md — Updated after every significant action*
