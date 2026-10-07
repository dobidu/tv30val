# tv30val — Normative Artifact Validator

A dependency-free Node 18.3+ checker for the TV 3.0 test-suite artifacts of
[AtlantisPB](https://github.com/AtlantisTV3PB/AtlantisPB). It answers one
question per artifact:

> **Does this artifact conform to what ABNT NBR 25608:2025 and the GT-ST
> Manual require of it?**

It complements the existing form checks in `tools/atlantis/` (coding standard,
repository structure, README structure, catalogue IDs, evidence shape). It does
not replace them.

> **Status:** v0.1.0 — the `xml`, `manifest` and `coherence` families are
> complete (24 of 39 v0.1 checks); v0.2 adds `media` (V-MED-001..004) and
> `module` (V-MOD-001..002). `app` and V-MOD-003 (need the API index) and
> `pcap` (deferred) report `skipped`. Proposal, not yet adopted by the team; advisory only, not
> part of any PR gate. See [docs/integration.md](docs/integration.md) and
> [docs/decisions-draft.md](docs/decisions-draft.md).

## Principles

1. **No check without a citable normative source.** Every check declares the
   clause it enforces. Rules without a clause are team conventions and are
   labelled as such.
2. **Absence of a source is SKIP, never PASS.** A missing XSD or Annex table
   yields `skipped` with the reason — always printed, never silent.
3. **Severity:** `blocking` / `should-fix` / `note`.
4. **Never invent an identifier** — IDs resolve through the v1.1 catalogue.
5. **No hard-coded repository paths** — everything via `layout.json`.
6. **No runtime dependencies.** Plain Node.
7. **Read-only.** The validator never modifies artifacts.

## Usage

Requires Node 18.3+. Point `--root` at an AtlantisPB checkout (default: the
current directory).

```
node bin/validate-normative.js [target …] [options]

  target            artifact ID (ST3_F_3GHApp_009, ST3_BALD_032), a path
                    relative to --root, or omitted for everything
  --root <dir>      AtlantisPB checkout to validate (default: cwd)
  --family <f>      xml | app | module | manifest | coherence | media | pcap  (repeatable)
  --schemas <dir>   XSD directory (else $ATLANTIS_SCHEMAS, else <root>/reference/schemas)
  --severity <s>    minimum severity to report: note | should-fix | blocking
  --json            machine-readable output
  --list-checks     print the check catalogue with clauses and exit
  -h, --help        show help
```

Exit codes: `0` no blocking finding · `1` at least one blocking finding ·
`2` the tool could not run (bad argument, missing root, unreadable `--schemas`).
`skipped` never changes the exit code. Results are `finding`, `pass` (the
check ran with its source available and found nothing) or `skipped`. `--severity` filters findings only;
skips are always reported, and a run where everything skipped prints a warning.

Every run starts by reporting which sources it found under the root
(`tools/atlantis/layout.json`, `tools/atlantis/catalog.js`, the schema
directory, `xmllint`) and why any are missing.

### Example

Run against the synthetic fixture in `test/fixtures/atlantis-fake` (all IDs
invented):

```
$ node bin/validate-normative.js --root test/fixtures/atlantis-fake --family coherence

Sources:
  layout   available  test/fixtures/atlantis-fake/tools/atlantis/layout.json
  catalog  available  test/fixtures/atlantis-fake/tools/atlantis/catalog.js
  schemas  MISSING    no schema directory (--schemas, $ATLANTIS_SCHEMAS, reference/schemas/)
  xmllint  MISSING    xmllint not on PATH (install libxml2-utils / libxml2)

Findings:
  ST3_F_3GHApp_902
    [note] V-COH-001 ST3_F_3GHApp_902 not started: no folder at applications/st3-f-3ghapp-902/
      source: v1.1 catalogue
  ST3_F_3GHApp_901
    [should-fix] V-COH-003 README follows G901 group document v1.0, catalogue sources have v1.1
      source: decision of 2026-09-30
    [should-fix] V-COH-004 open escalation E91 affects ST3_F_TC_901_001 but the README does not record it as a risk
      source: decision of 2026-09-14
  ST3_OPT_901
    [blocking] V-COH-006 retired identifier ST3_OPT_901 is used — applications/st3-f-3ghapp-901/js/app.js line 2
      source: project principle
  …

Summary: 1 blocking, 8 should-fix, 1 note, 14 passed, 0 skipped — 6 checks in coherence
```

### Finding format

```json
{
  "check": "V-XML-004",
  "severity": "blocking",
  "artifact": "ST3_BALD_032",
  "path": "xmls/bald/st3-bald-032.xml",
  "location": "line 42, @appType",
  "message": "appType \"TV30-Ginga-HTML5\" is not in the value domain of the standard",
  "source": "ABNT NBR 25608:2025, 10.1 (to confirm)",
  "evidence": "allowed: <list read from the XSD enumeration>"
}
```

`(to confirm)` marks clause references taken from repository documentation
rather than verified against the standard itself.

## Check families

| Family | Scope | Checks | Milestone |
|---|---|---|---|
| `xml` | BALD, BAMT, PRRD, ESG, AEAT signalling | V-XML-001..012 | v0.1 ✓ |
| `manifest` | BTDS Annex B manifests and `cards.json` | V-MAN-001..006 | v0.1 ✓ |
| `coherence` | Cross-artifact consistency with the catalogue | V-COH-001..006 | v0.1 ✓ |
| `media` | Media assets in `assets/` (catalogued IDs, content vs extension, kind vs folder, stream content) | V-MED-001..004 | v0.2 ✓ |
| `app` | Test applications, API usage vs. Annexes C/D | V-APP-001..011 | v0.2 |
| `module` | Common modules vs Manual §6.5.5 | V-MOD-001..003 | v0.2 (001..002 ✓; 003 needs API index) |
| `pcap` | PCAP/TS streams | — (always `skipped`) | deferred |

## Normative sources

The standard and its XSDs are protected documents and are **never committed**.
Place them outside version control:

```
reference/                      # gitignored
  nbr-25608-2025.pdf
  schemas/*.xsd
```

Schema directory resolution: `--schemas <dir>` → `$ATLANTIS_SCHEMAS` →
`reference/schemas/` → skip with reason.

Annex B manifests are validated by a built-in JSON Schema (2020-12) subset
covering exactly the keywords the Annex B schemas use; a schema with any other
keyword makes V-MAN-001 report `skipped`, never pass.

HSTREAM assets (V-MED-004) are checked against the requirement written in
their catalogue description, read from `--root` at run time: generic phrases
("at least two audio languages", "HLS content", "invalid manifest", …) map to
checks on the DASH/HLS manifest. Descriptions no manifest can prove (dialogue
enhancement, ratings, preference-dependent tracks, external URLs) report
`skipped` with the description as the reason. Segments are not decoded.

XSD validation shells out to `xmllint` (libxml2) when it is on `PATH`;
otherwise schema checks report `skipped` with an install hint.

## Development

```
npm test        # node --test, no framework
```

Layout:

| Path | Role |
|---|---|
| `bin/validate-normative.js` | CLI entry |
| `lib/catalogue.js` | check catalogue: id, family, severity, source clause |
| `lib/families/` | one module per family; a missing module falls back to a stub that skips |
| `lib/atlantis.js` | loads AtlantisPB's own `catalog.js`, `layout.js`, `lib/ids.js` from `--root` |
| `lib/xml.js`, `lib/header.js` | minimal XML reader + xmllint wrapper; signalling header parser |
| `lib/jsonschema.js` | JSON Schema 2020-12 subset used by Annex B |
| `lib/normative/namespaces.js` | expected namespaces / XSD names per XML type (to confirm) |
| `lib/{args,context,runner,report,finding}.js` | CLI plumbing and result model |

Test fixtures are synthetic. AtlantisPB is private; never copy its content
here.

Planning artifacts live in `.paul/`.

## License

TBD.
