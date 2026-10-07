'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { sniff } = require('../lib/media');

const BIN = path.join(__dirname, '..', 'bin', 'validate-normative.js');
const FAKE = path.join(__dirname, 'fixtures', 'atlantis-fake');
const ASSETS = 'applications/st3-f-3ghapp-901/assets';

function run(root, extra = []) {
  const r = spawnSync(process.execPath, [BIN, '--root', root, '--family', 'media', '--json', ...extra], { encoding: 'utf8' });
  assert.notEqual(r.status, 2, r.stderr);
  return JSON.parse(r.stdout);
}

const J = run(FAKE);
const at = (check, rel, status = 'finding', j = J) => j.results.filter((r) => r.check === check && r.status === status && (r.path || r.reason || '').includes(rel));

test('sniffer recognises formats by their first bytes', () => {
  const B = (x) => Buffer.from(x);
  assert.equal(sniff(Buffer.concat([B([0x89]), B('PNG\r\n\x1a\n')])), 'png');
  assert.equal(sniff(B([0xff, 0xd8, 0xff, 0xe0])), 'jpeg');
  assert.equal(sniff(Buffer.concat([B([0, 0, 0, 0x18]), B('ftypisom')])), 'mp4');
  assert.equal(sniff(B('<?xml version="1.0"?><MPD xmlns="urn:mpeg:dash:schema:mpd:2011"/>')), 'mpd');
  assert.equal(sniff(B('#EXTM3U\n')), 'm3u8');
  assert.equal(sniff(B('WEBVTT\n')), 'vtt');
  assert.equal(sniff(B('wOF2....')), 'woff2');
  assert.equal(sniff(Buffer.concat([B('RIFF'), B([0, 0, 0, 0]), B('WAVE')])), 'wav');
  assert.equal(sniff(B([0, 1, 2, 3])), null);
  assert.equal(sniff(B([])), null);
});

test('catalogue gains the media family (43 checks)', () => {
  const r = spawnSync(process.execPath, [BIN, '--list-checks'], { encoding: 'utf8' });
  for (const id of ['V-MED-001', 'V-MED-002', 'V-MED-003', 'V-MED-004']) assert.match(r.stdout, new RegExp(`^${id} +media`, 'm'));
});

test('V-MED-001: media IDs must be catalogued and used by the app', () => {
  assert.match(at('V-MED-001', 'images/not-an-id.png')[0].message, /not named after a media ID/);
  assert.match(at('V-MED-001', 'st3-image-999.png')[0].message, /ST3_IMAGE_999 is not in the v1\.1 catalogue/);
  const [unused] = at('V-MED-001', 'st3-hstream-902.m3u8');
  assert.equal(unused.severity, 'should-fix');
  assert.match(unused.message, /no case of ST3_F_3GHApp_901 uses it/);
  assert.equal(at('V-MED-001', 'hstreams/st3-hstream-901', 'pass').length, 1, 'stream directory counts as one item');
  assert.equal(J.results.filter((r) => r.check === 'V-MED-001' && (r.path || '').includes('fonts/')).length, 0, 'fonts exempt');
});

test('V-MED-002: content must match the extension; unknown is a note; empty is blocking', () => {
  const [wrong] = at('V-MED-002', 'audios/st3-audio-901.mp3');
  assert.equal(wrong.severity, 'blocking');
  assert.match(wrong.message, /content is png but the extension is \.mp3/);
  assert.equal(at('V-MED-002', 'st3-image-999.png')[0].severity, 'note');
  assert.match(at('V-MED-002', 'texts/st3-audio-901.txt')[0].message, /empty file/);
  for (const rel of ['hstreams/st3-hstream-901/manifest.mpd', 'hstreams/st3-hstream-901/init.mp4', 'fonts/synthetic.woff2', 'images/not-an-id.png']) {
    assert.equal(at('V-MED-002', rel, 'pass').length, 1, rel);
  }
});

test('V-MED-003: media kind must fit its assets folder', () => {
  assert.match(at('V-MED-003', 'audios/st3-audio-901.mp3')[0].message, /an image file \(png\) in audios\//);
  assert.match(at('V-MED-003', 'videos/st3-audio-901.wav')[0].message, /an audio file \(wav\) in videos\//);
  assert.equal(at('V-MED-003', 'hstreams/st3-hstream-901/manifest.mpd', 'pass').length, 1);
});

test('artifact labels use catalogue IDs consistently', () => {
  const labels = new Set(J.results.filter((r) => r.status === 'finding' && (r.path || '').includes('st3-audio-901')).map((r) => r.artifact));
  assert.deepEqual([...labels], ['ST3_AUDIO_901']);
});

test('targets narrow; no media → all four skipped', () => {
  const j = run(FAKE, [`${ASSETS}/images`]);
  assert.ok(j.results.filter((r) => r.path).every((r) => r.path.includes('/images/')));
  const k = run(FAKE, ['ST3_HSTREAM_901']);
  assert.ok(k.results.filter((r) => r.path).every((r) => r.path.includes('st3-hstream-901')));
  const e = run(fs.mkdtempSync(path.join(os.tmpdir(), 'tv30val-')));
  assert.equal(e.results.length, 4);
  assert.ok(e.results.every((r) => r.status === 'skipped' && /no media assets/.test(r.reason)));
});
