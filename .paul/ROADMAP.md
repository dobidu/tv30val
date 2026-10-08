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
| v0.2 | Media, modules, applications, gating | 5-8 | ✅ Shipped (v0.2.0) | 2026-10-07 |
| v0.3 | API index, NCL/JSON schemas | 9-11 | 🚧 In Progress | - |

## Current Milestone

**v0.3 API index, NCL/JSON schemas** (v0.3.0)
Status: 🚧 In Progress
Phases: 0 of 3 complete (Phase 10 first; Phase 9 blocked)

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 9 | API index + V-APP-006/007 + V-MOD-003 | TBD | Blocked (coordinators + NBR 25608 Annexes C/D) | - |
| 10 | NCL main.ncl vs NCL4.0 profile; AMM/nga JSON schemas | TBD | Not started | - |
| 11 | v0.3 wrap-up and release | TBD | Not started | - |

### Phase 10: NCL and JSON schemas
**Goal:** validate Ginga-NCL `main.ncl` against `NCL4.0/profiles/NCL40.xsd` (with `http://www.ncl.org.br/NCL4.0/…` imports mapped to the local folder; known profile-namespace difference recorded in AtlantisPB's normative-schemas.md), and saved AMM/nga JSON reports against their JSON schemas — completing the "single schema-validation command" AtlantisPB's backlog asks for.
**Depends on:** v0.2 (schema discovery, validator backends, JSON Schema subset). **Research:** Likely (NCL4.0 import mapping; JSON schema keywords vs the subset).

### Phase 11: v0.3 wrap-up
**Goal:** docs, real verification, v0.3.0 release. Includes Phase 9 if unblocked by then; otherwise Phase 9 moves on.

## v0.2 Phases (✅ shipped v0.2.0)

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 5 | Media family (V-MED-001..004, new) | 2/2 | ✅ Complete | 2026-10-07 |
| 6 | Module family (V-MOD-001..002; 003 needs API index) | 1/1 | ✅ Complete | 2026-10-07 |
| 7 | App family without API index (V-APP-001..005, 008..011) | 2/2 | ✅ Complete | 2026-10-07 |
| 8 | Gating + official XSDs + v0.2.0 | 2/2 | ✅ Complete | 2026-10-07 |

### Phase 5: Media family ✅
05-01 V-MED-001..003 (catalogued IDs, content vs extension, kind vs folder); 05-02 V-MED-004 (HSTREAM manifests vs catalogue description). Real repo has no media yet → skipped.

**Goal:** validate media assets in applications (`assets/{audios,fonts,hstreams,images,texts,videos}/`): catalogued media IDs (V-MED-001), real format matches extension via magic bytes, no deps (V-MED-002), format allowed for the media type (V-MED-003, clause to confirm → skipped until known), properties vs case requirements via optional `ffprobe` (V-MED-004). Stream-carried media (HSTREAM/MMEDIA/MHAUDIO in PCAPs) stays with `pcap`.
**Depends on:** v0.1 (catalogue, adapter). **Research:** Likely (NBR 25608 media format clauses; group-document media requirements).

### Phase 6: Module family ✅
V-MOD-001..002 against the Manual v1.0 §6.5.5 list; real repo: 1 recorded-deviation note, 16 pass. V-MOD-003 waits for Phase 7.

**Goal:** V-MOD-001 module folders vs Manual §6.5.5 list (+ declared additions), V-MOD-002 no app-specific logic / hard-coded case data in modules. V-MOD-003 skipped until the API index exists.
**Depends on:** v0.1. **Research:** Unlikely.

### Phase 7: App family without the API index ✅
Real repo: 5 V-APP-008 notes (inline emulator WebServices URL); everything else passes.

**Goal:** V-APP-001..005 (07-01: folder/ID, entry point vs signalling, package hygiene, README cases, README input artifacts) and V-APP-008..011 (07-02: configuration placement, common-module use, result keys, placeholders). Split from the original Phase 7 on 2026-10-07 so unblocked checks ship.
**Depends on:** v0.1 adapter. **Research:** done (Manual §6.5.4–6.5.7 read from the PDF).

### Phase 9: API index (moved to v0.3 — blocked)
**Goal:** `api-index.json` from NBR 25608 Annexes C/D (generated once, reviewed as PR); V-APP-006 (API allowlist), V-APP-007 (API group vs case), V-MOD-003 (tv30-webservices surface).
**Depends on:** coordinators' answer on committing api-index.json; access to the standard. May move to v0.3.

### Phase 8: Gating + wrap-up ✅
08-01 --gate + team docs; 08-02 official XSDs (xmlschema backend), real PRRD findings match the team backlog; v0.2.0 released.

**Goal:** opt-in gate mode (exit 1 on blocking only for chosen families), updated decisions draft and integration guide, v0.2.0 release.
**Depends on:** Phases 5-7 (Phase 9 may follow or move to v0.3).

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
---
*Roadmap created: 2026-10-07 · v0.2 added 2026-10-07 · v0.3 planned 2026-10-07*
