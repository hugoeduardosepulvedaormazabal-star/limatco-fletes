
export enum TripType {
  NORMAL = 'NORMAL',
  FLETE_FALSO = 'FLETE_FALSO',
  REPOSICION = 'REPOSICION',
  NORMAL_QUEBRADO = 'NORMAL_QUEBRADO',
  NOCTURNO = 'NOCTURNO',
  RETIRO_REPOSICION = 'RETIRO_REPOSICION',
  INTERURBANO = 'INTERURBANO'
}

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  [TripType.NORMAL]: 'Normal',
  [TripType.FLETE_FALSO]: 'Flete Falso',
  [TripType.REPOSICION]: 'Reposición',
  [TripType.NORMAL_QUEBRADO]: 'Normal con Quebrado',
  [TripType.NOCTURNO]: 'Nocturno',
  [TripType.RETIRO_REPOSICION]: 'Retiro/Repos',
  [TripType.INTERURBANO]: 'Interurbano'
};

export const TRIP_MULTIPLIERS: Record<TripType, number> = {
  [TripType.NORMAL]: 1.0,
  [TripType.FLETE_FALSO]: 0.7,
  [TripType.REPOSICION]: 0.5,
  [TripType.NORMAL_QUEBRADO]: 1.0, 
  [TripType.NOCTURNO]: 1.5,
  [TripType.RETIRO_REPOSICION]: 1.5,
  [TripType.INTERURBANO]: 1.0 
};

export interface ComunaMapping {
  comuna: string;
  sector: string;
}

export interface UrbanRate {
  sector: string;
  minWeight: number;
  maxWeight: number;
  price: number;
}

export interface InterurbanRate {
  minWeight: number;
  maxWeight: number;
  pricePerKm: number;
}

export interface Trip {
  id: string;
  guideNumber: string;
  billNumber?: string;
  documentType: 'GDF' | 'GET';
  carrier: string;
  patent: string;
  driver: string;
  deliveryDate: string;
  entryDate: string;
  address: string;
  comuna: string;
  sector: string;
  hub: 'BLA' | 'L03';
  weight: number;
  toll: number;
  kilometers?: number;
  type: TripType;
  baseCost: number;
  finalCost: number;
  originLocation: string;
  observation?: string;
}

export interface MasterDataEntry {
  guideNumber: string;
  billNumber?: string;
  originLocation: string;
  address: string;
  comuna: string;
  weight: number;
  deliveryDate: string;
  driver: string;
  observation?: string;
}

export interface CalculationResult {
  baseCost: number;
  finalCost: number;
  sector: string;
  matchedRate?: UrbanRate | InterurbanRate;
  error?: string;
}
