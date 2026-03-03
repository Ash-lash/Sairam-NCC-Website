const WING_VALUE_MAP = {
  army: 'Army',
  'army-bty': 'Army',
  'army-battery': 'Army',
  'army-bn': 'Army BN',
  armybn: 'Army BN',
  'army-med': 'Army MED',
  armymed: 'Army MED',
  'army-medical': 'Army MED',
  navy: 'Navy',
  air: 'Air',
  airforce: 'Air',
  'air-force': 'Air',
};

const WING_ALIASES = {
  Army: ['Army', 'Army BTY', 'Army-bty', 'Army Battery'],
  'Army BN': ['Army BN', 'Army-bn', 'ArmyBN'],
  'Army MED': ['Army MED', 'Army-med', 'ArmyMED'],
  Navy: ['Navy'],
  Air: ['Air', 'Airforce', 'Air Force'],
};

const normalizeWingToken = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-');

export const toCanonicalWing = (wingValue = '') => {
  const token = normalizeWingToken(wingValue);
  return WING_VALUE_MAP[token] || wingValue?.toString().trim() || '';
};

export const getWingCandidates = (wingValue = '') => {
  const canonicalWing = toCanonicalWing(wingValue);
  const aliases = WING_ALIASES[canonicalWing] || [canonicalWing];
  return [...new Set(aliases.filter(Boolean))];
};
