'use strict';

// Common modules required by the GT-ST Manual v1.0 §6.5.5 (read from the
// Manual). Applications must use these instead of implementing the same
// resources internally. Folder names follow §6.5.7 (common/modules/<kebab>/).

module.exports = [
  { name: 'AudioVideoPlayer', kebab: 'audio-video-player', ncl: false }, // "not applicable to Ginga-NCL"
  { name: 'ButtonsBox', kebab: 'buttons-box', ncl: true },
  { name: 'GingaCCWebServices', kebab: 'ginga-cc-webservices', ncl: true },
  { name: 'InformationBox', kebab: 'information-box', ncl: true },
  { name: 'NotificationBar', kebab: 'notification-bar', ncl: true },
  { name: 'ResultsBox', kebab: 'results-box', ncl: true },
  { name: 'TV30WebServices', kebab: 'tv30-webservices', ncl: true },
];
