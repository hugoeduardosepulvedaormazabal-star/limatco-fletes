
import React, { useMemo } from 'react';
import { Trip } from '../types';

interface PivotTableProps {
  trips: Trip[];
}

const PivotTable: React.FC<PivotTableProps> = ({ trips }) => {
  const pivotData = useMemo(() => {
    const locations: Record<string, { count: number, totalWeight: number, totalCost: number }> = {};
    
    trips.forEach(t => {
      const loc = t.originLocation || 'Sin Asignar';
      if (!locations[loc]) {
        locations[loc] = { count: 0, totalWeight: 0, totalCost: 0 };
      }
      locations[loc].count += 1;
      locations[loc].totalWeight += t.weight;
      locations[loc].totalCost += t.finalCost;
    });

    return Object.entries(locations).sort((a, b) => b[1].totalCost - a[1].totalCost);
  }, [trips]);

  if (trips.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400 italic">
        Cargue datos y asigne local de origen para ver el resumen financiero.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Local de Origen</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Fletes Realizados</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Peso Acumulado (Kg)</th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Costo Operativo Total</th>
          </tr>
        </thead>
        <tbody>
          {pivotData.map(([location, stats]) => (
            <tr key={location} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-6 py-4 font-medium">{location}</td>
              <td className="px-6 py-4 text-center">{stats.count}</td>
              <td className="px-6 py-4 text-right">{stats.totalWeight.toLocaleString()}</td>
              <td className="px-6 py-4 text-right font-bold text-blue-600">${stats.totalCost.toLocaleString()}</td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-bold">
             <td className="px-6 py-4">TOTAL GENERAL</td>
             <td className="px-6 py-4 text-center">{trips.length}</td>
             <td className="px-6 py-4 text-right">
                {trips.reduce((acc, t) => acc + t.weight, 0).toLocaleString()}
             </td>
             <td className="px-6 py-4 text-right">
                ${trips.reduce((acc, t) => acc + t.finalCost, 0).toLocaleString()}
             </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PivotTable;
