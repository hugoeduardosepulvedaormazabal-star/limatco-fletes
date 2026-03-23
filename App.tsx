
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Trip, TripType, TRIP_TYPE_LABELS, MasterDataEntry, ComunaMapping, UrbanRate, InterurbanRate } from './types';
import { calculateFreightCost, getSectorByComuna } from './services/calculator';
import { CARRIERS, COMUNAS_DATA, URBAN_RATES, INTERURBAN_RATES, CARRIER_PATENTS } from './constants';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Truck, 
  Database,
  BarChart3, 
  Search,
  Download,
  Settings2,
  Globe,
  Calendar,
  XCircle,
  Filter,
  Calculator,
  Map,
  Navigation,
  Lock,
  Unlock,
  LogIn,
  AlertCircle,
  User,
  Database as DbIcon,
  Activity,
  SearchCode,
  LayoutGrid,
  Trash2,
  RefreshCw,
  FileCheck,
  CheckSquare,
  Square,
  History,
  Save,
  RotateCcw,
  Eraser,
  ListFilter,
  Check,
  RefreshAlert,
  Files,
  CreditCard
} from 'lucide-react';

// Components
import TripForm from './components/TripForm';
import PaymentTable from './components/PaymentTable';
import PivotTable from './components/PivotTable';
import CarrierSummaryTable from './components/CarrierSummaryTable';
import DatabaseUpload from './components/DatabaseUpload';
import MasterDatabaseView from './components/MasterDatabaseView';
import HubAnalytics from './components/HubAnalytics';

