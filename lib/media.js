'use strict';

// Magic-byte sniffer for media assets. Reads only the first bytes of a file
// and names the format; it does not decode or validate the media.

const startsWith = (buf, bytes, offset = 0) => bytes.every((b, i) => buf[offset + i] === b);
const ascii = (buf, start, end) => buf.subarray(start, end).toString('latin1');

function sniffText(buf) {
  const text = buf.subarray(0, 512).toString('utf8').replace(/^﻿/, '').trimStart();
  if (text.startsWith('#EXTM3U')) return 'm3u8';
  if (text.startsWith('WEBVTT')) return 'vtt';
  if (text.startsWith('<')) {
    if (/<svg[\s>]/i.test(text)) return 'svg';
    if (/<MPD[\s>]/.test(text)) return 'mpd';
    if (/<tt[\s>:]/.test(text)) return 'ttml';
    if (/^<!doctype html|<html[\s>]/i.test(text)) return 'html';
    return 'xml';
  }
  if (/^[{[]/.test(text)) return 'json';
  // Printable text without NULs.
  if (buf.length && !buf.subarray(0, 512).includes(0)) return 'txt';
  return null;
}

function sniff(buf) {
  if (!buf || !buf.length) return null;
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (ascii(buf, 0, 6) === 'GIF87a' || ascii(buf, 0, 6) === 'GIF89a') return 'gif';
  if (ascii(buf, 0, 2) === 'BM') return 'bmp';
  if (ascii(buf, 0, 4) === 'RIFF') {
    const kind = ascii(buf, 8, 12);
    if (kind === 'WEBP') return 'webp';
    if (kind === 'WAVE') return 'wav';
    if (kind === 'AVI ') return 'avi';
  }
  // ISO BMFF: size(4) + 'ftyp' | 'styp' | 'moof' | 'moov'
  const box = ascii(buf, 4, 8);
  if (['ftyp', 'styp', 'moof', 'moov', 'sidx'].includes(box)) {
    const brand = box === 'ftyp' ? ascii(buf, 8, 12) : '';
    if (/^M4A/.test(brand)) return 'm4a';
    if (/^qt/.test(brand)) return 'mov';
    return 'mp4';
  }
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) return 'webm';
  if (ascii(buf, 0, 4) === 'OggS') return 'ogg';
  if (ascii(buf, 0, 4) === 'fLaC') return 'flac';
  if (ascii(buf, 0, 3) === 'ID3') return 'mp3';
  if (buf[0] === 0xff && (buf[1] & 0xf6) === 0xf0) return 'aac'; // ADTS sync, layer 0
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return 'mp3'; // MPEG audio frame sync
  if (buf[0] === 0x47 && (buf.length < 189 || buf[188] === 0x47)) return 'ts';
  if (startsWith(buf, [0x00, 0x01, 0x00, 0x00]) || ascii(buf, 0, 4) === 'true') return 'ttf';
  if (ascii(buf, 0, 4) === 'OTTO') return 'otf';
  if (ascii(buf, 0, 4) === 'wOFF') return 'woff';
  if (ascii(buf, 0, 4) === 'wOF2') return 'woff2';
  return sniffText(buf);
}

module.exports = { sniff };
