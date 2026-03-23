
import React, { useMemo } from 'react';
import { Trip } from '../types';
import { Truck, Package, Calculator } from 'lucide-react';

interface CarrierSummaryTableProps {
  trips: Trip[];
}

const CarrierSummaryTable: React.FC<CarrierSummaryTableProps> = ({ trips }) => {
  const carrierData = useMemo(() => {
    const carriers: Record<string, { count: number, totalWeight: number, totalCost: number }> = {};
    
    trips.forEach(t => {
      const carrier = t.carrier || 'Sin Transportista';
      if (!carriers[carrier]) {
        carriers[carrier] = { count: 0, totalWeight: 0, totalCost: 0 };
      }
      carriers[carrier].count += 1;
      carriers[carrier].totalWeight += t.weight;
      carriers[carrier].totalCost += t.finalCost;
    });

    return Object.entries(carriers).sort((a, b) => b[1].totalCost - a[1].totalCost);
  }, [trips]);

  if (trips.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Transportista</th>
            <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider text-center">Viajes</th>
            <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Peso Total (Kg)</th>
            <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider text-right">Monto a Liquidar</th>
          </tr>
        </thead>
        <tbody>
          {carrierData.map(([carrier, stats]) => (
            <tr key={carrier} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Truck size={16} />
                  </div>
                  <span className="font-bold text-slate-800">{carrier}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-black">
                  {stats.count}
                </span>
              </td>
              <td className="px-6 py-4 text-right font-mono text-slate-600">{stats.totalWeight.toLocaleString('es-CL')}</td>
              <td className="px-6 py-4 text-right">
                <span className="text-blue-600 font-black text-base">
                  ${stats.totalCost.toLocaleString('es-CL')}
                </span>
              </td>
            </tr>
          ))}
          <tr className="bg-slate-900 text-white">
             <td className="px-6 py-4 font-black rounded-bl-xl uppercase text-xs tracking-widest">Totales Flota</td>
             <td className="px-6 py-4 text-center font-black">
                {trips.length}
             </td>
             <td className="px-6 py-4 text-right font-mono">
                {trips.reduce((acc, t) => acc + t.weight, 0).toLocaleString('es-CL')}
             </td>
             <td className="px-6 py-4 text-right font-black text-lg rounded-br-xl text-blue-400">
                ${trips.reduce((acc, t) => acc + t.finalCost, 0).toLocaleString('es-CL')}
             </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default CarrierSummaryTable;
