'use strict';

// Media formats, their accepted extensions and the assets folder each kind
// belongs in. The folder semantics come from the GT-ST Manual §6.5.7
// (assets/{audios,fonts,hstreams,images,texts,videos}); WHICH formats are
// allowed for each kind is not recorded in the repository documentation and
// must be confirmed against ABNT NBR 25608:2025. Formats outside this table are
// reported as notes, never as blocking findings.

const FORMATS = {
  png: { kind: 'image', ext: ['png'] },
  jpeg: { kind: 'image', ext: ['jpg', 'jpeg'] },
  gif: { kind: 'image', ext: ['gif'] },
  webp: { kind: 'image', ext: ['webp'] },
  svg: { kind: 'image', ext: ['svg'] },
  bmp: { kind: 'image', ext: ['bmp'] },
  mp3: { kind: 'audio', ext: ['mp3'] },
  aac: { kind: 'audio', ext: ['aac'] },
  m4a: { kind: 'audio', ext: ['m4a', 'mp4'] },
  wav: { kind: 'audio', ext: ['wav'] },
  flac: { kind: 'audio', ext: ['flac'] },
  ogg: { kind: 'audio-video', ext: ['ogg', 'oga', 'ogv', 'opus'] },
  mp4: { kind: 'video', ext: ['mp4', 'm4v', 'm4s', 'm4a', 'cmfv', 'cmfa', 'mov'] },
  mov: { kind: 'video', ext: ['mov', 'mp4'] },
  webm: { kind: 'video', ext: ['webm', 'mkv'] },
  avi: { kind: 'video', ext: ['avi'] },
  ts: { kind: 'video', ext: ['ts'] },
  mpd: { kind: 'stream-manifest', ext: ['mpd'] },
  m3u8: { kind: 'stream-manifest', ext: ['m3u8', 'm3u'] },
  vtt: { kind: 'subtitle', ext: ['vtt'] },
  ttml: { kind: 'subtitle', ext: ['ttml', 'xml', 'dfxp'] },
  ttf: { kind: 'font', ext: ['ttf'] },
  otf: { kind: 'font', ext: ['otf'] },
  woff: { kind: 'font', ext: ['woff'] },
  woff2: { kind: 'font', ext: ['woff2'] },
  txt: { kind: 'text', ext: ['txt', 'srt', 'json', 'csv', 'md'] },
  json: { kind: 'text', ext: ['json'] },
  xml: { kind: 'text', ext: ['xml'] },
  html: { kind: 'text', ext: ['html', 'htm'] },
};

const FOLDERS = {
  images: ['image'],
  audios: ['audio', 'audio-video'],
  videos: ['video', 'audio-video'],
  hstreams: ['stream-manifest', 'video', 'audio', 'audio-video', 'subtitle'],
  texts: ['text', 'subtitle'],
  fonts: ['font'],
};

module.exports = { FORMATS, FOLDERS, SOURCE: 'GT-ST Manual §6.5.7 asset folders; formats to confirm against ABNT NBR 25608:2025' };
