
import React, { useMemo } from 'react';
import { Trip } from '../types';
import { BarChart3, Weight, Coins, Building2 } from 'lucide-react';

interface HubAnalyticsProps {
  trips: Trip[];
}

const HubAnalytics: React.FC<HubAnalyticsProps> = ({ trips }) => {
  const stats = useMemo(() => {
    const data = {
      BLA: { count: 0, weight: 0, cost: 0 },
      L03: { count: 0, weight: 0, cost: 0 }
    };

    trips.forEach(t => {
      if (t.hub === 'BLA' || t.hub === 'L03') {
        data[t.hub].count += 1;
        data[t.hub].weight += t.weight;
        data[t.hub].cost += t.finalCost;
      }
    });

    return data;
  }, [trips]);

  const maxValues = {
    count: Math.max(stats.BLA.count, stats.L03.count, 1),
    weight: Math.max(stats.BLA.weight, stats.L03.weight, 1),
    cost: Math.max(stats.BLA.cost, stats.L03.cost, 1)
  };

  const ChartCard = ({ title, icon: Icon, blaVal, l03Val, maxVal, unit = '', isCurrency = false }: any) => {
    const blaPerc = (blaVal / maxVal) * 100;
    const l03Perc = (l03Val / maxVal) * 100;

    const format = (v: number) => isCurrency ? v.toLocaleString('es-CL') : v.toLocaleString();

    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
            <Icon size={18} />
          </div>
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">{title}</h4>
        </div>

        <div className="space-y-6 flex-1 flex flex-col justify-center">
          {/* BLA BAR */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter flex items-center gap-1">
                <Building2 size={10} /> HUB BLA
              </span>
              <span className="text-sm font-black text-slate-900">{isCurrency ? '$' : ''}{format(blaVal)} {unit}</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${blaPerc}%` }}
              />
            </div>
          </div>

          {/* L03 BAR */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter flex items-center gap-1">
                <Building2 size={10} /> HUB L03
              </span>
              <span className="text-sm font-black text-slate-900">{isCurrency ? '$' : ''}{format(l03Val)} {unit}</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${l03Perc}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span>Distribución relativa</span>
          <span className="text-slate-900">Total: {isCurrency ? '$' : ''}{format(blaVal + l03Val)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ChartCard 
        title="Cantidad de Guías" 
        icon={BarChart3} 
        blaVal={stats.BLA.count} 
        l03Val={stats.L03.count} 
        maxVal={maxValues.count}
        unit="Guías"
      />
      <ChartCard 
        title="Peso Total Despachado" 
        icon={Weight} 
        blaVal={stats.BLA.weight / 1000} 
        l03Val={stats.L03.weight / 1000} 
        maxVal={maxValues.weight / 1000}
        unit="Tons"
      />
      <ChartCard 
        title="Inversión en Fletes" 
        icon={Coins} 
        blaVal={stats.BLA.cost} 
        l03Val={stats.L03.cost} 
        maxVal={maxValues.cost}
        isCurrency={true}
      />
    </div>
  );
};

export default HubAnalytics;
