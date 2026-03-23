
import React, { useState, useEffect, useMemo } from 'react';
import { TripType, TRIP_TYPE_LABELS, TRIP_MULTIPLIERS, MasterDataEntry, ComunaMapping, UrbanRate, InterurbanRate, CalculationResult } from '../types';
import { CARRIERS, CARRIER_PATENTS } from '../constants';
import { Search, CheckCircle2, AlertCircle, Truck, Calculator, Info, ArrowRight, MapPin, CreditCard, Building2, PlusCircle, Home, MessageSquare, Navigation, XCircle, Store, Coins, FileCheck, AlertTriangle } from 'lucide-react';
import { getSectorByComuna, calculateFreightCost, parseChileanNumber } from '../services/calculator';

interface TripFormProps {
  onSubmit: (trip: any) => void;
  masterData: MasterDataEntry[];
  blaComunaMatrix: ComunaMapping[];
  l03ComunaMatrix: ComunaMapping[];
  ratesMatrix: UrbanRate[];
  interurbanRatesMatrix: InterurbanRate[];
  existingGuideNumbers: string[];
  persistedState: {
    carrier: string;
    hub: 'BLA' | 'L03';
    documentType: 'GDF' | 'GET';
    driver: string;
    patent: string;
  };
  onPersistedStateChange: (newState: any) => void;
}

