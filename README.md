# tv30val — Normative Artifact Validator

A dependency-free Node 18+ checker for the TV 3.0 test-suite artifacts of
[AtlantisPB](https://github.com/AtlantisTV3PB/AtlantisPB). It answers one
question per artifact:

> **Does this artifact conform to what ABNT NBR 25608:2025 and the GT-ST
> Manual require of it?**

It complements the existing form checks in `tools/atlantis/` (coding standard,
repository structure, README structure, catalogue IDs, evidence shape). It does
not replace them.

> **Status:** v0.1 in progress — CLI, catalogue and skip semantics work;
> the `xml` family (V-XML-001..012) is complete. Other families report
> `skipped` until implemented. Proposal, not yet
> adopted by the team. Advisory only; not part of any PR gate.

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
  --family <f>      xml | app | module | manifest | coherence | pcap  (repeatable)
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

Layout: `bin/validate-normative.js` (entry), `lib/catalogue.js` (check
catalogue with clauses), `lib/families/` (one module per family; missing
modules fall back to a stub that skips), `lib/{args,context,runner,report,finding}.js`.

Planning artifacts live in `.paul/`.

## License

TBD.
