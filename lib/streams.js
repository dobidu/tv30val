'use strict';

// Summaries of DASH (MPD) and HLS (m3u8) manifests: what a stream offers, as
// declared by its manifest. Segments are not read.

const { parse } = require('./xml');

const SUBTITLE_MIME = /^(text\/|application\/(ttml\+xml|mp4.*stpp|x-subrip))|stpp|wvtt|vtt/i;
// DVB / TV-Anytime accessibility signalling.
const AUDIO_PURPOSE = 'urn:tva:metadata:cs:AudioPurposeCS:2007';

function emptySummary(kind) {
  return {
    kind,
    valid: true,
    error: null,
    audioLangs: new Set(),
    subtitleLangs: new Set(),
    hasAudio: false,
    hasVideo: false,
    representations: 0,
    accessibility: new Set(),
  };
}

const lang = (v) => (v ? String(v).trim().toLowerCase().split(/[-_]/)[0] : null);

function summarizeMpd(text) {
  const s = emptySummary('dash');
  const doc = parse(text);
  if (!doc.ok) return { ...s, valid: false, error: `not well-formed: ${doc.error.message} (line ${doc.error.line})` };
  if (doc.root.local !== 'MPD') return { ...s, valid: false, error: `root element is <${doc.root.local}>, not <MPD>` };

  const els = doc.elements;
  const childrenOf = (idx) => els.filter((e) => e.parent === idx);
  const attr = (e, n) => (e.attrs[n] ? e.attrs[n].value : null);

  for (const set of els.filter((e) => e.local === 'AdaptationSet')) {
    const reps = childrenOf(set.index).filter((e) => e.local === 'Representation');
    s.representations += reps.length;
    const mime = attr(set, 'mimeType') || (reps[0] && attr(reps[0], 'mimeType')) || '';
    const codecs = attr(set, 'codecs') || (reps[0] && attr(reps[0], 'codecs')) || '';
    let type = attr(set, 'contentType');
    if (!type) {
      if (SUBTITLE_MIME.test(mime) || SUBTITLE_MIME.test(codecs)) type = 'text';
      else type = mime.split('/')[0] || null;
    }
    const l = lang(attr(set, 'lang'));
    if (type === 'audio') {
      s.hasAudio = true;
      if (l) s.audioLangs.add(l);
    } else if (type === 'video') {
      s.hasVideo = true;
    } else if (type === 'text' || type === 'application') {
      if (l) s.subtitleLangs.add(l);
    }
    for (const d of childrenOf(set.index).filter((e) => e.local === 'Role' || e.local === 'Accessibility')) {
      const scheme = attr(d, 'schemeIdUri') || '';
      const value = (attr(d, 'value') || '').toLowerCase();
      if (value === 'sign') s.accessibility.add('sign');
      if (value === 'description' || (scheme === AUDIO_PURPOSE && value === '1')) s.accessibility.add('description');
    }
  }
  return s;
}

// HLS attribute list: KEY=VALUE,KEY="quoted, with commas"
function attrList(str) {
  const out = {};
  const re = /([A-Z0-9-]+)=("([^"]*)"|[^,]*)/g;
  let m;
  while ((m = re.exec(str))) out[m[1]] = m[3] !== undefined ? m[3] : m[2];
  return out;
}

function summarizeHls(text) {
  const s = emptySummary('hls');
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).map((l) => l.trim());
  if (lines[0] !== '#EXTM3U') return { ...s, valid: false, error: 'first line is not #EXTM3U' };

  let variants = 0;
  let segments = 0;
  for (const line of lines) {
    if (line.startsWith('#EXT-X-MEDIA:')) {
      const a = attrList(line.slice('#EXT-X-MEDIA:'.length));
      const l = lang(a.LANGUAGE);
      if (a.TYPE === 'AUDIO') {
        s.hasAudio = true;
        if (l) s.audioLangs.add(l);
      } else if (a.TYPE === 'SUBTITLES' || a.TYPE === 'CLOSED-CAPTIONS') {
        if (l) s.subtitleLangs.add(l);
      } else if (a.TYPE === 'VIDEO') {
        s.hasVideo = true;
      }
      const ch = (a.CHARACTERISTICS || '').toLowerCase();
      if (ch.includes('public.accessibility.describes-video')) s.accessibility.add('description');
      if (/sign/i.test(a.NAME || '') || ch.includes('sign')) s.accessibility.add('sign');
    } else if (line.startsWith('#EXT-X-STREAM-INF:')) {
      variants += 1;
      const a = attrList(line.slice('#EXT-X-STREAM-INF:'.length));
      if (a.RESOLUTION || /avc1|hvc1|hev1|av01|vp09/i.test(a.CODECS || '')) s.hasVideo = true;
      if (/mp4a|ac-3|ec-3|opus|mhm1|mha1/i.test(a.CODECS || '')) s.hasAudio = true;
    } else if (line.startsWith('#EXTINF')) {
      segments += 1;
    }
  }
  if (!variants && !segments) return { ...s, valid: false, error: 'neither variant streams (#EXT-X-STREAM-INF) nor segments (#EXTINF)' };
  s.representations = variants || 1;
  return s;
}

function summarize(name, text) {
  return /\.mpd$/i.test(name) ? summarizeMpd(text) : summarizeHls(text);
}

module.exports = { summarize, summarizeMpd, summarizeHls };
