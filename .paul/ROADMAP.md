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
Phases: 3 of 4 complete (75%)

## Phases (draft — refine in /paul:plan)

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Core: CLI, finding format, check registry, skip semantics, pcap stub | 1/1 | ✅ Complete | 2026-10-07 |
| 2 | XML family (V-XML-001..012) via xmllint | 2/2 | ✅ Complete | 2026-10-07 |
| 3 | Manifest family (V-MAN-001..006) + JSON Schema subset | 1/1 | ✅ Complete | 2026-10-07 |
| 4 | Coherence family (V-COH-001..006) + DoD wrap-up (README row, decisions note) | 1/2 | In progress | - |

**Next milestone (v0.2):** app family + `api-index.json` (V-APP-*), module family (V-MOD-*), gate on blocking.

## Phase Details

### Phase 1: Core ✅
CLI contract, 39-check sourced catalogue, skip-never-pass, text/JSON reports. See `phases/01-core/01-01-SUMMARY.md`.

### Phase 2: XML family ✅
All 12 xml checks live or skip with reason. 02-01 structural (001..006, 011), 02-02 header/semantic (007..010, 012). Real repo: 0 findings, 56 pass, 25 justified skips.

### Phase 3: Manifest family ✅
V-MAN-001..006 on a dependency-free JSON Schema subset. Real repo: A03/B01/B02 divergence (3 should-fix), 1 note, 77 pass.

Phase 4 detailed during `/paul:plan`.

---
*Roadmap created: 2026-10-07*
