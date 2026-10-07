'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeMpd, summarizeHls } = require('../lib/streams');
const { rulesFor } = require('../lib/normative/stream-requirements');

const MPD = `<?xml version="1.0"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static">
  <Period>
    <AdaptationSet contentType="video" mimeType="video/mp4">
      <Representation id="v1" bandwidth="1000000"/>
      <Representation id="v2" bandwidth="3000000"/>
    </AdaptationSet>
    <AdaptationSet mimeType="audio/mp4" lang="pt-BR"><Representation id="a1"/></AdaptationSet>
    <AdaptationSet mimeType="audio/mp4" lang="en">
      <Accessibility schemeIdUri="urn:tva:metadata:cs:AudioPurposeCS:2007" value="1"/>
      <Representation id="a2"/>
    </AdaptationSet>
    <AdaptationSet mimeType="application/ttml+xml" lang="pt"><Representation id="s1"/></AdaptationSet>
    <AdaptationSet mimeType="text/vtt" lang="es"><Representation id="s2"/></AdaptationSet>
    <AdaptationSet contentType="video" mimeType="video/mp4">
      <Role schemeIdUri="urn:mpeg:dash:role:2011" value="sign"/>
      <Representation id="sl"/>
    </AdaptationSet>
  </Period>
</MPD>`;

const HLS = `#EXTM3U
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",LANGUAGE="pt",NAME="Português",DEFAULT=YES,URI="a-pt.m3u8"
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",LANGUAGE="en",NAME="English, described",CHARACTERISTICS="public.accessibility.describes-video",URI="a-en.m3u8"
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="sub",LANGUAGE="pt",NAME="PT",URI="s-pt.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1.4d401e,mp4a.40.2",AUDIO="aud",SUBTITLES="sub"
v360.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2400000,RESOLUTION=1280x720,CODECS="avc1.4d401f,mp4a.40.2",AUDIO="aud"
v720.m3u8
`;

test('MPD summary: languages, subtitles, accessibility, representations', () => {
  const s = summarizeMpd(MPD);
  assert.equal(s.valid, true);
  assert.deepEqual([...s.audioLangs].sort(), ['en', 'pt']);
  assert.deepEqual([...s.subtitleLangs].sort(), ['es', 'pt']);
  assert.ok(s.hasAudio && s.hasVideo);
  assert.equal(s.representations, 7);
  assert.deepEqual([...s.accessibility].sort(), ['description', 'sign']);
});

test('invalid MPDs', () => {
  assert.match(summarizeMpd('<MPD><Period></MPD>').error, /not well-formed/);
  assert.match(summarizeMpd('<?xml version="1.0"?><html/>').error, /not <MPD>/);
});

test('HLS master and media playlists', () => {
  const s = summarizeHls(HLS);
  assert.equal(s.valid, true);
  assert.equal(s.kind, 'hls');
  assert.deepEqual([...s.audioLangs].sort(), ['en', 'pt']);
  assert.deepEqual([...s.subtitleLangs], ['pt']);
  assert.ok(s.hasVideo && s.hasAudio);
  assert.equal(s.representations, 2);
  assert.ok(s.accessibility.has('description'));
  const media = summarizeHls('#EXTM3U\n#EXT-X-TARGETDURATION:6\n#EXTINF:6.0,\nseg1.ts\n');
  assert.equal(media.valid, true);
  assert.equal(media.representations, 1);
  assert.equal(summarizeHls('not a playlist').valid, false);
  assert.equal(summarizeHls('#EXTM3U\n#EXT-X-VERSION:3\n').valid, false);
});

test('requirement rules from catalogue-style descriptions', () => {
  const ids = (d) => (rulesFor(d).rules || []).map((r) => r.id);
  assert.deepEqual(ids('(content offering at least two audio languages)'), ['audio-languages']);
  assert.deepEqual(ids('(content offering subtitles in at least two languages)'), ['subtitle-languages']);
  assert.deepEqual(ids('(content providing a sign-language stream)'), ['sign-language']);
  assert.deepEqual(ids('(content providing an audio-description track)'), ['audio-description']);
  assert.deepEqual(ids('(DASH content with multiple representations)'), ['dash-multi']);
  assert.deepEqual(ids('(HLS content)'), ['hls']);
  assert.deepEqual(ids('(audiovisual content of an application, with its own audio and visual reference)'), ['audiovisual']);
  assert.equal(rulesFor('(invalid manifest / unavailable)').expectInvalid, true);
  for (const d of ['(content supporting dialogue enhancement)', '(content whose rating exceeds the limit)', '', 'URL (x)', '(something new)']) {
    assert.ok(rulesFor(d).notCheckable, `"${d}" must not be checkable`);
  }
  const s = summarizeMpd(MPD);
  for (const r of rulesFor('(content offering at least two audio languages)').rules) assert.equal(r.test(s), null);
  assert.match(rulesFor('(HLS content)').rules[0].test(s), /manifest is DASH/);
});
