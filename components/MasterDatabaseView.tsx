
import React, { useState, useMemo } from 'react';
import { MasterDataEntry } from '../types';
import { Search, Info, MapPin, User, Calendar, Store, Weight, ArrowRight, Hash, AlertCircle, FileText } from 'lucide-react';

interface MasterDatabaseViewProps {
  masterData: MasterDataEntry[];
}

const MasterDatabaseView: React.FC<MasterDatabaseViewProps> = ({ masterData }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) return masterData.slice(0, 100); // Mostramos los primeros 100 por rendimiento
    
    const lowerSearch = searchTerm.toLowerCase().trim();
    return masterData.filter(item => 
      item.guideNumber.toLowerCase().includes(lowerSearch) ||
      (item.billNumber && item.billNumber.toLowerCase().includes(lowerSearch)) ||
      item.address.toLowerCase().includes(lowerSearch) ||
      item.driver.toLowerCase().includes(lowerSearch) ||
      item.comuna.toLowerCase().includes(lowerSearch) ||
      item.originLocation.toLowerCase().includes(lowerSearch)
    ).slice(0, 200); // Limitamos resultados de búsqueda para mantener fluidez
  }, [masterData, searchTerm]);

  if (masterData.length === 0) {
    return (
      <div className="bg-white p-20 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Sin Datos Maestros</h3>
        <p className="text-slate-500 max-w-md">
          Aún no se ha cargado una base de datos de guías. Vaya a la sección de <b>Matrices y Config</b> para cargar un archivo Excel o conectar una API.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Explorador de Base Maestra
            </h3>
            <p className="text-sm text-slate-500">Busque y verifique datos de guías registradas en el sistema.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-right">
               <p className="text-[10px] font-black text-blue-400 uppercase leading-none">Registros Totales</p>
               <p className="text-lg font-black text-blue-600">{masterData.length.toLocaleString()}</p>
             </div>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por Guía, Boleta, Dirección, Conductor, Comuna o Local..." 
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
          <Info size={16} className="text-amber-600" />
          <p className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
            {searchTerm ? `Mostrando ${filteredData.length} resultados para "${searchTerm}"` : `Mostrando los primeros 100 registros de la base`}
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="py-4 px-4 text-center">Guía</th>
                <th className="py-4 px-4 text-center">Boleta/Factura</th>
                <th className="py-4 px-4">Procedencia</th>
                <th className="py-4 px-4">Dirección y Destino</th>
                <th className="py-4 px-4">Conductor</th>
                <th className="py-4 px-4 text-center">Peso</th>
                <th className="py-4 px-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-4 px-4 text-center">
                    <span className="font-mono font-black text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      {item.guideNumber}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {item.billNumber ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 text-[10px] font-black uppercase">
                        <FileText size={10} /> {item.billNumber}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-[10px] font-bold">N/A</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Store size={14} className="text-indigo-500" />
                      <span className="font-bold text-indigo-900 text-xs uppercase">{item.originLocation}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs mb-1">
                      <MapPin size={12} className="text-blue-500" /> {item.address}
                    </div>
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">
                      {item.comuna}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium italic">
                      <User size={12} /> {item.driver}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center gap-1 bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-black">
                      <Weight size={10} /> {item.weight.toLocaleString()} Kg
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px]">
                      <Calendar size={12} /> {item.deliveryDate}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
             <div className="py-12 text-center text-slate-400 italic">
               No se encontraron coincidencias para "{searchTerm}"
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterDatabaseView;
