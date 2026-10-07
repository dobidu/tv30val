---
description: "tv30val — milestone and phase structure"
type: Roadmap
about: "tv30val"
---

# Roadmap: tv30val

## Overview

Normative validator for AtlantisPB artifacts. v0.1 shipped core CLI + xml, manifest, coherence families (advisory). v0.2 adds a media family (new, beyond the handoff), common modules, test applications (API index) and a gating proposal.

## Milestones

| Version | Name | Phases | Status | Completed |
|---------|------|--------|--------|-----------|
| v0.1 | Initial Release | 1-4 | ✅ Shipped | 2026-10-07 |
| v0.2 | Media, modules, applications, gating | 5-8 | 🚧 In Progress | - |

## Current Milestone

**v0.2 Media, modules, applications, gating** (v0.2.0)
Status: 🚧 In Progress
Phases: 0 of 4 complete

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 5 | Media family (V-MED-001..004, new) | TBD | Not started | - |
| 6 | Module family (V-MOD-001..002; 003 needs API index) | TBD | Not started | - |
| 7 | API index + app family (V-APP-001..011) | TBD | Blocked (api-index.json decision) | - |
| 8 | Gating on blocking + v0.2 wrap-up | TBD | Not started | - |

### Phase 5: Media family
**Goal:** validate media assets in applications (`assets/{audios,fonts,hstreams,images,texts,videos}/`): catalogued media IDs (V-MED-001), real format matches extension via magic bytes, no deps (V-MED-002), format allowed for the media type (V-MED-003, clause to confirm → skipped until known), properties vs case requirements via optional `ffprobe` (V-MED-004). Stream-carried media (HSTREAM/MMEDIA/MHAUDIO in PCAPs) stays with `pcap`.
**Depends on:** v0.1 (catalogue, adapter). **Research:** Likely (NBR 25608 media format clauses; group-document media requirements).

### Phase 6: Module family
**Goal:** V-MOD-001 module folders vs Manual §6.5.5 list (+ declared additions), V-MOD-002 no app-specific logic / hard-coded case data in modules. V-MOD-003 skipped until the API index exists.
**Depends on:** v0.1. **Research:** Unlikely.

### Phase 7: API index + app family
**Goal:** `api-index.json` from Annexes C/D (generated once, reviewed as PR), V-APP-001..011 incl. API allowlist (V-APP-006) and API group vs case (V-APP-007); enables V-MOD-003.
**Depends on:** coordinators' answer on committing api-index.json; access to the standard PDF. **Research:** Likely.

### Phase 8: Gating + wrap-up
**Goal:** opt-in gate mode (exit 1 on blocking only for chosen families), updated decisions draft and integration guide, v0.2.0 release.
**Depends on:** Phases 5-7 (7 may be deferred if still blocked).

## v0.1 Phases (✅ shipped)

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Core: CLI, finding format, check registry, skip semantics, pcap stub | 1/1 | ✅ Complete | 2026-10-07 |
| 2 | XML family (V-XML-001..012) via xmllint | 2/2 | ✅ Complete | 2026-10-07 |
| 3 | Manifest family (V-MAN-001..006) + JSON Schema subset | 1/1 | ✅ Complete | 2026-10-07 |
| 4 | Coherence family (V-COH-001..006) + DoD wrap-up (README row, decisions note) | 2/2 | ✅ Complete | 2026-10-07 |

## Phase Details (v0.1)

### Phase 1: Core ✅
CLI contract, 39-check sourced catalogue, skip-never-pass, text/JSON reports. See `phases/01-core/01-01-SUMMARY.md`.

### Phase 2: XML family ✅
All 12 xml checks live or skip with reason. 02-01 structural (001..006, 011), 02-02 header/semantic (007..010, 012). Real repo: 0 findings, 56 pass, 25 justified skips.

### Phase 3: Manifest family ✅
V-MAN-001..006 on a dependency-free JSON Schema subset. Real repo: A03/B01/B02 divergence (3 should-fix), 1 note, 77 pass.

### Phase 4: Coherence + DoD ✅
04-01 coherence family V-COH-001..006; 04-02 v0.1.0 wrap-up (decisions draft, integration guide; integration decision: standalone).

---
*Roadmap created: 2026-10-07 · v0.2 added 2026-10-07*
