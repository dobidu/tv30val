---
phase: 05-media
plan: 01
subsystem: checks
tags: [media, magic-bytes, assets]

requires:
  - phase: 04-coherence
    provides: app folder discovery pattern, emit/pass
provides:
  - media family in catalogue (V-MED-001..004), 43 checks
  - lib/media.js sniffer, lib/normative/media-formats.js
  - V-MED-001..003 live; 004 skipped pending 05-02
affects: [05-media plan 02]

key-files:
  created: [lib/media.js, lib/normative/media-formats.js, lib/families/media.js, test/media.test.js, test/fixtures/atlantis-fake/applications/st3-f-3ghapp-901/assets/**]
  modified: [lib/catalogue.js, test/core.test.js, test/fixtures/atlantis-fake/tools/atlantis/catalog.js, README.md]

key-decisions:
  - "Media item = top-level entry of an asset folder; directories = stream packages (001 once, 002/003 per file)"
  - "Format allowlist from Manual §6.5.7 folder semantics, marked to confirm; unknown formats = note"
  - "Artifact label = catalogue ID when name is st3-…"

duration: ~25min
completed: 2026-10-07
description: "Media family V-MED-001..003 (catalogued IDs, content vs extension, kind vs folder); 43-check catalogue; real repo has no media yet"
type: Summary
about: "tv30val"
---

# Phase 5 Plan 01: Media family part 1 Summary

**V-MED-001..003 live with a dependency-free magic-byte sniffer; catalogue at 43 checks; real repo skips (no media assets yet).**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Catalogue and CLI | Pass | 4 entries, `media` family, list-checks 43, core tests updated |
| AC-2: Discovery | Pass | formal + filler app roots; files and stream directories |
| AC-3: V-MED-001 | Pass | not-an-ID / not catalogued / not media type / uncited → blocking; unused by app → should-fix; fonts exempt |
| AC-4: V-MED-002 | Pass | ~25 formats; mismatch & empty blocking; unknown note |
| AC-5: V-MED-003 | Pass | kind vs folder should-fix |
| AC-6: Targets | Pass | path, app ID, media ID |

## Verification

- `npm test` → 61 pass
- Real AtlantisPB: media 4/4 skipped "no media assets in applications"; full run exit 0, other families unchanged
- Fixture: exactly the 8 planted defects

## Deviations

| # | Type | Detail |
|---|------|--------|
| 1 | Bug (self-review) | V-MED-001 used `id` before definition for non-ID names → would throw; fixed before tests |
| 2 | Consistency | 002/003 artifact label was kebab stem; now catalogue ID (test added); "a image" grammar |
| 3 | No change needed | lib/args.js usage derives families from catalogue |

## Next Phase Readiness

**Ready:** 05-02 can reuse discovery (stream directories, manifests sniffed as mpd/m3u8) and read HSTREAM descriptions from the catalogue at runtime.

**Concerns:** no real media to validate against; requirement phrases in descriptions must be matched conservatively (unrecognised phrase → skipped, not pass).

---
*Phase: 05-media, Plan: 01 · Completed: 2026-10-07*
