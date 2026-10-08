---
description: "tv30val — current position and accumulated context"
type: ProjectState
about: "tv30val"
---

# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-10-07)

**Core value:** Normative conformance findings with a citable source on every check — missing sources = SKIP, never PASS.
**Current focus:** v0.3 — Phase 9 (API index): index built; next 09-02 checks

## Current Position

Milestone: v0.3 API index, NCL/JSON schemas
Phase: 9 of 11 (API index) — In progress
Plan: 09-01 complete (generator + local index); 09-02 (V-APP-006/007, V-MOD-003) next
Status: Ready to plan 09-02
Last activity: 2026-10-07 — Standard provided; API index built (66 tv3ws / 27 nclua ids)

Progress:
- v0.3: [██████░░░░] 60%

## Loop Position

```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete - ready for next PLAN]
```

## Accumulated Context

### Decisions
- 2026-10-07: NBR 25608 PDF provided (licensed copy, watermark) — text only in scratchpad; index in gitignored reference/
- NCL validated via mapped imports (uri_mapper / catalog); NCL 3.0 ns = one finding (Phase 10)
- 2026-10-07: Phase 10 = NCL only; JSON schemas deferred (no reports in repo; need oneOf/unevaluatedProperties/cross-file refs)
- Official XSDs from AtlantisPB complementary files; xmlschema backend; V-XML-002 passes only clean (Phase 8)
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
- api-index.json commit permission (coordinators) — index lives in gitignored reference/
- Real PRRD 002..005 schema errors are AtlantisPB backlog work (not a tool issue)
- Namespaces for ESG/AEAT unknown (V-XML-003 skips)
- V-XML-009 deliberate windows rely on header wording (Phase 2)
- Real layout.json shape for test fixture (Phase 1)

### Blockers/Concerns
- Official nga preset/switchgroup schemas misspell `minimum` as `minmum` — tell the team
- JSON Schema subset; unsupported keyword → skip (Phase 3)
- Card ranges F01-F42 expanded; V-MAN-002 omissions group-scoped (Phase 3)
- api-index.json commit permission still the coordinators' call (index lives in gitignored reference/)
- Media format allowlist not in repo docs → V-MED-003 allowlist "(to confirm)", unknown formats = note
- No media assets in AtlantisPB yet → media family skips on real repo (future-proofing)
- Deferred: segment decoding via ffprobe; remote HSTREAM manifests
- Handoff DoD rows (tools/atlantis README, decisions.md, check:normative script) remain with the team — drafts in docs/
- AtlantisPB is PRIVATE, tv30val PUBLIC: fixtures synthetic only, never copy repo content

### Git State
Last commit: API index generator (09-01)
Branch: main
Feature branches merged: none

## Session Continuity

Last session: 2026-10-08
Stopped at: Paused after 09-01 (API index generator committed; index built locally)
Next action: rebuild local env (see handoff), then /paul:plan 09-02 (V-APP-006/007, V-MOD-003)
Resume file: .paul/HANDOFF-2026-10-08.md
Resume context:
- Scratchpad (AtlantisPB clone, standard text, xmlschema venv, api-index) is gone — rebuild per handoff
- Pending verification fixes: 44642 exemption, PRRD contradiction evidence, clause marks (BAMT ns → NBR 25602)
- Never commit standard-derived data (licensed copy) or AtlantisPB content (private)
Git strategy: main

---
*STATE.md — Updated after every significant action*
