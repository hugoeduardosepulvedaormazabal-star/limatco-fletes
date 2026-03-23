
import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, FileSpreadsheet, CheckCircle2, Loader2, Layers, Globe, Link, RefreshCcw } from 'lucide-react';
import { MasterDataEntry, ComunaMapping, UrbanRate, InterurbanRate } from '../types';
import { normalizeSector, parseChileanNumber } from '../services/calculator';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

type UploadType = 'MASTER_DATA' | 'COMUNA_MATRIX' | 'RATES_MATRIX' | 'INTERURBAN_MATRIX';

interface DatabaseUploadProps {
  onDataLoaded: (data: MasterDataEntry[] | ComunaMapping[] | UrbanRate[] | InterurbanRate[]) => void;
  type: UploadType;
}

const DatabaseUpload: React.FC<DatabaseUploadProps> = ({ onDataLoaded, type }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [lastFileName, setLastFileName] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');

  const formatDateForInput = (dateVal: any): string => {
    if (!dateVal) return new Date().toISOString().split('T')[0];
    let d: Date;
    if (dateVal instanceof Date) d = dateVal;
    else if (typeof dateVal === 'number') d = new Date((dateVal - 25569) * 86400 * 1000);
    else {
      const parts = String(dateVal).split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        else d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else d = new Date(dateVal);
    }
    return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
  };

  const processWorkbook = (workbook: XLSX.WorkBook) => {
    if (type === 'RATES_MATRIX') {
      let consolidatedRates: UrbanRate[] = [];
      workbook.SheetNames.forEach(sheetName => {
        const ws = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:Z100');
        const rows: any[] = [];
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const row: any[] = [];
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = ws[XLSX.utils.encode_cell({c: C, r: R})];
            row.push(cell ? cell.v : null);
          }
          rows.push(row);
        }
        if (rows.length < 2) return;
        const headerRow = rows[0];
        const weightThresholds: number[] = [];
        headerRow.forEach((cell: any, idx: number) => {
          if (idx === 0) return;
          const val = parseChileanNumber(cell);
          if (val > 0) weightThresholds.push(val);
        });
        if (weightThresholds.length > 0) {
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const sectorName = normalizeSector(row[0]);
            if (!sectorName) continue;
            weightThresholds.forEach((weight, wIdx) => {
              const price = parseChileanNumber(row[wIdx + 1]);
              if (price > 0) {
                consolidatedRates.push({
                  sector: sectorName,
                  minWeight: wIdx === 0 ? 0 : weightThresholds[wIdx - 1] + 1,
                  maxWeight: weight,
                  price: price
                });
              }
            });
          }
        }
      });
      onDataLoaded(consolidatedRates.filter(r => r.price > 0));
      return;
    }

    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData: any[] = XLSX.utils.sheet_to_json(ws);
    const keys = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
    const findKey = (searchTerms: string[]) => 
      keys.find(k => searchTerms.some(term => k.toLowerCase().includes(term.toLowerCase())));

    if (type === 'MASTER_DATA') {
      const mapped = jsonData.map(row => {
        const guideKey = findKey(['guia', 'nro', 'documento', 'id']);
        const billKey = findKey(['boleta', 'factura', 'bill', 'invoice', 'bol']);
        const originKey = findKey(['local', 'origen', 'tienda', 'store', 'sucursal']);
        const addressKey = findKey(['direccion', 'calle', 'domicilio', 'address']);
        const comunaKey = findKey(['comuna', 'ciudad', 'district']);
        const weightKey = findKey(['peso', 'kg', 'kilos', 'weight']);
        const dateKey = findKey(['fecha', 'entrega', 'fec', 'date']);
        const driverKey = findKey(['conductor', 'chofer', 'nombre', 'driver']);
        const obsKey = findKey(['observacion', 'notas', 'comentario', 'obs']);

        const getVal = (key: string | undefined) => (key && row[key] !== undefined && row[key] !== null) ? String(row[key]).trim() : '';

        return {
          guideNumber: getVal(guideKey),
          billNumber: getVal(billKey),
          originLocation: getVal(originKey) || 'Desconocido',
          address: getVal(addressKey),
          comuna: getVal(comunaKey),
          weight: weightKey ? parseChileanNumber(row[weightKey]) : 0,
          deliveryDate: dateKey ? formatDateForInput(row[dateKey]) : new Date().toISOString().split('T')[0],
          driver: getVal(driverKey) || 'No asignado',
          observation: getVal(obsKey)
        };
      }).filter(item => item.guideNumber !== '');
      onDataLoaded(mapped);
    } else if (type === 'COMUNA_MATRIX') {
      const mapped = jsonData.map(row => {
        const cKey = findKey(['comuna', 'ciudad']);
        const sKey = findKey(['sector', 'zona']);
        return {
          comuna: (cKey && row[cKey]) ? String(row[cKey]).trim() : '',
          sector: (sKey && row[sKey]) ? normalizeSector(row[sKey]) : ''
        };
      }).filter(item => item.comuna !== '' && item.sector !== '');
      onDataLoaded(mapped);
    } else if (type === 'INTERURBAN_MATRIX') {
      const mapped = jsonData.map(row => {
        const minK = findKey(['min', 'desde']);
        const maxK = findKey(['max', 'hasta']);
        const priceK = findKey(['precio', 'valor', 'km']);
        return {
          minWeight: minK ? parseChileanNumber(row[minK]) : 0,
          maxWeight: maxK ? parseChileanNumber(row[maxK]) : 999999,
          pricePerKm: priceK ? parseChileanNumber(row[priceK]) : 0
        };
      }).filter(item => item.pricePerKm > 0);
      onDataLoaded(mapped as InterurbanRate[]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setLastFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        processWorkbook(wb);
      } catch (err) {
        alert("Error al procesar el archivo Excel.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFetchFromUrl = async () => {
    if (!externalUrl) return;
    setLoading(true);
    try {
      const response = await fetch(externalUrl);
      if (!response.ok) throw new Error('Error al conectar con la base externa');
      const arrayBuffer = await response.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      processWorkbook(wb);
      setLastFileName(`URL: ${externalUrl.substring(0, 20)}...`);
      setShowUrlInput(false);
    } catch (error: any) {
      alert(`Error al importar de base externa: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const details = {
    MASTER_DATA: { label: 'Base de Guías', sub: 'Múltiples formatos (Excel/API)' },
    COMUNA_MATRIX: { label: 'Matriz Comunas', sub: 'Comuna y Sector' },
    RATES_MATRIX: { label: 'Matriz Tarifas', sub: 'Escalas de peso y precio' },
    INTERURBAN_MATRIX: { label: 'Matriz Interurbana', sub: 'Tarifa por KM' }
  }[type];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 mb-2">
        <button 
          onClick={() => setShowUrlInput(false)}
          className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-tighter transition-all ${!showUrlInput ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          Archivo Local
        </button>
        <button 
          onClick={() => setShowUrlInput(true)}
          className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-tighter transition-all ${showUrlInput ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          Base Externa / API
        </button>
      </div>

      {!showUrlInput ? (
        <div 
          onClick={() => !loading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all ${
            loading ? 'bg-slate-50 border-slate-200' : 'border-slate-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-blue-500 animate-spin" />
              <span className="text-[10px] text-blue-600 font-bold">IMPORTANDO...</span>
            </div>
          ) : lastFileName ? (
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 size={24} className="text-green-500" />
              <p className="text-[11px] font-bold text-slate-700 truncate max-w-full px-4">{lastFileName}</p>
              <span className="text-[9px] text-slate-400 font-black uppercase">Actualizado</span>
            </div>
          ) : (
            <div className="text-center">
              <FileSpreadsheet size={20} className="text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">{details.label}</p>
              <p className="text-[10px] text-slate-400">{details.sub}</p>
            </div>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Globe size={16} />
            <span className="text-[10px] font-black uppercase">Sincronizar API / URL Externa</span>
          </div>
          <div className="flex gap-2">
            <input 
              className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-mono"
              placeholder="https://tu-api.com/datos.json"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
            />
            <button 
              onClick={handleFetchFromUrl}
              disabled={loading || !externalUrl}
              className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
            </button>
          </div>
          <p className="text-[9px] text-slate-500 leading-tight">
            * Ingrese la URL de su base de datos o API. El sistema procesará el contenido automáticamente.
          </p>
        </div>
      )}
    </div>
  );
};

export default DatabaseUpload;
