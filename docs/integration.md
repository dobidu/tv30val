# Integration with AtlantisPB

tv30val is built as a standalone repository and validates an AtlantisPB
checkout from the outside. It only reads; it never writes to the checkout.

## Running against a checkout

```
git clone https://github.com/dobidu/tv30val
node tv30val/bin/validate-normative.js --root path/to/AtlantisPB
```

The tool loads AtlantisPB's own `tools/atlantis/catalog.js`,
`tools/atlantis/layout.js` and `tools/atlantis/lib/ids.js` from `--root`, so
identifiers and paths always come from the team's tooling. If they are
missing, the checks that need them report `skipped`.

Optional sources:

| Source | How | Without it |
|---|---|---|
| XSDs | found automatically in AtlantisPB's committed `docs/specs/abnt-nbr-25608-2025-complementary-files/` (per-type subfolders); override with `--schemas <dir>`, `$ATLANTIS_SCHEMAS` or `reference/schemas/` | V-XML-002, 004, 005 skipped |
| XSD validator | `xmllint` (`apt install libxml2-utils`), else Python `xmlschema` (`pip install xmlschema`; set `$ATLANTIS_PYTHON` to pick the interpreter) — the team's documented method | V-XML-002, 004, 005 and V-APP-012 (NCL) skipped; V-XML-001 uses the built-in reader |

Useful variants:

```
validate-normative --root … --family xml            # one family
validate-normative --root … ST3_BALD_032            # one artifact
validate-normative --root … --severity blocking     # only blocking findings (skips still listed)
validate-normative --root … --gate xml,manifest     # only these families fail the run
validate-normative --root … --json > report.json    # for CI or scripts
validate-normative --list-checks                    # catalogue with clauses
```

## Gating

Exit codes: `0` no gating blocking finding, `1` at least one, `2` the tool
could not run. By default every family gates. `--gate` narrows it:

```
validate-normative --root … --gate xml,manifest   # only these families fail the run
validate-normative --root … --gate none           # advisory: report everything, never exit 1
```

Gating findings are marked `[blocking, gate]` in the text report; `--json`
adds `gate` and `summary.gatingFindings`.

GitLab CI (advisory job plus a gated job):

```yaml
normative:
  image: node:20
  script:
    - git clone --depth 1 https://github.com/dobidu/tv30val /tmp/tv30val
    - node /tmp/tv30val/bin/validate-normative.js --root . --gate xml,manifest
  artifacts:
    when: always
    paths: [normative.json]
  after_script:
    - node /tmp/tv30val/bin/validate-normative.js --root . --gate none --json > normative.json || true
```

GitHub Actions:

```yaml
jobs:
  normative:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: sudo apt-get install -y libxml2-utils   # enables V-XML-002/004/005
      - run: git clone --depth 1 https://github.com/dobidu/tv30val /tmp/tv30val
      - run: node /tmp/tv30val/bin/validate-normative.js --root . --gate xml,manifest
```

## Vendoring into `tools/atlantis/` (if the team adopts it)

The handoff proposed `tools/atlantis/validate-normative.js` plus
`tools/atlantis/normative/`. Mapping:

| tv30val | AtlantisPB |
|---|---|
| `bin/validate-normative.js` | `tools/atlantis/validate-normative.js` |
| `lib/**` | `tools/atlantis/normative/**` |
| `test/*.test.js`, `test/fixtures/**` | `tools/atlantis/test/normative/**` |

When vendored, `lib/atlantis.js` can `require("./catalog")` etc. directly
instead of resolving them from `--root`, and `--root` defaults to the
repository root.

`package.json` script (not added to `npm run check`):

```json
"check:normative": "node tools/atlantis/validate-normative.js"
```

Row for `tools/atlantis/README.md`:

```
| `validate-normative.js` | Normative conformance of XML signalling, Annex B manifests and cross-artifact coherence (NBR 25608:2025, GT-ST Manual). Advisory; not in `npm run check`. | `npm run check:normative` |
```

`npm run check` lints only the Manual's code roots (`layout.json`
`codeRoots`), so vendored tool code does not affect it. Expect a style pass to
match the `tools/atlantis/` conventions (double quotes, section headers).

## Data boundary

AtlantisPB is private and tv30val is public.

- Test fixtures are synthetic (identifiers in the 9xx range), never copied
  from AtlantisPB.
- The standard and its XSDs are never committed anywhere (`reference/` is
  gitignored).
- Run reports against the real repository are not committed to tv30val.
