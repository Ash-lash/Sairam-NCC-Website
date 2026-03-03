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
  const fullForm = rankFullForms[rank];
  return fullForm ? `${fullForm} (${rank})` : rank;
};