# tv30val — Normative Artifact Validator

A dependency-free Node 18+ checker for the TV 3.0 test-suite artifacts of
[AtlantisPB](https://github.com/AtlantisTV3PB/AtlantisPB). It answers one
question per artifact:

> **Does this artifact conform to what ABNT NBR 25608:2025 and the GT-ST
> Manual require of it?**

It complements the existing form checks in `tools/atlantis/` (coding standard,
repository structure, README structure, catalogue IDs, evidence shape). It does
not replace them.

> **Status:** v0.0 — under construction. Proposal, not yet adopted by the team.
> Advisory only; not part of any PR gate.

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

## Usage (planned)

```
node validate-normative.js [target …] [options]

  target            artifact ID (ST3_F_3GHApp_009, ST3_BALD_032), a path,
                    or omitted for everything the layout governs
  --family <f>      xml | app | module | manifest | coherence | pcap  (repeatable)
  --schemas <dir>   XSD directory
  --severity <s>    minimum severity to report (default: note)
  --json            machine-readable output
  --list-checks     print the check catalogue with clauses and exit
```

Exit codes: `0` no blocking finding · `1` at least one blocking finding ·
`2` the tool could not run. `skipped` never changes the exit code.

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
| `xml` | BALD, BAMT, PRRD, ESG, AEAT signalling | V-XML-001..012 | v0.1 |
| `manifest` | BTDS Annex B manifests and `cards.json` | V-MAN-001..006 | v0.1 |
| `coherence` | Cross-artifact consistency with the catalogue | V-COH-001..006 | v0.1 |
| `app` | Test applications, API usage vs. Annexes C/D | V-APP-001..011 | v0.2 |
| `module` | Common modules | V-MOD-001..003 | v0.2 |
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

XSD validation shells out to `xmllint` (libxml2) when it is on `PATH`;
otherwise schema checks report `skipped` with an install hint.

## Development

```
npm test        # node --test, no framework
```

Planning artifacts live in `.paul/`.

## License

TBD.
