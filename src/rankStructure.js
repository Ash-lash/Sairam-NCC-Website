export const armyRankOrder = [
  'SUO',
  'CUO',
  'CSM',
  'CQMS',
  'SGT',
  'CPL',
  'LCPL',
  'CDT',
  'Unranked',
];

export const navyRankOrder = [
  'SCC',
  'CC',
  'POC',
  'LC',
  'NC 1',
  'NC',
  'Unranked',
];

export const airForceRankOrder = [
  'CSUO',
  'CUO',
  'CWO',
  'CSGT',
  'CCPL',
  'LFC',
  'FC',
  'Unranked',
];

export const rankFullForms = {
  // Army
  'SUO': 'Senior Under Officer',
  'CUO': 'Cadet Under Officer',
  'CSM': 'Company Sergeant Major',
  'CQMS': 'Company Quarter Master Sergeant',
  'SGT': 'Sergeant',
  'CPL': 'Corporal',
  'LCPL': 'Lance Corporal',
  'CDT': 'Cadet',
  // Navy
  'SCC': 'Senior Cadet Captain',
  'CC': 'Cadet Captain',
  'POC': 'Petty Officer Cadet',
  'LC': 'Leading Cadet',
  'NC 1': 'Naval Cadet 1',
  'NC': 'Naval Cadet',
  // Air Force
  'CSUO': 'Cadet Senior Under Officer',
  'CWO': 'Cadet Warrant Officer',
  'CSGT': 'Cadet Sergeant',
  'CCPL': 'Cadet Corporal',
  'LFC': 'Leading Flight Cadet',
  'FC': 'Flight Cadet',
  // Shared/Common
  'Unranked': 'Unranked Cadet'
};

export const getFullRank = (rank) => {
  const normalized = rank?.trim().toUpperCase() || '';
  const fullForm = rankFullForms[normalized];
  return fullForm ? `${fullForm} (${normalized})` : rank;
};

export const normalizeRank = (rankLabel = '') => {
  const label = rankLabel.trim().toUpperCase();
  // If it's already a shorthand, return it
  if (rankFullForms[label]) return label;
  
  // Try to find the shorthand from the full name
  for (const [shorthand, fullName] of Object.entries(rankFullForms)) {
    if (label === fullName.toUpperCase() || label === `${fullName.toUpperCase()} (${shorthand})`) {
      return shorthand;
    }
  }
  
  // Try partial match if it contains the shorthand in parentheses
  const match = label.match(/\(([^)]+)\)/);
  if (match && rankFullForms[match[1]]) return match[1];

  return label;
};