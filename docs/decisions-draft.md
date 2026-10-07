# Draft entry for `docs/project/decisions.md`

> Proposal for the team, not a recorded decision. Paste and adapt once the
> coordinators agree. Language follows the repository rule (files in English).

---

## 2026-10-07 — Normative artifact validator (v0.1): dependencies, gating, open questions

**Context.** The normative validator proposed in the handoff of 2026-10-02
checks artifacts against what ABNT NBR 25608:2025 and the GT-ST Manual
require: XML signalling, BTDS Annex B manifests and cross-artifact coherence
with the v1.1 catalogue. Version 0.1 is available at
<https://github.com/dobidu/tv30val> and runs against a checkout of this
repository (`--root`).

**Decision 1 — no runtime dependencies.**

- XSD validation (V-XML-002, 004, 005) shells out to `xmllint` (libxml2) when
  it is on `PATH`. Without it, those checks report `skipped` with an install
  hint. Well-formedness (V-XML-001) falls back to a minimal built-in reader
  and says so in the finding.
- JSON Schema validation of the Annex B manifests (V-MAN-001) uses a built-in
  subset of draft 2020-12 covering exactly the keywords the Annex B schemas
  use today: `$defs`, `$ref` (local only), `type`, `properties`, `required`,
  `additionalProperties`, `items`, `enum`, `const`, `pattern`, `minLength`,
  `minItems`, `minimum`, `uniqueItems`, `allOf`, `if`, `then`. A schema that
  uses any other keyword makes V-MAN-001 report `skipped`, never pass.
- Consequence: no `libxmljs2` or `ajv`. Revisit if the Annex B schemas adopt
  keywords outside the subset (e.g. `oneOf`, `format`) or when the
  TypeScript/esbuild decision is made.

**Decision 2 — advisory only.** `check:normative` is not part of
`npm run check`, so it does not block pull requests. Proposal: gate on
`blocking` findings from v0.2, once the team has seen a few runs.

**Open question 1 — committing `api-index.json`.** The `app` and `module`
families (v0.2, V-APP-006, V-MOD-003) need an index of the Annex C and D APIs
(name, clause, parameters, return), generated once from the standard and
reviewed as a pull request. It holds API names and clause numbers, not
normative text. Can it be committed, or must it live in `reference/` with the
PDF? This blocks v0.2.

**Open question 2 — XSDs.** The BALD and PRRD XMLs record that they were never
validated against `BALD-1.0-202511.xsd` / `PRRD-1.0-202511.xsd`. Until the
XSDs are obtained (and placed in `reference/schemas/`, never committed),
V-XML-002, 004 and 005 stay skipped. The expected namespaces and XSD names
are marked "(to confirm)" against the standard.

**State at v0.1 (run of 2026-10-07).** 0 blocking findings. The should-fix
findings are the known `cards.json` divergence (filler folders whose cards are
still `proposed` without `builtIn`); the notes are formal applications not
started yet and one manifest that does not yet list another group's cases.
Every skip has a stated reason (no XSDs, no ESG documents yet, v0.2 families,
PCAP deferred).