const TripForm: React.FC<TripFormProps> = ({ 
  onSubmit, 
  masterData, 
  blaComunaMatrix,
  l03ComunaMatrix,
  ratesMatrix, 
  interurbanRatesMatrix,
  existingGuideNumbers,
  persistedState,
  onPersistedStateChange
}) => {
  const getLocalNow = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    guideNumber: '',
    billNumber: '',
    documentType: persistedState.documentType,
    hub: persistedState.hub,
    carrier: persistedState.carrier,
    patent: persistedState.patent || CARRIER_PATENTS[persistedState.carrier]?.[0] || '',
    driver: persistedState.driver,
    deliveryDate: new Date().toISOString().split('T')[0],
    entryDate: getLocalNow(),
    address: '',
    comuna: '',
    weight: '' as string,
    toll: '' as string,
    kilometers: '' as string,
    type: TripType.NORMAL,
    observation: '',
    originLocation: ''
  });

  const [matchFound, setMatchFound] = useState<boolean | null>(null);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState<boolean>(false);
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);
  const [justSubmitted, setJustSubmitted] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState(false);

  const availablePatents = useMemo(() => CARRIER_PATENTS[formData.carrier] || [], [formData.carrier]);

  const isInterurban = formData.type === TripType.INTERURBANO;
  const isUnmapped = calcResult?.error === 'Comuna no mapeada';
  
  const isSubmitDisabled = 
    (isAlreadyRegistered && !justSubmitted) || 
    matchFound !== true || 
    (isUnmapped && !isInterurban) || 
    (isInterurban && (!formData.kilometers || Number(formData.kilometers) <= 0)) ||
    (isInterurban && formData.toll === '');

  // Sincronizar cambios en transportista/hub con el estado persistente del padre
  useEffect(() => {
    onPersistedStateChange({
      carrier: formData.carrier,
      hub: formData.hub,
      documentType: formData.documentType,
      driver: formData.driver,
      patent: formData.patent
    });
  }, [formData.carrier, formData.hub, formData.documentType, formData.driver, formData.patent]);

  useEffect(() => {
    if (!availablePatents.includes(formData.patent)) {
      setFormData(prev => ({ ...prev, patent: availablePatents[0] || '' }));
    }
  }, [availablePatents, formData.carrier]);

  useEffect(() => {
    const currentGuide = formData.guideNumber.toLowerCase().trim();
    if (currentGuide === '') {
      setMatchFound(null);
      setIsAlreadyRegistered(false);
      setFormData(prev => ({ ...prev, originLocation: '' }));
      setJustSubmitted(false);
      return;
    }

    const registered = existingGuideNumbers.includes(currentGuide);
    const match = masterData.find(m => m.guideNumber.toLowerCase().trim() === currentGuide);

    setIsAlreadyRegistered(registered);

    if (match) {
      if (!justSubmitted) {
        // Sanitizar observación del maestro si es "0"
        const cleanObs = (match.observation?.trim() === '0' || !match.observation) ? '' : match.observation;

        setFormData(prev => ({
          ...prev,
          driver: match.driver || prev.driver,
          billNumber: match.billNumber || '',
          deliveryDate: match.deliveryDate || prev.deliveryDate,
          address: match.address || prev.address,
          comuna: match.comuna || prev.comuna,
          weight: Math.round(match.weight).toString(),
          observation: cleanObs || prev.observation,
          originLocation: match.originLocation || 'LOCAL NO ESPECIFICADO'
        }));
      }
      setMatchFound(true);
    } else {
      setMatchFound(false);
      setFormData(prev => ({ ...prev, originLocation: '' }));
    }
  }, [formData.guideNumber, masterData, existingGuideNumbers, justSubmitted]);

  useEffect(() => {
    const numericWeight = parseChileanNumber(formData.weight);
    const numericToll = parseChileanNumber(formData.toll);
    const numericKm = parseChileanNumber(formData.kilometers);
    const activeComunaMatrix = formData.hub === 'BLA' ? blaComunaMatrix : l03ComunaMatrix;
    
    const result = calculateFreightCost({
      comuna: formData.comuna,
      weight: numericWeight,
      toll: numericToll,
      type: formData.type,
      km: numericKm,
      customComunaMatrix: activeComunaMatrix,
      customUrbanRates: ratesMatrix,
      customInterurbanRates: interurbanRatesMatrix
    });
    setCalcResult(result);
  }, [formData.comuna, formData.weight, formData.toll, formData.type, formData.kilometers, formData.hub, blaComunaMatrix, l03ComunaMatrix, ratesMatrix, interurbanRatesMatrix]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // Si la observación es "0", guardamos como vacío
    const finalObservation = formData.observation?.trim() === '0' ? '' : (formData.observation || '');

    const finalData = { 
      ...formData, 
      observation: finalObservation,
      weight: parseChileanNumber(formData.weight),
      toll: parseChileanNumber(formData.toll),
      kilometers: parseChileanNumber(formData.kilometers)
    };
    
    onSubmit(finalData);
    
    setJustSubmitted(true);

    setFormData(prev => ({
      ...prev,
      address: '',
      comuna: '',
      weight: '',
      billNumber: '',
      toll: '',
      kilometers: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      observation: '',
      originLocation: ''
    }));
  };

  const handleGuideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setJustSubmitted(false);
    setFormData(p => ({ ...p, guideNumber: value }));
  };

  const currentComunaList = useMemo(() => {
    const matrix = formData.hub === 'BLA' ? blaComunaMatrix : l03ComunaMatrix;
    return Array.from(new Set(matrix.map(c => c.comuna))).sort();
  }, [formData.hub, blaComunaMatrix, l03ComunaMatrix]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><PlusCircle size={24} /></div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Registrar Pago</h3>
              <p className="text-sm text-slate-500">Cargue la guía para autocompletar.</p>
            </div>
          </div>
          
          {formData.originLocation && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl animate-in zoom-in duration-300">
              <Store className="text-indigo-600" size={18} />
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Local de Origen</p>
                <p className="text-sm font-black text-indigo-900 uppercase">{formData.originLocation}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Building2 size={16} /> Hub de Origen</label>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              <button 
                type="button" 
                onClick={() => setFormData(p => ({...p, hub: 'BLA'}))}
                className={`flex-1 py-3 px-4 rounded-lg font-black text-sm transition-all ${formData.hub === 'BLA' ? 'bg-white text-blue-600 shadow-sm scale-100' : 'text-slate-500 hover:bg-slate-200 scale-95 opacity-60'}`}
              >
                BLA
              </button>
              <button 
                type="button" 
                onClick={() => setFormData(p => ({...p, hub: 'L03'}))}
                className={`flex-1 py-3 px-4 rounded-lg font-black text-sm transition-all ${formData.hub === 'L03' ? 'bg-white text-blue-600 shadow-sm scale-100' : 'text-slate-500 hover:bg-slate-200 scale-95 opacity-60'}`}
              >
                L03
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><FileCheck size={16} /> Tipo Doc.</label>
            <select
              className="w-full px-4 py-3 border border-slate-300 rounded-xl font-black bg-white focus:ring-4 focus:ring-blue-100 outline-none appearance-none"
              value={formData.documentType}
              onChange={e => setFormData(p => ({ ...p, documentType: e.target.value as 'GDF' | 'GET' }))}
            >
              <option value="GDF">GDF</option>
              <option value="GET">GET</option>
            </select>
          </div>

          <div className="space-y-2 col-span-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Search size={16} /> Número de Guía</label>
            <div className="relative">
              <input
                required
                className={`w-full pl-4 pr-12 py-3 border rounded-xl outline-none transition-all text-lg font-mono ${
                  justSubmitted ? 'border-blue-500 ring-4 ring-blue-50 bg-blue-50/30' :
                  isAlreadyRegistered ? 'border-red-500 ring-4 ring-red-100 bg-red-50' :
                  matchFound === false && formData.guideNumber !== '' ? 'border-amber-500 ring-4 ring-amber-100 bg-amber-50' :
                  matchFound === true ? 'border-green-500 ring-4 ring-green-100' : 
                  'border-slate-300 focus:border-blue-500'
                }`}
                value={formData.guideNumber}
                onChange={handleGuideChange}
                placeholder="Ej: 714337"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {justSubmitted ? <CheckCircle2 className="text-blue-500 animate-bounce" size={20} /> :
                 isAlreadyRegistered ? <XCircle className="text-red-500" size={20} /> :
                 matchFound === false && formData.guideNumber !== '' ? <AlertCircle className="text-amber-500" size={20} /> :
                 matchFound === true ? <CheckCircle2 className="text-green-500" size={20} /> : null}
              </div>
            </div>
            <div className="min-h-[20px] mt-1">
              {justSubmitted ? (
                 <p className="text-[11px] font-black text-blue-600 flex items-center gap-1 uppercase animate-in fade-in">
                  <CheckCircle2 size={12} /> Guía registrada con éxito. Ingrese otra guía para continuar.
                </p>
              ) : (
                <>
                  {isAlreadyRegistered && (
                    <p className="text-[11px] font-black text-red-600 flex items-center gap-1 uppercase animate-in fade-in">
                      <XCircle size={12} /> Error: Esta guía ya ha sido registrada previamente.
                    </p>
                  )}
                  {matchFound === false && formData.guideNumber !== '' && (
                    <p className="text-[11px] font-black text-amber-600 flex items-center gap-1 uppercase animate-in fade-in">
                      <AlertCircle size={12} /> Error: Guía no encontrada en base maestra.
                    </p>
                  )}
                  {matchFound === true && (
                    <p className="text-[11px] font-black text-green-600 flex items-center gap-1 uppercase animate-in fade-in">
                      <CheckCircle2 size={12} /> Guía válida - Procedencia: {formData.originLocation}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Truck size={16} /> Empresa Transportista</label>
            <select
              className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold bg-white"
              value={formData.carrier}
              onChange={e => setFormData(p => ({ ...p, carrier: e.target.value }))}
            >
              {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><CreditCard size={16} /> Patente</label>
            <select
              className="w-full px-4 py-3 border border-slate-300 rounded-xl font-black bg-slate-50"
              value={formData.patent}
              onChange={e => setFormData(p => ({ ...p, patent: e.target.value }))}
            >
              {availablePatents.map(pat => <option key={pat} value={pat}>{pat}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Home size={16} /> Dirección de Entrega</label>
          <input
            className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 font-medium"
            value={formData.address}
            onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
            placeholder="La dirección se cargará automáticamente"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-700">Comuna de Destino ({formData.hub})</label>
              {calcResult?.sector && !isInterurban && (
                <div className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase"><MapPin size={10} className="inline mr-1" /> Sector {calcResult.sector}</div>
              )}
              {isInterurban && (
                <div className="bg-orange-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase"><Navigation size={10} className="inline mr-1" /> Interurbano</div>
              )}
            </div>
            <input
              list="comunas-list-form"
              className={`w-full px-4 py-3 border rounded-xl outline-none uppercase font-black transition-all ${
                isUnmapped && !isInterurban ? 'border-red-500 text-red-600 bg-red-50 ring-2 ring-red-100' : 'border-slate-300 text-blue-600'
              }`}
              value={formData.comuna}
              onChange={e => setFormData(p => ({ ...p, comuna: e.target.value }))}
              placeholder="Escriba la comuna..."
            />
            <datalist id="comunas-list-form">
              {currentComunaList.map((c, i) => <option key={i} value={c} />)}
            </datalist>
            {isUnmapped && !isInterurban && (
              <p className="text-[10px] font-black text-red-600 flex items-center gap-1 uppercase tracking-tighter animate-pulse">
                <AlertTriangle size={12} /> Comuna no mapeada. Cambie el servicio a INTERURBANO para continuar.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Tipo Servicio</label>
            <select 
              className={`w-full px-4 py-3 border rounded-xl bg-slate-50 font-black transition-all ${
                isUnmapped && !isInterurban ? 'ring-4 ring-red-500/20 border-red-500 animate-bounce' : 'border-slate-300 text-orange-700'
              }`} 
              value={formData.type} 
              onChange={e => setFormData(p => ({ ...p, type: e.target.value as TripType }))}
            >
              {Object.keys(TRIP_MULTIPLIERS).map(type => (
                <option key={type} value={type}>{TRIP_TYPE_LABELS[type as TripType]} ({(TRIP_MULTIPLIERS[type as TripType] * 100)}%)</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Peso (Kg)</label>
            <input 
              className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold" 
              value={formData.weight} 
              onChange={e => setFormData(p => ({ ...p, weight: e.target.value.replace(/\D/g, '') }))} 
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Coins size={16} className="text-amber-500" /> Peaje ($)</label>
            <input 
              className={`w-full px-4 py-3 border rounded-xl font-black transition-all ${
                isInterurban && formData.toll === '' ? 'border-orange-500 ring-2 ring-orange-100 bg-orange-50' : 'border-slate-300 text-amber-700 bg-amber-50/30'
              }`} 
              value={formData.toll} 
              onChange={e => setFormData(p => ({ ...p, toll: e.target.value.replace(/\D/g, '') }))} 
              placeholder="0"
            />
            {isInterurban && formData.toll === '' && (
               <p className="text-[9px] font-black text-orange-600 uppercase tracking-tighter">Ingrese monto de peaje (aunque sea 0)</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Fecha Entrega</label>
            <input type="date" className="w-full px-4 py-3 border border-slate-300 rounded-xl font-medium" value={formData.deliveryDate} onChange={e => setFormData(p => ({ ...p, deliveryDate: e.target.value }))} />
          </div>
        </div>

        {isInterurban && (
          <div className="p-6 bg-orange-50 border border-orange-200 rounded-2xl mb-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-200 text-orange-700 rounded-lg"><Navigation size={20} /></div>
              <h4 className="font-bold text-orange-900">Configuración de Ruta Interurbana</h4>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-orange-800">Distancia Recorrida (Kilómetros)</label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  className={`w-full px-4 py-4 border-2 rounded-xl font-black text-2xl outline-none transition-all placeholder:text-orange-200 ${
                    Number(formData.kilometers) <= 0 ? 'border-red-400 focus:ring-red-100 bg-white' : 'border-orange-300 focus:ring-orange-100 text-orange-700'
                  }`} 
                  value={formData.kilometers} 
                  onChange={e => setFormData(p => ({ ...p, kilometers: e.target.value.replace(/\D/g, '') }))} 
                  placeholder="0"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-300 font-black">KM</div>
              </div>
              <p className="text-[10px] font-bold text-orange-600 uppercase mt-1">El costo se calculará multiplicando el valor/km por la distancia total.</p>
            </div>
          </div>
        )}

        <div className="space-y-2 mt-6">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MessageSquare size={16} /> Observación</label>
          <textarea
            className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 font-medium resize-none"
            rows={2}
            value={formData.observation}
            onChange={e => setFormData(p => ({ ...p, observation: e.target.value }))}
            placeholder="Notas adicionales..."
          />
        </div>
      </div>

      {calcResult && (formData.comuna || formData.weight || formData.toll) && (
        <div className={`p-6 rounded-2xl shadow-xl border transition-all ${calcResult.error ? 'bg-red-900 border-red-700' : 'bg-slate-900 border-slate-700'}`}>
           <div className="flex flex-col gap-4">
             <div className="flex justify-between items-start">
               <div className="flex items-center gap-3 text-white">
                 <div className="p-2 bg-blue-600 rounded-lg"><Calculator size={20} /></div>
                 <h4 className="font-bold text-sm uppercase tracking-widest">Pre-Liquidación {formData.hub}</h4>
               </div>
               {(isInterurban || parseChileanNumber(formData.toll) > 0) && calcResult.baseCost > 0 && (
                 <div className="flex flex-col items-end gap-1">
                    {parseChileanNumber(formData.toll) > 0 && (
                      <div className="bg-amber-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                        <Coins size={10} /> + ${parseChileanNumber(formData.toll).toLocaleString('es-CL')} PEAJE
                      </div>
                    )}
                 </div>
               )}
             </div>
             {calcResult.error ? (
               <p className="text-red-300 text-sm font-medium uppercase tracking-tighter flex items-center gap-2">
                 <AlertTriangle size={16} /> {calcResult.error}
               </p>
             ) : (
               <div className="flex justify-between items-end border-t border-white/10 pt-4">
                 <div className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">
                   {isInterurban ? (
                     `Flete: ${(calcResult.baseCost / (Number(formData.kilometers) || 1)).toLocaleString('es-CL')} x ${formData.kilometers} KM`
                   ) : (
                     `Tarifa Matriz: $${calcResult.baseCost.toLocaleString('es-CL')} (Serv: x${TRIP_MULTIPLIERS[formData.type]})`
                   )}
                   {parseChileanNumber(formData.toll) > 0 && ` + $${parseChileanNumber(formData.toll).toLocaleString('es-CL')} Peaje`}
                 </div>
                 <div className="text-right">
                   <span className="text-blue-400 text-[10px] font-black uppercase block mb-1">Monto Total Liquidar</span>
                   <span className="text-white text-4xl font-black tabular-nums">${calcResult.finalCost.toLocaleString('es-CL')}</span>
                 </div>
               </div>
             )}
           </div>
        </div>
      )}

      <button 
        type="submit" 
        className={`w-full py-5 font-black text-lg rounded-2xl shadow-xl transition-all uppercase tracking-wider ${
          justSubmitted ? 'bg-green-600 text-white shadow-green-200' :
          isSubmitDisabled ? 'bg-slate-200 text-slate-400 opacity-60' : 'bg-blue-600 text-white hover:bg-blue-700 ring-4 ring-blue-100'
        } ${isShaking ? 'animate-shake' : ''}`}
      >
        {justSubmitted ? 'REGISTRADO CON ÉXITO' : 
         isAlreadyRegistered ? 'REVISAR ERRORES EN GUÍA' : 
         isUnmapped && !isInterurban ? 'REQUERIDO: CAMBIAR A INTERURBANO' :
         isInterurban && (!formData.kilometers || Number(formData.kilometers) <= 0) ? 'FALTA KM Y PEAJE' :
         'Registrar Pago'}
      </button>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.1s ease-in-out 0s 5; }
      `}</style>
    </form>
  );
};

export default TripForm;
