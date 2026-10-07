// Synthetic catalogue: invented artifacts only.
const ARTIFACTS = [
  { id: 'ST3_BALD_901', type: 'BALD', cases: ['ST3_F_TC_901_001'] },
  { id: 'ST3_BALD_902', type: 'BALD', cases: ['ST3_F_TC_901_002'] },
  { id: 'ST3_BALD_903', type: 'BALD', cases: ['ST3_F_TC_901_003'] },
  { id: 'ST3_BALD_905', type: 'BALD', cases: ['ST3_F_TC_901_005'] },
  { id: 'ST3_PRRD_901', type: 'PRRD', cases: ['ST3_F_TC_901_001'] },
  { id: 'ST3_ESG_SERVICE_901', type: 'ESG', cases: ['ST3_F_TC_901_009'] },
];
const map = new Map(ARTIFACTS.map((a) => [a.id, a]));
const load = () => ({ artifacts: map });
const findArtifact = (id) => map.get(id) || null;
const requireArtifact = (id) => {
  const a = findArtifact(id);
  if (!a) throw new Error(`Unknown artifact ${id}`);
  return a;
};
module.exports = { load, findArtifact, requireArtifact };