// Helper for LocalStorage
const saveToLS = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));
const loadFromLS = (key: string, defaultValue: any) => {
  const saved = localStorage.getItem(key);
  try {
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const LS_KEYS = {
  MASTER: 'limatco_master_data',
  BLA_MATRIX: 'limatco_bla_matrix',
  L03_MATRIX: 'limatco_l03_matrix',
  URBAN_RATES: 'limatco_urban_rates',
  INTERURBAN_RATES: 'limatco_interurban_rates',
  TRIPS: 'limatco_trips_history',
  FORM_DEFAULTS: 'limatco_form_defaults'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new' | 'liquidacion' | 'pivot' | 'database' | 'master_view'>('dashboard');
  
  // States initialized from LocalStorage
  const [trips, setTrips] = useState<Trip[]>(() => loadFromLS(LS_KEYS.TRIPS, []));
  const [masterData, setMasterData] = useState<MasterDataEntry[]>(() => loadFromLS(LS_KEYS.MASTER, []));
  const [lastMasterUpdate, setLastMasterUpdate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [selectedPatent, setSelectedPatent] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [onlyGetFilter, setOnlyGetFilter] = useState<boolean>(false);
  const [onlyTodayFilter, setOnlyTodayFilter] = useState<boolean>(false);

  // Persistent form state to keep carrier/hub when switching tabs
  const [formPersistentState, setFormPersistentState] = useState(() => loadFromLS(LS_KEYS.FORM_DEFAULTS, {
    carrier: CARRIERS[0],
    hub: 'BLA',
    documentType: 'GDF',
    driver: '',
    patent: ''
  }));

  // Matrices de Comunas Diferenciadas con persistencia
  const [blaComunaMatrix, setBlaComunaMatrix] = useState<ComunaMapping[]>(() => loadFromLS(LS_KEYS.BLA_MATRIX, COMUNAS_DATA));
  const [l03ComunaMatrix, setL03ComunaMatrix] = useState<ComunaMapping[]>(() => loadFromLS(LS_KEYS.L03_MATRIX, []));
  
  const [dynamicUrbanRates, setDynamicUrbanRates] = useState<UrbanRate[]>(() => loadFromLS(LS_KEYS.URBAN_RATES, URBAN_RATES));
  const [dynamicInterurbanRates, setDynamicInterurbanRates] = useState<InterurbanRate[]>(() => loadFromLS(LS_KEYS.INTERURBAN_RATES, INTERURBAN_RATES));

  // Persistence side effects
  useEffect(() => saveToLS(LS_KEYS.TRIPS, trips), [trips]);
  useEffect(() => saveToLS(LS_KEYS.MASTER, masterData), [masterData]);
  useEffect(() => saveToLS(LS_KEYS.BLA_MATRIX, blaComunaMatrix), [blaComunaMatrix]);
  useEffect(() => saveToLS(LS_KEYS.L03_MATRIX, l03ComunaMatrix), [l03ComunaMatrix]);
  useEffect(() => saveToLS(LS_KEYS.URBAN_RATES, dynamicUrbanRates), [dynamicUrbanRates]);
  useEffect(() => saveToLS(LS_KEYS.INTERURBAN_RATES, dynamicInterurbanRates), [dynamicInterurbanRates]);
  useEffect(() => saveToLS(LS_KEYS.FORM_DEFAULTS, formPersistentState), [formPersistentState]);

  const onMasterDataLoaded = (data: MasterDataEntry[]) => {
    setMasterData([...data]);
    setLastMasterUpdate(new Date().toLocaleString());
  };

  const handleClearMasterData = () => {
    if (window.confirm("¿Está seguro de eliminar TODA la base maestra actual? Esta acción no se puede deshacer.")) {
      setMasterData([]);
      setLastMasterUpdate(null);
    }
  };

  const resetToFactorySettings = () => {
    if (window.confirm("¿Desea restaurar todas las matrices de configuración a sus valores por defecto? Se perderán las cargas personalizadas.")) {
      setBlaComunaMatrix(COMUNAS_DATA);
      setL03ComunaMatrix([]);
      setDynamicUrbanRates(URBAN_RATES);
      setDynamicInterurbanRates(INTERURBAN_RATES);
    }
  };

  const clearTripsHistory = () => {
    if (window.confirm("¿Desea REINICIAR LA LIQUIDACIÓN? Se borrarán todos los registros de fletes ingresados hasta ahora. Esta acción no se puede deshacer.")) {
      setTrips([]);
      localStorage.removeItem(LS_KEYS.TRIPS);
    }
  };

  // Obtener todas las patentes únicas registradas o disponibles
  const allAvailablePatents = useMemo(() => {
    const fromTrips = trips.map(t => t.patent);
    const fromConstants = Object.values(CARRIER_PATENTS).flat();
    return Array.from(new Set([...fromTrips, ...fromConstants])).filter(Boolean).sort();
  }, [trips]);

  const filteredTrips = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return trips.filter(t => {
      const matchesSearch = t.guideNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (t.billNumber && t.billNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && t.deliveryDate >= startDate;
      if (endDate) matchesDate = matchesDate && t.deliveryDate <= endDate;

      let matchesCarrier = true;
      if (selectedCarrier) matchesCarrier = t.carrier === selectedCarrier;

      let matchesPatent = true;
      if (selectedPatent) matchesPatent = t.patent === selectedPatent;

      let matchesDocType = true;
      if (selectedDocumentType) matchesDocType = t.documentType === selectedDocumentType;

      let matchesOnlyGet = true;
      if (onlyGetFilter) {
        matchesOnlyGet = t.guideNumber.toUpperCase().startsWith('GET') || t.documentType === 'GET';
      }

      let matchesOnlyToday = true;
      if (onlyTodayFilter) {
        matchesOnlyToday = t.entryDate.split('T')[0] === todayStr;
      }

      return matchesSearch && matchesDate && matchesCarrier && matchesPatent && matchesDocType && matchesOnlyGet && matchesOnlyToday;
    }).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [trips, searchTerm, startDate, endDate, selectedCarrier, selectedPatent, selectedDocumentType, onlyGetFilter, onlyTodayFilter]);

  // Subset de viajes con costo mayor a cero para estadísticas y resúmenes
  const tripsWithCost = useMemo(() => filteredTrips.filter(t => t.finalCost > 0), [filteredTrips]);

  useEffect(() => {
    if (trips.length === 0) return;

    setTrips(currentTrips => currentTrips.map(trip => {
      const activeMatrix = trip.hub === 'BLA' ? blaComunaMatrix : l03ComunaMatrix;
      const targetSector = trip.sector || getSectorByComuna(trip.comuna, activeMatrix);
      
      const calculation = calculateFreightCost({
        comuna: trip.comuna,
        weight: trip.weight,
        toll: trip.toll,
        type: trip.type,
        km: trip.kilometers,
        customComunaMatrix: activeMatrix,
        customUrbanRates: dynamicUrbanRates,
        customInterurbanRates: dynamicInterurbanRates,
        overrideSector: targetSector
      });

      if (trip.finalCost !== calculation.finalCost || trip.sector !== calculation.sector) {
        return {
          ...trip,
          sector: calculation.sector,
          baseCost: calculation.baseCost,
          finalCost: calculation.finalCost
        };
      }
      return trip;
    }));
  }, [blaComunaMatrix, l03ComunaMatrix, dynamicUrbanRates, dynamicInterurbanRates]);

  const handleAddTrip = (newTrip: Omit<Trip, 'id' | 'baseCost' | 'finalCost' | 'sector'>) => {
    const guideLower = newTrip.guideNumber.toLowerCase().trim();
    const existingIndex = trips.findIndex(t => t.guideNumber.toLowerCase().trim() === guideLower);
    
    if (existingIndex !== -1) {
      const existingTrip = trips[existingIndex];
      if (existingTrip.finalCost > 0) {
        alert(`Error: La guía N° ${newTrip.guideNumber} ya ha sido ingresada con un valor de $${existingTrip.finalCost.toLocaleString('es-CL')}.`);
        return;
      } else {
        setTrips(prev => prev.filter((_, i) => i !== existingIndex));
      }
    }

    let originLocation = newTrip.originLocation;
    let billNumber = newTrip.billNumber;
    if (!originLocation) {
      const match = masterData.find(d => d.guideNumber.toLowerCase() === newTrip.guideNumber.toLowerCase());
      originLocation = match ? match.originLocation : 'Desconocido';
      billNumber = match ? match.billNumber : '';
    }

    const activeMatrix = newTrip.hub === 'BLA' ? blaComunaMatrix : l03ComunaMatrix;

    const calculation = calculateFreightCost({
      comuna: newTrip.comuna,
      weight: newTrip.weight,
      toll: newTrip.toll,
      type: newTrip.type,
      km: newTrip.kilometers,
      customComunaMatrix: activeMatrix,
      customUrbanRates: dynamicUrbanRates,
      customInterurbanRates: dynamicInterurbanRates
    });

    const uniqueId = typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : `trip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const trip: Trip = {
      ...newTrip,
      id: uniqueId,
      billNumber: billNumber,
      baseCost: calculation.baseCost,
      finalCost: calculation.finalCost,
      sector: calculation.sector,
      originLocation: originLocation || 'Desconocido'
    };

    setTrips(prev => [trip, ...prev]);

    // Actualizar estados persistentes del formulario para la siguiente entrada
    setFormPersistentState(prev => ({
      ...prev,
      carrier: newTrip.carrier,
      hub: newTrip.hub,
      documentType: newTrip.documentType,
      driver: newTrip.driver,
      patent: newTrip.patent
    }));
  };

  const handleUpdateTripType = (id: string, newType: TripType) => {
    setTrips(prev => prev.map(t => {
      if (t.id === id) {
        const activeMatrix = t.hub === 'BLA' ? blaComunaMatrix : l03ComunaMatrix;
        const calculation = calculateFreightCost({
          comuna: t.comuna,
          weight: t.weight,
          toll: t.toll,
          type: newType,
          km: t.kilometers,
          customComunaMatrix: activeMatrix,
          customUrbanRates: dynamicUrbanRates,
          customInterurbanRates: dynamicInterurbanRates,
          overrideSector: t.sector 
        });
        return { ...t, type: newType, baseCost: calculation.baseCost, finalCost: calculation.finalCost };
      }
      return t;
    }));
  };

  const handleUpdateTripCarrier = (id: string, newCarrier: string) => {
    setTrips(prev => prev.map(t => t.id === id ? { ...t, carrier: newCarrier } : t));
  };

  const handleUpdateDocumentType = (id: string, newDocType: 'GDF' | 'GET') => {
    setTrips(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, documentType: newDocType };
      }
      return t;
    }));
  };

  const handleUpdateTripComuna = (id: string, newComuna: string) => {
    setTrips(prev => prev.map(t => {
      if (t.id === id) {
        const activeMatrix = t.hub === 'BLA' ? blaComunaMatrix : l03ComunaMatrix;
        const newSector = getSectorByComuna(newComuna, activeMatrix);
        const calculation = calculateFreightCost({
          comuna: newComuna,
          weight: t.weight,
          toll: t.toll,
          type: t.type,
          km: t.kilometers,
          customComunaMatrix: activeMatrix,
          customUrbanRates: dynamicUrbanRates,
          customInterurbanRates: dynamicInterurbanRates,
          overrideSector: newSector
        });
        return { ...t, comuna: newComuna, sector: newSector, baseCost: calculation.baseCost, finalCost: calculation.finalCost };
      }
      return t;
    }));
  };

  const handleUpdateTripWeight = (id: string, newWeight: number) => {
    setTrips(prev => prev.map(t => {
      if (t.id === id) {
        const activeMatrix = t.hub === 'BLA' ? blaComunaMatrix : l03ComunaMatrix;
        const calculation = calculateFreightCost({
          comuna: t.comuna,
          weight: newWeight,
          toll: t.toll,
          type: t.type,
          km: t.kilometers,
          customComunaMatrix: activeMatrix,
          customUrbanRates: dynamicUrbanRates,
          customInterurbanRates: dynamicInterurbanRates,
          overrideSector: t.sector
        });
        return { ...t, weight: newWeight, baseCost: calculation.baseCost, finalCost: calculation.finalCost };
      }
      return t;
    }));
  };

  const handleUpdateTripSector = (id: string, newSector: string) => {
    setTrips(prev => prev.map(t => {
      if (t.id === id) {
        const activeMatrix = t.hub === 'BLA' ? blaComunaMatrix : l03ComunaMatrix;
        const calculation = calculateFreightCost({
          comuna: t.comuna,
          weight: t.weight,
          toll: t.toll,
          type: t.type,
          km: t.kilometers,
          customComunaMatrix: activeMatrix,
          customUrbanRates: dynamicUrbanRates,
          customInterurbanRates: dynamicInterurbanRates,
          overrideSector: newSector
        });
        return { ...t, sector: newSector, baseCost: calculation.baseCost, finalCost: calculation.finalCost };
      }
      return t;
    }));
  };

  const handleUpdateTripObservation = (id: string, newObs: string) => {
    setTrips(prev => prev.map(t => t.id === id ? { ...t, observation: newObs } : t));
  };

  const handleDeleteTrip = useCallback((id: string) => {
    setTrips(currentTrips => currentTrips.filter(trip => trip.id !== id));
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedCarrier('');
    setSelectedPatent('');
    setSelectedDocumentType('');
    setOnlyGetFilter(false);
    setOnlyTodayFilter(false);
  };

  const handleExportToExcel = () => {
    if (filteredTrips.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    
    // Función auxiliar para transformar YYYY-MM-DD a DD-MM-YYYY
    const formatDateForExport = (dateStr: string) => {
      if (!dateStr || !dateStr.includes('-')) return dateStr;
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
    };

    const dataToExport = filteredTrips.map(t => ({
      'Local Origen': t.originLocation,
      'Hub Origen': t.hub,
      'Fecha Entreg': formatDateForExport(t.deliveryDate),
      'Patente': t.patent,
      'Conductor': t.driver,
      'Tipo Doc': t.documentType,
      'Guía N°': t.guideNumber.toUpperCase(),
      'Boleta/Factura': t.billNumber?.trim() || '',
      'Comuna': t.comuna.toUpperCase(),
      'Dirección': t.address.toUpperCase(),
      'Tipo Servicio': TRIP_TYPE_LABELS[t.type],
      'Peso (Kg)': t.weight,
      'Sector': t.type === TripType.INTERURBANO ? `${t.kilometers || 0} KM` : t.sector,
      'Observación': (t.observation && t.observation.trim()) ? t.observation.trim() : '',
      'Costo Base': t.baseCost,
      'Peaje ($)': t.toll,
      'Monto Final': t.finalCost,
      'Transportista': t.carrier,
      'OPERACION': t.hub === 'BLA' ? 'Independencia' : (t.hub === 'L03' ? 'Vespucio' : t.hub)
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pagos Transportistas");
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Pagos_Fletes_${dateStr}.xlsx`);
  };

  const existingGuideNumbers = useMemo(() => 
    trips.filter(t => t.finalCost > 0).map(t => t.guideNumber.toLowerCase().trim()), 
    [trips]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Truck className="text-blue-400" /> 
              <span>Limatco</span>
            </div>
            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Transportes</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><LayoutDashboard size={20} /> Dashboard</button>
          <button onClick={() => setActiveTab('new')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${activeTab === 'new' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><PlusCircle size={20} /> Nuevo Pago</button>
          <button onClick={() => setActiveTab('master_view')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${activeTab === 'master_view' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><SearchCode size={20} /> Explorador Maestro</button>
          <button onClick={() => setActiveTab('liquidacion')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${activeTab === 'liquidacion' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><FileText size={20} /> Liquidación</button>
          <button onClick={() => setActiveTab('pivot')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${activeTab === 'pivot' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><BarChart3 size={20} /> Cuadro Resumen</button>
          <button onClick={() => setActiveTab('database')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${activeTab === 'database' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Settings2 size={20} /> Matrices y Config</button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-none mb-1">Sistema de Pago Transportes Limatco</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Gestión de fletes urbanos</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Buscar..." className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-xs outline-none w-40" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1 border border-slate-200">
              <div className="flex items-center px-2 py-1 gap-2">
                <Calendar size={14} className="text-slate-400" />
                <input type="date" className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none p-0" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="text-slate-300">|</div>
              <div className="flex items-center px-2 py-1 gap-2">
                <input type="date" className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none p-0" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              {(startDate || endDate || searchTerm || selectedCarrier || selectedPatent || selectedDocumentType || onlyGetFilter || onlyTodayFilter) && <button onClick={clearFilters} className="p-1.5 hover:text-red-500 text-slate-400 rounded-md transition-all"><XCircle size={14} /></button>}
            </div>
            <button onClick={handleExportToExcel} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"><Download size={16} /> Exportar Excel</button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <LayoutGrid size={18} />
                  </div>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Resumen General:</span>
                </div>
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 min-w-[200px]"
                  value={selectedCarrier}
                  onChange={(e) => setSelectedCarrier(e.target.value)}
                >
                  <option value="">TODOS LOS TRANSPORTISTAS</option>
                  {CARRIERS.map(c => (
                    <option key={c} value={c}>{c.toUpperCase()}</option>
                  ))}
                </select>
                {selectedCarrier && (
                  <div className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                    <Check size={10} /> FILTRO ACTIVO: {selectedCarrier}
                  </div>
                )}
              </div>

              {/* Nuevos Gráficos Comparativos de Hubs */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Análisis Comparativo por Hub (BLA vs L03)</h4>
                <HubAnalytics trips={tripsWithCost} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FileText size={80} />
                  </div>
                  <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Total Guías</p>
                  <h3 className="text-4xl font-black text-slate-900">{tripsWithCost.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Truck size={80} />
                  </div>
                  <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Tonelaje</p>
                  <h3 className="text-4xl font-black text-slate-900">{(tripsWithCost.reduce((acc, t) => acc + t.weight, 0) / 1000).toFixed(1)} <span className="text-lg font-normal text-slate-400">Tons</span></h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group border-l-4 border-l-blue-600">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Calculator size={80} />
                  </div>
                  <p className="text-blue-500 text-xs font-black uppercase tracking-widest mb-1">Total Liquidar</p>
                  <h3 className="text-4xl font-black text-blue-600">${tripsWithCost.reduce((acc, t) => acc + t.finalCost, 0).toLocaleString('es-CL')}</h3>
                </div>
                <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6"><Filter size={18} className="text-blue-500" /> Últimos Registros Válidos {selectedCarrier ? `(${selectedCarrier})` : ''}</h4>
                  <PaymentTable 
                    trips={tripsWithCost.slice(0, 10)} 
                    onDeleteTrip={handleDeleteTrip} 
                    onUpdateTripCarrier={handleUpdateTripCarrier}
                    onUpdateTripSector={handleUpdateTripSector}
                    onUpdateTripObservation={handleUpdateTripObservation}
                    isUnlocked={true} 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'new' && (
            <div className="max-w-4xl mx-auto">
              <TripForm 
                onSubmit={handleAddTrip}
                masterData={masterData}
                blaComunaMatrix={blaComunaMatrix}
                l03ComunaMatrix={l03ComunaMatrix}
                ratesMatrix={dynamicUrbanRates}
                interurbanRatesMatrix={dynamicInterurbanRates}
                existingGuideNumbers={existingGuideNumbers}
                persistedState={formPersistentState}
                onPersistedStateChange={setFormPersistentState}
              />
            </div>
          )}

          {activeTab === 'master_view' && (
            <MasterDatabaseView masterData={masterData} />
          )}

          {activeTab === 'liquidacion' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 lg:gap-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                    <Filter size={18} />
                  </div>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Filtros:</span>
                </div>
                
                {/* Buscador de Liquidación */}
                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="N° Guía, Chofer..." 
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 min-w-[150px]"
                    value={selectedCarrier}
                    onChange={(e) => setSelectedCarrier(e.target.value)}
                  >
                    <option value="">TODOS LOS TRANSPORTISTAS</option>
                    {CARRIERS.map(c => (
                      <option key={c} value={c}>{c.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <CreditCard size={16} className="text-slate-400" />
                    <select 
                      className="bg-transparent text-sm font-bold text-slate-700 outline-none uppercase"
                      value={selectedPatent}
                      onChange={(e) => setSelectedPatent(e.target.value)}
                    >
                      <option value="">TODAS LAS PATENTES</option>
                      {allAvailablePatents.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                   <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <FileCheck size={16} className="text-slate-400" />
                      <select 
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none uppercase"
                        value={selectedDocumentType}
                        onChange={(e) => setSelectedDocumentType(e.target.value)}
                      >
                        <option value="">TODOS LOS DOCUMENTOS</option>
                        <option value="GDF">GDF (GUÍA DESPACHO)</option>
                        <option value="GET">GET (GUÍA ELECTRÓNICA)</option>
                      </select>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setOnlyTodayFilter(!onlyTodayFilter)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-black uppercase tracking-tighter ${
                      onlyTodayFilter 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
                    }`}
                  >
                    <History size={16} />
                    Hoy
                  </button>

                  <button 
                    onClick={() => setOnlyGetFilter(!onlyGetFilter)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-black uppercase tracking-tighter ${
                      onlyGetFilter 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
                    }`}
                  >
                    Solo GET
                  </button>
                </div>

                {filteredTrips.length > 0 && (
                  <div className="ml-auto flex items-center gap-3">
                    {/* Contador de Documentos */}
                    <div className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-black uppercase tracking-tighter shadow-md shadow-emerald-100 flex items-center gap-2">
                      <Files size={16} />
                      <span>{filteredTrips.length} Docs</span>
                    </div>

                    <div className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-tighter shadow-md shadow-blue-100">
                      Total Liquidar: ${tripsWithCost.reduce((acc, t) => acc + t.finalCost, 0).toLocaleString('es-CL')}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
                {filteredTrips.length > 0 ? (
                  <PaymentTable 
                    trips={filteredTrips} 
                    onDeleteTrip={handleDeleteTrip}
                    onUpdateTripType={handleUpdateTripType}
                    onUpdateTripCarrier={handleUpdateTripCarrier}
                    onUpdateDocumentType={handleUpdateDocumentType}
                    onUpdateTripComuna={handleUpdateTripComuna}
                    onUpdateTripWeight={handleUpdateTripWeight}
                    onUpdateTripSector={handleUpdateTripSector}
                    onUpdateTripObservation={handleUpdateTripObservation}
                    isUnlocked={true}
                    availableComunas={Array.from(new Set([...blaComunaMatrix.map(c => c.comuna), ...l03ComunaMatrix.map(c => c.comuna)])).sort()}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 gap-4 opacity-50">
                    <div className="p-6 bg-slate-100 rounded-full">
                      <FileText size={48} className="text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-slate-800 uppercase tracking-widest">Sin datos de liquidación</p>
                      <p className="text-sm text-slate-500 font-medium">No hay registros que coincidan con los filtros o la liquidación está vacía.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pivot' && (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-widest">Resumen por Local de Origen</h3>
                <PivotTable trips={tripsWithCost} />
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-widest">Liquidación por Transportista</h3>
                <CarrierSummaryTable trips={tripsWithCost} />
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><DbIcon size={24} /></div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Base de Datos de Guías (Master)</h3>
                      <p className="text-sm text-slate-500">Cargue un archivo maestro para habilitar el autocompletado.</p>
                    </div>
                  </div>
                  {masterData.length > 0 && (
                    <button onClick={handleClearMasterData} className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-black uppercase">
                      <Trash2 size={16} /> Limpiar Base
                    </button>
                  )}
                </div>
                <div className="max-w-2xl">
                  <DatabaseUpload type="MASTER_DATA" onDataLoaded={(data) => onMasterDataLoaded(data as MasterDataEntry[])} />
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Save size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Configuración de Tarifas y Sectores</h3>
                      <p className="text-sm text-slate-500">Gestione los precios por peso y mapeo de comunas.</p>
                    </div>
                  </div>
                  <button onClick={resetToFactorySettings} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200">
                    Restaurar Valores por Defecto
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-black text-slate-500 uppercase mb-3 flex items-center gap-2"><Map size={14} /> Comunas BLA</p>
                    <DatabaseUpload type="COMUNA_MATRIX" onDataLoaded={(data) => setBlaComunaMatrix(data as ComunaMapping[])} />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-black text-slate-500 uppercase mb-3 flex items-center gap-2"><Map size={14} /> Comunas L03</p>
                    <DatabaseUpload type="COMUNA_MATRIX" onDataLoaded={(data) => setL03ComunaMatrix(data as ComunaMapping[])} />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-black text-slate-500 uppercase mb-3 flex items-center gap-2"><Calculator size={14} /> Tarifas Urbanas</p>
                    <DatabaseUpload type="RATES_MATRIX" onDataLoaded={(data) => setDynamicUrbanRates(data as UrbanRate[])} />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-black text-slate-500 uppercase mb-3 flex items-center gap-2"><Navigation size={14} /> Matriz Interurbana</p>
                    <DatabaseUpload type="INTERURBAN_MATRIX" onDataLoaded={(data) => setDynamicInterurbanRates(data as InterurbanRate[])} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
