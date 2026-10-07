'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { checksForFamily } = require('../catalogue');
const { finding, skipped, passed } = require('../finding');
const { loadAtlantis } = require('../atlantis');
const MANUAL_MODULES = require('../normative/modules');

// Not in layout.json; the team's decision record lives here.
const DECISIONS = 'docs/project/decisions.md';
const CODE_EXT = new Set(['.js', '.lua', '.css', '.html', '.ncl']);
const ADDITION = /\b(additional|addition|team module|not one of)\b/i;
const DEVIATION = /\b(no|not|cancel\w*|deviation)\b/i;
const ID_PATTERN = /\bST3_[A-Za-z0-9_]+\b/g;

const posix = (p) => p.split(path.sep).join('/');

function preset(ctx) {
  const l = ctx.layout;
  return l && l.presets && l.presets[l.preset] ? l.presets[l.preset] : {};
}

function emit(check, artifact, rel, results) {
  if (results === null) return [];
  if (results.some((r) => r.status === 'skipped')) return results;
  return results.length ? results : [passed(check, { artifact, path: rel })];
}

function modulesDir(ctx) {
  const tpl = preset(ctx).module;
  return tpl ? path.posix.dirname(tpl) : 'common/modules';
}

function listDirs(abs) {
  try {
    return fs.readdirSync(abs, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  } catch {
    return [];
  }
}

// Kebab folder → PascalCase name, from layout.json modules or the Manual list.
function nameOf(ctx, kebab) {
  const map = (ctx.layout && ctx.layout.modules) || {};
  const fromLayout = Object.entries(map).find(([, v]) => v && v.manual === kebab);
  if (fromLayout) return fromLayout[0];
  const manual = MANUAL_MODULES.find((m) => m.kebab === kebab);
  return manual ? manual.name : kebab;
}

// Paragraphs of decisions.md mentioning a module by name or folder. Decisions
// wrap across lines, so a declaration is judged per paragraph, not per line.
function mentions(lines, name, kebab) {
  const re = new RegExp(`\\b(${name}|${kebab.replace(/-/g, '[- ]')})\\b`, 'i');
  return lines.filter((l) => re.test(l));
}

function checkSet(ctx, dir, present, decisions) {
  const out = [];
  const lines = decisions === null ? null : decisions.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' '));
  const f = (severity, artifact, rel, message, evidence) => finding({ check: 'V-MOD-001', severity, artifact, path: rel, message, evidence });
  const passes = [];

  for (const m of MANUAL_MODULES) {
    const rel = `${dir}/${m.kebab}`;
    if (present.includes(m.kebab)) {
      if (!m.ncl && fs.existsSync(path.join(ctx.root, rel, 'lua'))) {
        out.push(f('should-fix', m.name, `${rel}/lua`, `${m.name} has a lua/ folder, but the Manual says it does not apply to Ginga-NCL`));
      } else {
        passes.push(passed('V-MOD-001', { artifact: m.name, path: rel }));
      }
      continue;
    }
    const declared = lines && mentions(lines, m.name, m.kebab).find((l) => DEVIATION.test(l));
    if (declared) {
      out.push(f('note', m.name, rel, `${m.name} (Manual §6.5.5) is absent — recorded deviation`, `${DECISIONS}: "${declared.trim().slice(0, 140)}"`));
    } else {
      out.push(f('should-fix', m.name, rel, `${m.name} (Manual §6.5.5) is absent and no deviation is recorded`, lines ? `no line in ${DECISIONS} records it` : `no ${DECISIONS}`));
    }
  }

  for (const kebab of present.filter((k) => !MANUAL_MODULES.some((m) => m.kebab === k))) {
    const name = nameOf(ctx, kebab);
    const rel = `${dir}/${kebab}`;
    const declared = lines && mentions(lines, name, kebab).find((l) => ADDITION.test(l));
    if (declared) passes.push(passed('V-MOD-001', { artifact: name, path: rel }));
    else out.push(f('should-fix', name, rel, `${name} is not a Manual §6.5.5 module and is not declared as a team addition`, lines ? `no line in ${DECISIONS} declares it` : `no ${DECISIONS}`));
  }
  return [...out, ...passes];
}

function* walk(abs, rel) {
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const r = `${rel}/${e.name}`;
    if (e.isDirectory()) yield* walk(path.join(abs, e.name), r);
    else if (e.isFile()) yield { abs: path.join(abs, e.name), rel: r };
  }
}

function checkCode(ctx, dir, kebab, atl) {
  const name = nameOf(ctx, kebab);
  const rel = `${dir}/${kebab}`;
  const appRoots = (preset(ctx).appRoots || ['applications/*', 'applications-staging/*']).map((r) => r.replace(/\/\*$/, ''));
  const appPath = new RegExp(`(^|[\\s'"(/.])(${appRoots.map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})/`);
  const out = [];
  for (const file of walk(path.join(ctx.root, rel), rel)) {
    if (!CODE_EXT.has(path.extname(file.rel).toLowerCase())) continue;
    const lines = fs.readFileSync(file.abs, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const ids = atl.ok && atl.ids.extractIds ? atl.ids.extractIds(line) : line.match(ID_PATTERN) || [];
      for (const id of new Set(ids)) {
        out.push(finding({ check: 'V-MOD-002', artifact: name, path: posix(file.rel), location: `line ${i + 1}`, message: `suite identifier ${id} in module code ties ${name} to specific cases or applications` }));
      }
      if (appPath.test(line)) {
        out.push(finding({ check: 'V-MOD-002', artifact: name, path: posix(file.rel), location: `line ${i + 1}`, message: `${name} refers to an application path` }));
      }
    });
  }
  return out;
}

function run(ctx, targets = []) {
  const dir = modulesDir(ctx);
  const present = listDirs(path.join(ctx.root, dir));
  if (!present.length) return checksForFamily('module').map((ch) => skipped(ch.id, `no common modules under ${dir}/`));
  const atl = loadAtlantis(ctx.root);
  const decisionsAbs = path.join(ctx.root, DECISIONS);
  const decisions = fs.existsSync(decisionsAbs) ? fs.readFileSync(decisionsAbs, 'utf8') : null;

  const inScope = (kebab, name) =>
    !targets.length ||
    targets.some((t) => (t.kind === 'path' ? `${dir}/${kebab}`.startsWith(t.value.replace(/\/$/, '')) || t.value === '.' || dir.startsWith(t.value.replace(/\/$/, '')) : t.value === name || t.value === kebab));

  const results = [];
  for (const r of checkSet(ctx, dir, present, decisions)) {
    if (inScope((r.path || '').split('/').slice(-1)[0], r.artifact)) results.push(r);
  }
  for (const kebab of present) {
    const name = nameOf(ctx, kebab);
    if (!inScope(kebab, name)) continue;
    results.push(...emit('V-MOD-002', name, `${dir}/${kebab}`, checkCode(ctx, dir, kebab, atl)));
  }
  results.push(skipped('V-MOD-003', 'needs the API index (v0.2 Phase 7)'));
  return results;
}

module.exports = { run };
