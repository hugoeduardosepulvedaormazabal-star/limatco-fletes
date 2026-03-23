
import React from 'react';
import { Trip, TripType, TRIP_TYPE_LABELS, TRIP_MULTIPLIERS } from '../types';
import { CARRIERS } from '../constants';
import { Calendar, Clock, ChevronDown, MapPin, Info, HelpCircle, Percent, CreditCard, Building2, MessageSquare, Navigation, Coins, FileText, Lock, Settings, X } from 'lucide-react';

interface PaymentTableProps {
  trips: Trip[];
  onDeleteTrip: (id: string) => void;
  onUpdateTripType?: (id: string, newType: TripType) => void;
  onUpdateTripCarrier?: (id: string, newCarrier: string) => void;
  onUpdateDocumentType?: (id: string, newDocType: 'GDF' | 'GET') => void;
  onUpdateTripWeight?: (id: string, newWeight: number) => void;
  onUpdateTripSector?: (id: string, newSector: string) => void;
  onUpdateTripComuna?: (id: string, newComuna: string) => void;
  onUpdateTripObservation?: (id: string, newObs: string) => void;
  availableComunas?: string[];
  isUnlocked?: boolean;
}

const PaymentTable: React.FC<PaymentTableProps> = ({ 
  trips, 
  onDeleteTrip, 
  onUpdateTripType, 
  onUpdateTripCarrier,
  onUpdateDocumentType,
  onUpdateTripWeight,
  onUpdateTripSector,
  onUpdateTripComuna,
  onUpdateTripObservation,
  availableComunas,
  isUnlocked = true
}) => {
  
  if (trips.length === 0) {
    return (
      <div className="py-20 text-center flex flex-col items-center gap-4">
        <div className="bg-slate-100 p-4 rounded-full"><Info className="text-slate-400" size={32} /></div>
        <p className="text-slate-500 font-medium font-bold uppercase tracking-widest text-xs">No hay registros de fletes para mostrar</p>
      </div>
    );
  }

  const SECTORS = ['1', '2', '3', '4', '5'];

  // Helper para formatear fecha de YYYY-MM-DD a DD-MM-YYYY
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
      <table className="w-full text-left text-sm table-auto border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-slate-500 font-black uppercase text-[9px] tracking-widest">
            <th className="py-3 px-2 text-center w-12">Hub</th>
            <th className="py-3 px-2 w-28">Fecha Entrega</th>
            <th className="py-3 px-2 w-24">Guía N°</th>
            <th className="py-3 px-2 w-16">Tipo</th>
            <th className="py-3 px-2 w-44">Transportista</th>
            <th className="py-3 px-2 min-w-[120px]">Destino / Sector</th>
            <th className="py-3 px-2 min-w-[140px]">Observación</th>
            <th className="py-3 px-2 w-36">Servicio</th>
            <th className="py-3 px-2 text-center w-20">Peso</th>
            <th className="py-3 px-2 text-right w-28">Monto Final</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {trips.map((trip) => (
            <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors group">
              <td className="py-3 px-2 text-center">
                <div className="inline-flex items-center justify-center text-slate-900 font-black text-[9px] bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {trip.hub}
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-1 text-blue-700 font-bold text-[11px]">
                  <Calendar size={10} className="text-blue-500 shrink-0" /> {formatDisplayDate(trip.deliveryDate)}
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="font-mono font-black text-slate-800 text-[12px]">{trip.guideNumber}</div>
              </td>
              <td className="py-3 px-2">
                <div className="relative">
                  <select 
                    className="w-full pl-1 pr-4 py-0.5 bg-slate-900 text-white rounded text-[9px] font-black uppercase outline-none appearance-none cursor-pointer"
                    value={trip.documentType}
                    onChange={(e) => onUpdateDocumentType?.(trip.id, e.target.value as 'GDF' | 'GET')}
                  >
                    <option value="GDF">GDF</option>
                    <option value="GET">GET</option>
                  </select>
                  <ChevronDown size={8} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="relative mb-1">
                  <select 
                    className="w-full pl-2 pr-4 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-800 outline-none hover:border-blue-400 transition-all appearance-none overflow-hidden text-ellipsis whitespace-nowrap"
                    value={trip.carrier}
                    onChange={(e) => onUpdateTripCarrier?.(trip.id, e.target.value)}
                  >
                    {CARRIERS.map(c => (
                      <option key={c} value={c}>{c.toUpperCase()}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <div className="flex items-center gap-1 text-blue-500 text-[9px] font-black uppercase tracking-tighter">
                  <CreditCard size={9} /> {trip.patent}
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="text-slate-900 font-black text-[11px] uppercase flex items-center gap-1 mb-1 leading-tight break-words">
                  <MapPin size={10} className="text-blue-500 shrink-0" /> {trip.comuna}
                </div>
                <div className="flex items-center gap-1">
                  {trip.type === TripType.INTERURBANO ? (
                    <div className="text-[9px] font-black text-orange-600 bg-orange-50 px-1 rounded flex items-center gap-1">
                      <Navigation size={8} /> {trip.kilometers} KM
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        className="pl-1 pr-4 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] font-black text-blue-700 outline-none appearance-none cursor-pointer"
                        value={trip.sector}
                        onChange={(e) => onUpdateTripSector?.(trip.id, e.target.value)}
                      >
                        {SECTORS.map(s => <option key={s} value={s}>SEC {s}</option>)}
                        <option value="INT">INT</option>
                      </select>
                      <ChevronDown size={8} className="absolute right-1 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                    </div>
                  )}
                  {trip.toll > 0 && (
                    <div className="flex items-center gap-0.5 text-[8px] text-amber-600 font-black uppercase">
                      <Coins size={8} /> ${trip.toll.toLocaleString('es-CL')}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-1.5 group/obs relative w-full">
                  <MessageSquare size={10} className="text-slate-300 shrink-0" />
                  <input 
                    type="text"
                    className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white px-1 py-0.5 text-[11px] font-medium text-slate-600 outline-none transition-all"
                    value={trip.observation || ''}
                    onChange={(e) => onUpdateTripObservation?.(trip.id, e.target.value)}
                    placeholder="..."
                  />
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="relative">
                  <select 
                    className="w-full pl-2 pr-4 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-700 outline-none appearance-none cursor-pointer"
                    value={trip.type}
                    onChange={(e) => onUpdateTripType?.(trip.id, e.target.value as TripType)}
                  >
                    {Object.keys(TRIP_MULTIPLIERS).map((type) => (
                      <option key={type} value={type}>
                        {TRIP_TYPE_LABELS[type as TripType]} ({(TRIP_MULTIPLIERS[type as TripType] * 100)}%)
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </td>
              <td className="py-3 px-2 text-center font-bold text-slate-700 text-[12px]">
                {Math.round(trip.weight).toLocaleString()}
              </td>
              <td className="py-3 px-2 text-right">
                <div className="text-slate-900 font-black text-[13px] tabular-nums leading-none">
                  ${trip.finalCost.toLocaleString('es-CL')}
                </div>
                {trip.toll > 0 && (
                  <span className="text-[8px] text-amber-600 font-black uppercase leading-tight block">
                    + Peaje
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentTable;
