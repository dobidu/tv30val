---
description: "tv30val — milestone history and plan"
type: Milestones
about: "tv30val"
---

# Milestones: tv30val

| Version | Name | Phases | Status | Completed |
|---------|------|--------|--------|-----------|
| v0.1 | Initial Release | 1-4 | ✅ Shipped (tag v0.1.0) | 2026-10-07 |
| v0.2 | Media, modules, applications, gating | 5-8 | ✅ Shipped (tag v0.2.0) | 2026-10-07 |
| v0.3 | API index, NCL/JSON schemas | 9-11 | 🚧 In Progress | - |

## v0.1 Initial Release ✅
Core CLI, xml (V-XML-001..012), manifest (V-MAN-001..006), coherence (V-COH-001..006). 24 of 39 checks live; standalone, advisory. Release: https://github.com/dobidu/tv30val/releases/tag/v0.1.0

## v0.2 Media, modules, applications, gating ✅
**Goal:** cover the remaining artifact kinds — media assets (new `media` family), common modules, test applications — and propose gating on blocking findings.
**Shipped:** 2026-10-07, https://github.com/dobidu/tv30val/releases/tag/v0.2.0 — media, module, app (index-free) families; --gate; official XSDs. 40 of 43 checks run.
**Blocker:** app family V-APP-006/007 and module V-MOD-003 need `api-index.json` (coordinators: may it be committed?) and the standard's Annexes C/D to generate it.

## v0.3 API index, NCL/JSON schemas 🚧
**Goal:** finish schema coverage (NCL profile, AMM/nga JSON) and, when unblocked, the API index.
**Phases:** 9 API index (blocked), 10 NCL/JSON schemas (first), 11 wrap-up + release.
