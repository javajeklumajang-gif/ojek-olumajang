import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Layers, Check } from 'lucide-react';
import { LocationPoint } from '../types';
import { LUMAJANG_LANDMARKS } from '../services/mapsService';

interface MapPlaceholderProps {
  pickupLocation: string;
  dropoffLocation: string;
  distanceKm: number;
  onSelectPickup?: (point: LocationPoint) => void;
  onSelectDropoff?: (point: LocationPoint) => void;
  mode?: 'view' | 'selectPickup' | 'selectDropoff';
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  pickupLocation,
  dropoffLocation,
  distanceKm,
  onSelectPickup,
  onSelectDropoff,
  mode = 'view',
}) => {
  const [activeSelectType, setActiveSelectType] = useState<'pickup' | 'dropoff'>('pickup');
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);

  const handleLandmarkClick = (point: LocationPoint, index: number) => {
    setActivePresetIndex(index);
    if (activeSelectType === 'pickup' && onSelectPickup) {
      onSelectPickup(point);
    } else if (activeSelectType === 'dropoff' && onSelectDropoff) {
      onSelectDropoff(point);
    }
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-emerald-100 bg-emerald-50/40 shadow-xs">
      {/* Map Header / Controls */}
      <div className="bg-emerald-800 text-white px-3.5 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
          <span className="font-semibold">Simulasi Peta Wilayah Lumajang</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] bg-emerald-700/80 px-2 py-0.5 rounded-full text-emerald-100">
          <Compass className="w-3 h-3 text-emerald-300" />
          <span>Jarak: <strong>{distanceKm} km</strong></span>
        </div>
      </div>

      {/* Stylized Visual Map Stage */}
      <div className="relative h-48 sm:h-56 bg-gradient-to-b from-emerald-100/60 via-emerald-50/80 to-slate-100 overflow-hidden border-b border-emerald-100 flex items-center justify-center select-none">
        {/* Decorative Grid Lines & Road Simulation */}
        <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#059669" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Main Roads Simulation (Jalan Nasional Lumajang) */}
          <path
            d="M -10 150 Q 120 120 220 160 T 450 90 T 700 130"
            fill="none"
            stroke="#ffffff"
            strokeWidth="10"
          />
          <path
            d="M -10 150 Q 120 120 220 160 T 450 90 T 700 130"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          {/* Cross Road */}
          <path
            d="M 160 -10 Q 180 90 220 160 T 260 300"
            fill="none"
            stroke="#ffffff"
            strokeWidth="8"
          />
          {/* Route Line connecting points */}
          <path
            d="M 120 130 Q 200 80 300 110"
            fill="none"
            stroke="#16a34a"
            strokeWidth="4"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Semeru Mountain Silhouette In Background */}
        <div className="absolute top-2 right-4 opacity-20 pointer-events-none text-right">
          <span className="text-[10px] font-bold text-slate-700 tracking-wider">▲ Gn. Semeru (3.676 mdpl)</span>
        </div>

        {/* Map Center Pins */}
        {/* Pickup Pin */}
        <div className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-md whitespace-nowrap mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            Jemput: {pickupLocation.slice(0, 16) || 'Alun-Alun'}
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg ring-4 ring-emerald-200">
            <MapPin className="w-4 h-4 fill-current" />
          </div>
        </div>

        {/* Route Dot Pulse */}
        <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2">
          <div className="px-2 py-0.5 rounded-md bg-white/90 text-emerald-800 text-[10px] font-bold shadow-xs border border-emerald-200">
            {distanceKm} km
          </div>
        </div>

        {/* Dropoff Pin */}
        <div className="absolute right-1/4 top-[40%] translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold shadow-md whitespace-nowrap mb-1 flex items-center gap-1">
            Tujuan: {dropoffLocation.slice(0, 16) || 'Stasiun Klakah'}
          </div>
          <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg ring-4 ring-rose-200">
            <MapPin className="w-4 h-4 fill-current" />
          </div>
        </div>

        {/* Bottom Banner Notice */}
        <div className="absolute bottom-2 inset-x-3 bg-white/90 backdrop-blur-xs py-1 px-2.5 rounded-lg border border-emerald-100 flex items-center justify-between text-[10px] text-gray-600">
          <span>✓ Mode Pratinjau Siap API Google Maps</span>
          <span className="text-emerald-700 font-semibold">Kabupaten Lumajang</span>
        </div>
      </div>

      {/* Point Selection Helper Bar if interactive */}
      {(onSelectPickup || onSelectDropoff) && (
        <div className="p-3 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700">Pilih Cepat Titik Lokasi:</span>
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[10px]">
              <button
                type="button"
                onClick={() => setActiveSelectType('pickup')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  activeSelectType === 'pickup'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Untuk Jemput
              </button>
              <button
                type="button"
                onClick={() => setActiveSelectType('dropoff')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  activeSelectType === 'dropoff'
                    ? 'bg-rose-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Untuk Tujuan
              </button>
            </div>
          </div>

          {/* Quick Landmark Chips */}
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {LUMAJANG_LANDMARKS.slice(0, 6).map((lm, idx) => (
              <button
                key={lm.name}
                type="button"
                onClick={() => handleLandmarkClick(lm, idx)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition flex items-center gap-1 ${
                  activePresetIndex === idx
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MapPin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                <span className="truncate max-w-[140px]">{lm.name}</span>
                {activePresetIndex === idx && <Check className="w-3 h-3 text-emerald-600 ml-0.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
