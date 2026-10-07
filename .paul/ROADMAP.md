---
description: "tv30val — milestone and phase structure"
type: Roadmap
about: "tv30val"
---

# Roadmap: tv30val

## Overview

Normative validator for AtlantisPB artifacts. v0.1 ships core CLI + xml, manifest, coherence families (advisory). Later phases add app (API index) and module families.

## Current Milestone

**v0.1 Initial Release** (v0.1.0)
Status: In progress
Phases: 1 of 4 complete (25%)

## Phases (draft — refine in /paul:plan)

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Core: CLI, finding format, check registry, skip semantics, pcap stub | 1/1 | ✅ Complete | 2026-10-07 |
| 2 | XML family (V-XML-001..012) via xmllint | TBD | Not started | - |
| 3 | Manifest family (V-MAN-001..006) + JSON Schema subset | TBD | Not started | - |
| 4 | Coherence family (V-COH-001..006) + DoD wrap-up (README row, decisions note) | TBD | Not started | - |

**Next milestone (v0.2):** app family + `api-index.json` (V-APP-*), module family (V-MOD-*), gate on blocking.

## Phase Details

### Phase 1: Core ✅
CLI contract, 39-check sourced catalogue, skip-never-pass, text/JSON reports. See `phases/01-core/01-01-SUMMARY.md`.

Phases 2–4 detailed during `/paul:plan`.

---
*Roadmap created: 2026-10-07*
