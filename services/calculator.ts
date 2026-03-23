
import { 
  TripType, 
  TRIP_MULTIPLIERS, 
  UrbanRate, 
  InterurbanRate, 
  ComunaMapping,
  CalculationResult
} from '../types';
import { URBAN_RATES, INTERURBAN_RATES, COMUNAS_DATA } from '../constants';

const romanToNumber = (text: string): string => {
  const map: Record<string, string> = { 'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5' };
  return map[text] || text;
};

export const normalizeSector = (val: any): string => {
  if (val === null || val === undefined) return '';
  let str = String(val).toUpperCase().trim();
  if (/^[IVXLC]+$/.test(str)) return romanToNumber(str);
  str = str.replace(/SECTOR|ZONA|REGION|ZON|SEC|S/g, '').trim();
  const match = str.match(/\d+/);
  return match ? match[0] : str;
};

const normalizeText = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val)
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9 ]/g, "");
};

export const parseChileanNumber = (val: any): number => {
  if (typeof val === 'number') return Math.round(val);
  if (!val) return 0;
  let str = String(val).trim();
  if (str.includes(',') && !str.includes('.')) str = str.replace(',', '.');
  else if (str.includes('.') && str.includes(',')) str = str.replace(/\./g, '').replace(',', '.');
  else if (str.includes('.') && !str.includes(',')) {
    const parts = str.split('.');
    if (parts[parts.length - 1].length === 3) str = str.replace(/\./g, '');
  }
  const numeric = parseFloat(str.replace(/[^\d.-]/g, '')) || 0;
  return Math.round(numeric);
};

export const getSectorByComuna = (comunaName: string, matrix: ComunaMapping[] = COMUNAS_DATA): string => {
  if (!comunaName) return '';
  const cleanComuna = normalizeText(comunaName);
  const activeMatrix = matrix.length > 0 ? matrix : COMUNAS_DATA;
  const match = activeMatrix.find(c => normalizeText(c.comuna) === cleanComuna);
  return match ? normalizeSector(match.sector) : '';
};

export const calculateFreightCost = (params: {
  comuna: string;
  weight: number;
  type: TripType;
  toll?: number;
  km?: number;
  customComunaMatrix?: ComunaMapping[];
  customUrbanRates?: UrbanRate[];
  customInterurbanRates?: InterurbanRate[];
  overrideSector?: string;
}): CalculationResult => {
  const { comuna, weight, type, toll = 0, km = 0, customComunaMatrix = [], customUrbanRates = [], customInterurbanRates = [], overrideSector } = params;
  
  const sectorIdentified = overrideSector || getSectorByComuna(comuna, customComunaMatrix);
  const normalizedSector = normalizeSector(sectorIdentified);
  
  if (!normalizedSector && type !== TripType.INTERURBANO) {
    return { baseCost: 0, finalCost: 0, sector: '', error: 'Comuna no mapeada' };
  }

  const activeUrbanRates = customUrbanRates.length > 0 ? customUrbanRates : URBAN_RATES;
  const activeInterRates = customInterurbanRates.length > 0 ? customInterurbanRates : INTERURBAN_RATES;
  const numWeight = Math.round(Number(weight));
  const numToll = Math.round(Number(toll));

  if (type === TripType.INTERURBANO) {
    const sortedInterRates = [...activeInterRates].sort((a, b) => a.maxWeight - b.maxWeight);
    const matchedRate = sortedInterRates.find(r => numWeight <= r.maxWeight) || sortedInterRates[sortedInterRates.length - 1];
    
    if (!matchedRate) {
        return { baseCost: 0, finalCost: 0, sector: 'INT', error: 'No hay tarifas interurbanas definidas' };
    }

    const base = matchedRate.pricePerKm * (km || 0);
    return { 
        baseCost: base, 
        finalCost: Math.round(base * (TRIP_MULTIPLIERS[type] || 1)) + numToll, 
        sector: 'INT',
        matchedRate
    };
  }

  const ratesForSector = activeUrbanRates
    .filter(r => normalizeSector(r.sector) === normalizedSector)
    .sort((a, b) => a.maxWeight - b.maxWeight);
    
  if (ratesForSector.length === 0) {
    return { baseCost: 0, finalCost: 0, sector: normalizedSector, error: `Sin tarifas: Sector ${normalizedSector}` };
  }

  const matchedRate = ratesForSector.find(r => numWeight <= r.maxWeight);

  if (matchedRate) {
    const base = matchedRate.price;
    return { baseCost: base, finalCost: Math.round(base * (TRIP_MULTIPLIERS[type] || 1)) + numToll, sector: normalizedSector, matchedRate };
  } else {
    const topRate = ratesForSector[ratesForSector.length - 1];
    return { baseCost: topRate.price, finalCost: Math.round(topRate.price * (TRIP_MULTIPLIERS[type] || 1)) + numToll, sector: normalizedSector, matchedRate: topRate };
  }
};
