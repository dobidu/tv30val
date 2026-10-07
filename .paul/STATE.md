---
description: "tv30val — current position and accumulated context"
type: ProjectState
about: "tv30val"
---

# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-10-07)

**Core value:** Normative conformance findings with a citable source on every check — missing sources = SKIP, never PASS.
**Current focus:** v0.2 — Phase 8 (gating + v0.2.0 release)

## Current Position

Milestone: v0.2 Media, modules, applications, gating
Phase: 8 of 8 (Gating + v0.2 wrap-up) — Planning
Plan: 08-01 complete; 08-02 created, awaiting approval
Status: PLAN created, ready for APPLY
Last activity: 2026-10-07 — 08-01 unified; created 08-02-PLAN.md; Phase 9 → v0.3

Progress:
- v0.2: [████████░░] 85%

## Loop Position

```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ○        ○     [Plan created, awaiting approval]
```

## Accumulated Context

### Decisions
- 2026-10-07: Wire AtlantisPB-committed NBR 25608 XSDs before v0.2.0 (plan 08-02); release moves to 08-02
- 2026-10-07: Phase 9 (API index) moves to v0.3
- Local URLs in app code = note; V-APP-011 reclassified as team convention (Phase 7)
- V-APP-003 counts loaded references only; README tables by column name (Phase 7)
- 2026-10-07: Phase 7 split — index-free app checks now; API index → Phase 9 (blocked)
- V-APP-011 language: Manual sets no rule → skipped; placeholders = team-convention note
- Module list from Manual v1.0 PDF §6.5.5; declarations matched per decisions.md paragraph (Phase 6)
- HSTREAM requirements read from catalogue description at runtime; unprovable → skipped (Phase 5)
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
- Phase 9 blocked on: api-index.json commit permission (coordinators) + NBR 25608 PDF (Annexes C/D) — not in AtlantisPB, not available here
- Media format allowlist not in repo docs → V-MED-003 allowlist "(to confirm)", unknown formats = note
- No media assets in AtlantisPB yet → media family skips on real repo (future-proofing)
- Deferred: segment decoding via ffprobe; remote HSTREAM manifests
- Handoff DoD rows (tools/atlantis README, decisions.md, check:normative script) remain with the team — drafts in docs/
- AtlantisPB is PRIVATE, tv30val PUBLIC: fixtures synthetic only, never copy repo content

### Git State
Last commit: feat(07-app) phase commit
Branch: main
Feature branches merged: none

## Session Continuity

Last session: 2026-10-07
Stopped at: Plan 08-02 created
Next action: Approve, then /paul:apply .paul/phases/08-gating/08-02-PLAN.md
Resume file: .paul/phases/08-gating/08-02-PLAN.md

---
*STATE.md — Updated after every significant action*
