---
description: "tv30val — current position and accumulated context"
type: ProjectState
about: "tv30val"
---

# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-10-07)

**Core value:** Normative conformance findings with a citable source on every check — missing sources = SKIP, never PASS.
**Current focus:** v0.2 — Phase 5 (Media family)

## Current Position

Milestone: v0.2 Media, modules, applications, gating
Phase: 5 of 8 (Media family) — Applying
Plan: 05-02 executed (3/3 PASS)
Status: APPLY complete, ready for UNIFY
Last activity: 2026-10-07 — Executed 05-02; 67 tests; V-MED-004 live

Progress:
- v0.2: [█░░░░░░░░░] 12%

## Loop Position

```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ○     [Applied, ready for UNIFY]
```

## Accumulated Context

### Decisions
- Media item = asset-folder entry (file or stream dir); allowlist to confirm; unknown format = note (Phase 5)
- 2026-10-07: v0.2 adds a `media` family (beyond handoff); media first since unblocked
- 2026-10-07: Integration = keep standalone; team gets docs/integration.md + docs/decisions-draft.md; no writes to AtlantisPB (Phase 4)
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
- Phase 7 blocked on: api-index.json commit permission (coordinators) + standard PDF
- Media format allowlist not in repo docs → V-MED-003 allowlist "(to confirm)", unknown formats = note
- No media assets in AtlantisPB yet → media family skips on real repo (future-proofing)
- Handoff DoD rows (tools/atlantis README, decisions.md, check:normative script) remain with the team — drafts in docs/
- AtlantisPB is PRIVATE, tv30val PUBLIC: fixtures synthetic only, never copy repo content

### Git State
Last commit: v0.1.0 tag
Branch: main
Feature branches merged: none

## Session Continuity

Last session: 2026-10-07
Stopped at: Plan 05-02 applied
Next action: /paul:unify .paul/phases/05-media/05-02-PLAN.md
Resume file: .paul/phases/05-media/05-02-PLAN.md

---
*STATE.md — Updated after every significant action*
