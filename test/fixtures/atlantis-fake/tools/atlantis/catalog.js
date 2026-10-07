// Synthetic catalogue: invented artifacts only.
const ARTIFACTS = [
  { id: 'ST3_BALD_901', type: 'BALD', cases: ['ST3_F_TC_901_001'] },
  { id: 'ST3_BALD_902', type: 'BALD', cases: ['ST3_F_TC_901_002'] },
  { id: 'ST3_BALD_903', type: 'BALD', cases: ['ST3_F_TC_901_003'] },
  { id: 'ST3_BALD_905', type: 'BALD', cases: ['ST3_F_TC_901_005'] },
  { id: 'ST3_BALD_906', type: 'BALD', cases: ['ST3_F_TC_901_006', 'ST3_F_TC_901_007'] },
  { id: 'ST3_BALD_907', type: 'BALD', cases: ['ST3_F_TC_901_008'] },
  { id: 'ST3_BALD_908', type: 'BALD', cases: ['ST3_F_TC_901_008'] },
  { id: 'ST3_BALD_909', type: 'BALD', cases: ['ST3_F_TC_901_008'] },
  { id: 'ST3_F_3GHApp_901', type: 'F_3GHApp', cases: ['ST3_F_TC_901_001', 'ST3_F_TC_901_002'], groups: ['ST3_F_G_901'] },
  { id: 'ST3_F_3GNApp_901', type: 'F_3GNApp', cases: ['ST3_F_TC_901_020'], groups: ['ST3_F_G_901'] },
  { id: 'ST3_F_3GNApp_902', type: 'F_3GNApp', cases: ['ST3_F_TC_901_021'], groups: ['ST3_F_G_901'] },
  { id: 'ST3_F_3GHApp_902', type: 'F_3GHApp', cases: ['ST3_F_TC_901_010'], groups: ['ST3_F_G_901'] },
  { id: 'ST3_F_3GHApp_902_SCRIPT', type: 'F_3GHApp', cases: ['ST3_F_TC_901_010'], groups: ['ST3_F_G_901'] },
  { id: 'ST3_F_PCAP_901', type: 'F_PCAP', cases: ['ST3_F_TC_901_001', 'ST3_F_TC_901_002', 'ST3_F_TC_902_001'] },
  { id: 'ST3_F_PCAP_902', type: 'F_PCAP', cases: ['ST3_F_TC_901_003', 'ST3_F_TC_901_004'] },
  { id: 'ST3_HSTREAM_901', type: 'HSTREAM', cases: ['ST3_F_TC_901_001'], description: 'ST3_HSTREAM_901 (content offering at least two audio languages)' },
  { id: 'ST3_HSTREAM_903', type: 'HSTREAM', cases: ['ST3_F_TC_901_001'], description: 'ST3_HSTREAM_903 (HLS content)' },
  { id: 'ST3_HSTREAM_904', type: 'HSTREAM', cases: ['ST3_F_TC_901_001'], description: 'ST3_HSTREAM_904 (invalid manifest / unavailable)' },
  { id: 'ST3_HSTREAM_905', type: 'HSTREAM', cases: ['ST3_F_TC_901_001'], description: 'ST3_HSTREAM_905 (content supporting dialogue enhancement)' },
  { id: 'ST3_HSTREAM_902', type: 'HSTREAM', cases: ['ST3_F_TC_903_001'] },
  { id: 'ST3_AUDIO_901', type: 'AUDIO', cases: ['ST3_F_TC_901_002'] },
  { id: 'ST3_PRRD_901', type: 'PRRD', cases: ['ST3_F_TC_901_001'] },
  { id: 'ST3_ESG_SERVICE_901', type: 'ESG', cases: ['ST3_F_TC_901_009'] },
];
const ESCALATIONS = { ST3_F_TC_901_001: ['E91'], ST3_F_TC_901_002: ['E92'] };
const map = new Map(ARTIFACTS.map((a) => [a.id, a]));
const CASES = new Map();
for (const a of ARTIFACTS) {
  for (const c of a.cases) {
    if (!CASES.has(c)) CASES.set(c, { id: c, group: `ST3_F_G_${c.slice(9, 12)}`, artifacts: [], escalations: ESCALATIONS[c] || [] });
    CASES.get(c).artifacts.push({ id: a.id, type: a.type });
  }
}
const findCase = (id) => CASES.get(id) || null;
const RAW = {
  artifact_index: ARTIFACTS,
  escalation_status: [
    { code: 'E91', open: true, groups: ['ST3_F_G_901'] },
    { code: 'E92', open: false, groups: ['ST3_F_G_901'] },
  ],
  retired_declarations: ['ST3_OPT_901'],
};
const load = () => ({ artifacts: map, raw: RAW });
const sources = () => ({ groups: [{ id: 'ST3_F_G_901', version: '1.1' }] });
const findArtifact = (id) => map.get(id) || null;
const requireArtifact = (id) => {
  const a = findArtifact(id);
  if (!a) throw new Error(`Unknown artifact ${id}`);
  return a;
};
module.exports = { load, findArtifact, requireArtifact, findCase, sources };
