
import { ComunaMapping, UrbanRate, InterurbanRate } from './types';

export const COMUNAS_DATA: ComunaMapping[] = [
  { comuna: 'SANTIAGO', sector: '1' },
  { comuna: 'ESTACION CENTRAL', sector: '1' },
  { comuna: 'INDEPENDENCIA', sector: '1' },
  { comuna: 'RECOLETA', sector: '1' },
  { comuna: 'CONCHALI', sector: '1' },
  { comuna: 'PROVIDENCIA', sector: '2' },
  { comuna: 'LAS CONDES', sector: '2' },
  { comuna: 'VITACURA', sector: '2' },
  { comuna: 'LO BARNECHEA', sector: '2' },
  { comuna: 'COLINA', sector: '3' },
  { comuna: 'BATUCO', sector: '3' },
  { comuna: 'LAMPA', sector: '3' },
  { comuna: 'QUILICURA', sector: '3' },
  { comuna: 'TILTIL', sector: '3' },
  { comuna: 'PUENTE ALTO', sector: '4' },
  { comuna: 'LA PINTANA', sector: '4' },
  { comuna: 'SAN BERNARDO', sector: '4' },
  { comuna: 'MAIPU', sector: '5' },
  { comuna: 'PUDAHUEL', sector: '5' }
];

const WEIGHT_STEPS = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000];

const SECTOR_1_PRICES = [13695, 18260, 21304, 25869, 30434, 34999, 39564, 45651, 53260, 60868, 68477, 77607, 86737, 95867, 104997, 114128];
const SECTOR_2_PRICES = [22826, 26630, 29673, 33477, 37282, 41847, 46412, 51738, 58586, 65433, 72281, 79889, 89020, 98150, 107280, 116410];
const SECTOR_3_PRICES = [31956, 34999, 38043, 41086, 44129, 48694, 53260, 57825, 63911, 69998, 76085, 82172, 91302, 100432, 109563, 118693];
const SECTOR_4_PRICES = [38043, 41086, 44129, 48694, 53260, 57825, 62390, 66955, 73042, 79128, 85215, 94345, 101954, 109563, 115649, 121736];
const SECTOR_5_PRICES = [75172, 75172, 75172, 75172, 75172, 75172, 81107, 87041, 94954, 102867, 110780, 122649, 132540, 142431, 150344, 158257];

const generateRates = (sector: string, prices: number[]): UrbanRate[] => {
  return prices.map((price, index) => ({
    sector,
    minWeight: index === 0 ? 0 : WEIGHT_STEPS[index - 1] + 1,
    maxWeight: WEIGHT_STEPS[index],
    price
  }));
};

export const URBAN_RATES: UrbanRate[] = [
  ...generateRates('1', SECTOR_1_PRICES),
  ...generateRates('2', SECTOR_2_PRICES),
  ...generateRates('3', SECTOR_3_PRICES),
  ...generateRates('4', SECTOR_4_PRICES),
  ...generateRates('5', SECTOR_5_PRICES),
];

export const INTERURBAN_RATES: InterurbanRate[] = [
  { minWeight: 0, maxWeight: 1000, pricePerKm: 1250 },
  { minWeight: 1001, maxWeight: 2000, pricePerKm: 1300 },
  { minWeight: 2001, maxWeight: 3000, pricePerKm: 1350 },
  { minWeight: 3001, maxWeight: 4000, pricePerKm: 1400 },
  { minWeight: 4001, maxWeight: 5000, pricePerKm: 1450 },
  { minWeight: 5001, maxWeight: 6000, pricePerKm: 1500 },
  { minWeight: 6001, maxWeight: 7000, pricePerKm: 1550 },
  { minWeight: 7001, maxWeight: 8000, pricePerKm: 1600 },
  { minWeight: 8001, maxWeight: 9000, pricePerKm: 1650 },
  { minWeight: 9001, maxWeight: 10000, pricePerKm: 1700 },
  { minWeight: 10001, maxWeight: 11000, pricePerKm: 1750 },
  { minWeight: 11001, maxWeight: 12000, pricePerKm: 1800 },
  { minWeight: 12001, maxWeight: 13000, pricePerKm: 1850 },
  { minWeight: 13001, maxWeight: 14000, pricePerKm: 1900 },
  { minWeight: 14001, maxWeight: 15000, pricePerKm: 1950 }
];

export const CARRIERS = [
  'Hector Larraguibel Flete',
  'Jorge Aracena',
  'Raul Faundez',
  'Omar Gaete',
  'JYN Limitada',
  'Juan Quiroz',
  'Manuel Alvarez',
  'Transportes Pasmiño'
];

export const CARRIER_PATENTS: Record<string, string[]> = {
  'Hector Larraguibel Flete': ['TV TL 40', 'TJ WL 23', 'VB HV 20', 'TR KB 46'],
  'Jorge Aracena': ['TF HZ 62'],
  'Raul Faundez': ['CJ YS 38'],
  'Omar Gaete': ['TJ XR 19'],
  'JYN Limitada': ['TW TR 79'],
  'Juan Quiroz': ['Sin Patente Registrada'],
  'Manuel Alvarez': ['SC YW 78'],
  'Transportes Pasmiño': ['KD 87 36']
};
