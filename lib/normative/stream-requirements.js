'use strict';

// Rules that turn the requirement stated in an HSTREAM's catalogue description
// into checks on its manifest. The descriptions are read from the catalogue at
// run time; only generic phrase patterns live here. A description that matches
// no rule is reported as not machine-checkable — never as a pass.

const B43 = 'ABNT NBR 25608:2025, Annex B.4.3 (to confirm)';

const list = (set) => [...set].sort().join(', ') || 'none';

const RULES = [
  {
    id: 'audiovisual',
    pattern: /audio and visual reference|audiovisual content|media replacing/i,
    label: 'audio and video present',
    test: (s) => (s.hasAudio && s.hasVideo ? null : `audio: ${s.hasAudio ? 'yes' : 'no'}, video: ${s.hasVideo ? 'yes' : 'no'}`),
  },
  {
    id: 'audio-languages',
    pattern: /at least two audio languages/i,
    label: 'at least two audio languages',
    test: (s) => (s.audioLangs.size >= 2 ? null : `audio languages: ${list(s.audioLangs)}`),
  },
  {
    id: 'subtitle-languages',
    pattern: /subtitles in at least two languages/i,
    label: 'subtitles in at least two languages',
    test: (s) => (s.subtitleLangs.size >= 2 ? null : `subtitle languages: ${list(s.subtitleLangs)}`),
  },
  {
    id: 'sign-language',
    pattern: /sign[- ]language/i,
    label: 'a sign-language track',
    test: (s) => (s.accessibility.has('sign') ? null : `accessibility tracks: ${list(s.accessibility)}`),
  },
  {
    id: 'audio-description',
    pattern: /audio[- ]description/i,
    label: 'an audio-description track',
    test: (s) => (s.accessibility.has('description') ? null : `accessibility tracks: ${list(s.accessibility)}`),
  },
  {
    id: 'dash-multi',
    pattern: /DASH content with multiple representations/i,
    label: 'DASH with at least two representations',
    test: (s) => (s.kind === 'dash' && s.representations >= 2 ? null : `${s.kind.toUpperCase()}, ${s.representations} representation(s)`),
  },
  {
    id: 'hls',
    pattern: /\bHLS content\b/i,
    label: 'an HLS manifest',
    test: (s) => (s.kind === 'hls' ? null : `manifest is ${s.kind.toUpperCase()}`),
  },
];

// Requirements that a manifest cannot show.
const NOT_CHECKABLE = [
  /dialogue enhancement/i,
  /configured preferences/i,
  /rating/i,
  /^\s*URL\b/i,
];

const INVALID = /invalid manifest/i;

function rulesFor(description) {
  const text = String(description || '').trim();
  if (INVALID.test(text)) return { expectInvalid: true, rules: [], source: B43 };
  if (!text || NOT_CHECKABLE.some((re) => re.test(text))) return { notCheckable: text || '(no description)' };
  const rules = RULES.filter((r) => r.pattern.test(text));
  if (!rules.length) return { notCheckable: text };
  return { rules, source: B43 };
}

module.exports = { rulesFor, RULES };
