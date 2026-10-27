import React, { useEffect, useState, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Truck,
  ArrowRight,
  ShieldCheck,
  Clock,
  Compass,
  CheckCircle2,
  Sliders,
  Layers,
  Sparkles,
  AlertTriangle,
  Scale,
  DollarSign,
  Fuel,
  Info,
  FileText,
  Copy,
  Check,
  Share2,
  ExternalLink,
} from 'lucide-react';
import {
  resolveCoordinates,
  calculateDistanceKm,
  COMMERCIAL_VEHICLE_PROFILES,
  getCommercialTransportRouting,
  VehicleProfile,
  CorridorRoutePlan,
  FreightWaypoint,
} from '../utils/geoUtils';
import { soundManager } from '../utils/audioCues';

declare const google: any;

const DEFAULT_MAPS_KEY =
  (typeof process !== 'undefined' && process.env?.VITE_GOOGLE_MAPS_API_KEY) ||
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyBXRbVbU9FL2mH4oDEyplqekcfBMRF1Izo';

export interface RouteLogisticsConfig {
  originCountry: string;
  originProvince: string;
  originCity: string;
  originAddress: string;
  destCountry: string;
  destProvince: string;
  destCity: string;
  destAddress: string;
}

export interface OriginDestinationMapProps {
  config: RouteLogisticsConfig;
  onChangeConfig?: (newConfig: RouteLogisticsConfig) => void;
  onConfigChange?: (newConfig: RouteLogisticsConfig) => void;
  onApplyToEmails?: (originText: string, destText: string) => void;
  className?: string;
  compact?: boolean;
  hideInputs?: boolean;
}

// Sub-component to draw both freight route polylines and auto-fit map bounds
function MultiRoutePolylineAndBounds({
  primaryPath,
  alternativePath,
  showPrimary,
  showAlternative,
}: {
  primaryPath: { lat: number; lng: number }[];
  alternativePath: { lat: number; lng: number }[];
  showPrimary: boolean;
  showAlternative: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    const polylines: any[] = [];
    const bounds = new google.maps.LatLngBounds();

    // 1. Primary Freight Corridor (Amber solid line)
    if (showPrimary && primaryPath.length > 0) {
      const primaryLine = new google.maps.Polyline({
        path: primaryPath,
        geodesic: true,
        strokeColor: '#f59e0b', // Amber-500
        strokeOpacity: 0.95,
        strokeWeight: 5,
        map,
      });
      polylines.push(primaryLine);
      primaryPath.forEach((pt) => bounds.extend(pt));
    }

    // 2. Secondary "Clear Road" Alternative Route (Emerald dashed line)
    if (showAlternative && alternativePath.length > 0) {
      const lineSymbol = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: 4,
      };

      const altLine = new google.maps.Polyline({
        path: alternativePath,
        geodesic: true,
        strokeColor: '#10b981', // Emerald-500
        strokeOpacity: 0.9,
        strokeWeight: 4,
        icons: [
          {
            icon: lineSymbol,
            offset: '0',
            repeat: '20px',
          },
        ],
        map,
      });
      polylines.push(altLine);
      alternativePath.forEach((pt) => bounds.extend(pt));
    }

    // Auto-fit bounds if we have waypoints
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }

    return () => {
      polylines.forEach((p) => p.setMap(null));
    };
  }, [map, primaryPath, alternativePath, showPrimary, showAlternative]);

  return null;
}

export const OriginDestinationMap: React.FC<OriginDestinationMapProps> = ({
  config,
  onChangeConfig,
  onConfigChange,
  onApplyToEmails,
  className = '',
  compact = false,
  hideInputs = false,
}) => {
  const updateConfig = onConfigChange || onChangeConfig || (() => {});
  const [apiKey] = useState<string>(DEFAULT_MAPS_KEY);
  const [mapError] = useState<string | null>(null);

  // Active Vehicle / Cargo Profile (Default: Semi-Truck / Tri-Axle Flatbed carrying Heavy Machinery)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('flatbed_heavy_machinery');

  // Active Corridor Route Selection on the Map
  const [activeCorridorTab, setActiveCorridorTab] = useState<'both' | 'primary' | 'alternative'>('both');

  // Active Analysis Section Tab
  const [activeAnalysisSection, setActiveAnalysisSection] = useState<'corridors' | 'conditions' | 'alternative' | 'vehicle'>('corridors');

  // Selected Waypoint / Hazard for details card
  const [selectedWaypoint, setSelectedWaypoint] = useState<FreightWaypoint | null>(null);
  const [copiedWaybill, setCopiedWaybill] = useState<boolean>(false);

  // Compute full Commercial Transport Routing
  const routing = useMemo(
    () =>
      getCommercialTransportRouting(
        config.originCity,
        config.originCountry,
        config.destCity,
        config.destCountry,
        selectedVehicleId
      ),
    [config.originCity, config.originCountry, config.destCity, config.destCountry, selectedVehicleId]
  );

  const originCoords = useMemo(
    () => resolveCoordinates(config.originCity, config.originProvince, config.originCountry),
    [config.originCity, config.originProvince, config.originCountry]
  );

  const destCoords = useMemo(
    () => resolveCoordinates(config.destCity, config.destProvince, config.destCountry),
    [config.destCity, config.destProvince, config.destCountry]
  );

  // Popular regional corridors
  const ROUTE_PRESETS = [
    {
      label: '🇿🇦 Johannesburg ➔ 🇿🇲 Kitwe (Copperbelt)',
      originCountry: 'South Africa',
      originProvince: 'Gauteng',
      originCity: 'Johannesburg',
      originAddress: 'Industrial Zone, Johannesburg, South Africa',
      destCountry: 'Zambia',
      destProvince: 'Copperbelt',
      destCity: 'Kitwe',
      destAddress: 'Chibuluma Rd, Kitwe Mining Corridor, Zambia',
    },
    {
      label: '🇿🇦 Johannesburg ➔ 🇿🇲 Lusaka (Capital)',
      originCountry: 'South Africa',
      originProvince: 'Gauteng',
      originCity: 'Johannesburg',
      originAddress: 'Johannesburg Freight Depot, South Africa',
      destCountry: 'Zambia',
      destProvince: 'Lusaka Province',
      destCity: 'Lusaka',
      destAddress: 'Heavy Industrial Area, Lumumba Road, Lusaka, Zambia',
    },
    {
      label: '🇿🇦 Johannesburg ➔ 🇿🇲 Solwezi (Mines)',
      originCountry: 'South Africa',
      originProvince: 'Gauteng',
      originCity: 'Johannesburg',
      originAddress: 'Atlas Safety Factory, Johannesburg, South Africa',
      destCountry: 'Zambia',
      destProvince: 'North-Western Province',
      destCity: 'Solwezi',
      destAddress: 'Kansanshi Mine Road, Solwezi, Zambia',
    },
    {
      label: '🇿🇦 Durban Port ➔ 🇿🇲 Ndola (Hub)',
      originCountry: 'South Africa',
      originProvince: 'KwaZulu-Natal',
      originCity: 'Durban',
      originAddress: 'Durban Sea Port & Container Depot, South Africa',
      destCountry: 'Zambia',
      destProvince: 'Copperbelt',
      destCity: 'Ndola',
      destAddress: 'Kabwe Road Industrial Corridor, Ndola, Zambia',
    },
  ];

  const handleSelectPreset = (p: typeof ROUTE_PRESETS[0]) => {
    // Preserve custom address if user has already entered one!
    const keepDestAddress = Boolean(config.destAddress && config.destAddress.trim().length > 0);
    const keepOrigAddress = Boolean(config.originAddress && config.originAddress.trim().length > 0);

    updateConfig({
      originCountry: p.originCountry,
      originProvince: p.originProvince,
      originCity: p.originCity,
      originAddress: keepOrigAddress ? config.originAddress : p.originAddress,
      destCountry: p.destCountry,
      destProvince: p.destProvince,
      destCity: p.destCity,
      destAddress: keepDestAddress ? config.destAddress : p.destAddress,
    });
  };

  const handleCopyRoutingWaybill = () => {
    const text = `COMMERCIAL FREIGHT ROUTING MANIFEST & CLEARANCE GUIDE
=====================================================
Cargo/Vehicle: ${routing.vehicle.name}
GVM Limit: ${(routing.vehicle.maxGrossVehicleMassKg / 1000).toFixed(0)}t | Axle Config: ${routing.vehicle.axleConfiguration}
Origin: ${config.originCity}, ${config.originCountry} (${config.originAddress || 'Main Depot'})
Destination: ${config.destCity}, ${config.destCountry} (${config.destAddress || 'Receiving Yard'})

1. PRIMARY PREFERRED FREIGHT CORRIDOR:
Highways: ${routing.primaryCorridor.highwaysUsed.join(' ➔ ')}
Distance: ${routing.primaryCorridor.totalDistanceKm} km | Est. Transit: ${routing.primaryCorridor.estimatedTransitTime}
Border Crossings: ${routing.primaryCorridor.borderCrossing}
Tolls: ${routing.primaryCorridor.tollCount} plazas (~$${routing.primaryCorridor.estimatedTollCostUSD} USD)
Key Warning: Chirundu Escarpment (14 km steep descent 10-12% grade, low gear required).

2. SECONDARY "CLEAR ROAD" ALTERNATIVE CORRIDOR:
Highways: ${routing.alternativeCorridor.highwaysUsed.join(' ➔ ')}
Distance: ${routing.alternativeCorridor.totalDistanceKm} km | Est. Transit: ${routing.alternativeCorridor.estimatedTransitTime}
Border Crossing: ${routing.alternativeCorridor.borderCrossing} (Kazungula Quadripoint Bridge)
Advantage: Bypasses Beitbridge & Chirundu congestion, flat terrain, automated 3-hour cargo scanner.

OPERATING RECOMMENDATION:
${routing.corridorComparison.verdictRecommendation}`;

    try {
      navigator.clipboard.writeText(text);
      setCopiedWaybill(true);
      setTimeout(() => setCopiedWaybill(false), 2500);
      soundManager.playStepSuccess();
    } catch {}
  };

  const originDisplay = `${config.originCity || 'Johannesburg'}${config.originProvince ? `, ${config.originProvince}` : ''}, ${config.originCountry || 'South Africa'}`;
  const destDisplay = `${config.destCity || 'Kitwe'}${config.destProvince ? `, ${config.destProvince}` : ''}, ${config.destCountry || 'Zambia'}`;

  return (
    <div className={`flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl ${className}`}>
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-100">
                Commercial Transport Routing &amp; Freight Corridor Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Heavy Machinery &amp; Mining Freight
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive Google Map routing from {config.originCity}, {config.originCountry} to {config.destCity}, {config.destCountry} with tolls, bridge clearances, and secondary clear road alternatives.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyRoutingWaybill}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            title="Copy Commercial Routing Manifest and Waybill Guide"
          >
            {copiedWaybill ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedWaybill ? 'Manifest Copied!' : 'Copy Route Waybill'}</span>
          </button>

          {onApplyToEmails && (
            <button
              type="button"
              onClick={() => onApplyToEmails(originDisplay, destDisplay)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer"
              title="Automatically bind this Origin and Destination into all 5 email drafts"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply to 5 Outreach Emails</span>
            </button>
          )}
        </div>
      </div>

      {/* Vehicle / Cargo Configuration Selector */}
      <div className="p-3.5 bg-slate-925 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1">
          <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] whitespace-nowrap flex items-center gap-1">
            <Scale className="w-3.5 h-3.5" />
            <span>Vehicle &amp; Cargo:</span>
          </span>

          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {COMMERCIAL_VEHICLE_PROFILES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selected vehicle specs badge */}
        <div className="flex items-center gap-2 text-[11px] text-slate-300 overflow-x-auto">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
            GVM: <strong>{(routing.vehicle.maxGrossVehicleMassKg / 1000).toFixed(0)} Tonnes</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300">
            Clearance: <strong>{routing.vehicle.standardClearanceM}m</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300">
            Deck: <strong>{routing.vehicle.flatbedDeckLengthM}m</strong>
          </span>
        </div>
      </div>

      {/* Origin & Destination Interactive Input Form or Compact Summary */}
      {!hideInputs ? (
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Point A: Sourcing Origin */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                  A
                </span>
                <span>Point A: Sourcing Origin (Where items come from)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {originCoords.lat.toFixed(2)}°, {originCoords.lng.toFixed(2)}°
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Origin Country *</label>
                <input
                  type="text"
                  value={config.originCountry}
                  onChange={(e) => updateConfig({ ...config, originCountry: e.target.value })}
                  placeholder="e.g. South Africa"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-amber-200 focus:outline-none focus:border-amber-400 font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Origin State / Province</label>
                <input
                  type="text"
                  value={config.originProvince}
                  onChange={(e) => updateConfig({ ...config, originProvince: e.target.value })}
                  placeholder="e.g. Gauteng"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Origin City / Area *</label>
                <input
                  type="text"
                  value={config.originCity}
                  onChange={(e) => updateConfig({ ...config, originCity: e.target.value })}
                  placeholder="e.g. Johannesburg"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] text-slate-400 font-semibold">Origin Facility / Street Address (Optional)</label>
                {config.originAddress ? (
                  <button
                    type="button"
                    onClick={() => updateConfig({ ...config, originAddress: `Industrial Zone Depot, ${config.originCity || 'Johannesburg'}, ${config.originCountry || 'South Africa'}` })}
                    className="text-[10px] text-slate-400 hover:text-amber-400 underline cursor-pointer"
                  >
                    ↺ Reset to area default
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateConfig({ ...config, originAddress: `Industrial Zone Depot, ${config.originCity || 'Johannesburg'}, ${config.originCountry || 'South Africa'}` })}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    + Fill area default
                  </button>
                )}
              </div>
              <input
                type="text"
                value={config.originAddress}
                onChange={(e) => updateConfig({ ...config, originAddress: e.target.value })}
                placeholder="e.g. 45 Baragwanath Rd, Industrial Zone, Johannesburg"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Point B: Delivery Destination */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                  B
                </span>
                <span>Point B: Delivery Destination (Where items are going)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {destCoords.lat.toFixed(2)}°, {destCoords.lng.toFixed(2)}°
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Destination Country *</label>
                <input
                  type="text"
                  value={config.destCountry}
                  onChange={(e) => updateConfig({ ...config, destCountry: e.target.value })}
                  placeholder="e.g. Zambia"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-emerald-300 focus:outline-none focus:border-emerald-400 font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Destination State *</label>
                <input
                  type="text"
                  value={config.destProvince}
                  onChange={(e) => updateConfig({ ...config, destProvince: e.target.value })}
                  placeholder="e.g. Copperbelt or Lusaka"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-400 font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Destination City *</label>
                <input
                  type="text"
                  value={config.destCity}
                  onChange={(e) => updateConfig({ ...config, destCity: e.target.value })}
                  placeholder="e.g. Kitwe, Lusaka, Solwezi"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-400 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] text-slate-400 font-semibold">Delivery Site / Mine / Facility Address (Optional)</label>
                {config.destAddress ? (
                  <button
                    type="button"
                    onClick={() => updateConfig({ ...config, destAddress: `Receiving Site Depot, ${config.destCity || 'Kitwe'}, ${config.destCountry || 'Zambia'}` })}
                    className="text-[10px] text-slate-400 hover:text-emerald-400 underline cursor-pointer"
                  >
                    ↺ Reset to area default
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateConfig({ ...config, destAddress: `Receiving Site Depot, ${config.destCity || 'Kitwe'}, ${config.destCountry || 'Zambia'}` })}
                    className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    + Fill area default
                  </button>
                )}
              </div>
              <input
                type="text"
                value={config.destAddress}
                onChange={(e) => updateConfig({ ...config, destAddress: e.target.value })}
                placeholder="e.g. Plot 1290, Chibuluma Road Industrial Mining Depot, Kitwe"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-400 placeholder:text-slate-600"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Compact Active Route Bar when inputs are displayed above the map in the parent container */
        <div className="px-4 py-2 bg-slate-925 border-b border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-slate-400 text-[11px]">Origin:</span>
              <span className="text-amber-300 font-semibold text-[11px]">
                {config.originCity}, {config.originCountry}
                {config.originAddress ? ` (${config.originAddress})` : ''}
              </span>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-400 text-[11px]">Destination:</span>
              <span className="text-emerald-300 font-semibold text-[11px]">
                {config.destCity}, {config.destCountry}
                {config.destAddress ? ` (${config.destAddress})` : ''}
              </span>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 font-mono">
            {calculateDistanceKm(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng)} km geodesic
          </span>
        </div>
      )}

      {/* Quick Location Corridor Presets */}
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-[11px]">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 font-semibold">Quick Corridors:</span>
          {ROUTE_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-amber-400/40 transition whitespace-nowrap cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Route view switch on the map */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-slate-400 font-semibold mr-1">Display on Map:</span>
          <button
            type="button"
            onClick={() => setActiveCorridorTab('both')}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
              activeCorridorTab === 'both'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Both Corridors
          </button>
          <button
            type="button"
            onClick={() => setActiveCorridorTab('primary')}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
              activeCorridorTab === 'primary'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Primary (Beitbridge)
          </button>
          <button
            type="button"
            onClick={() => setActiveCorridorTab('alternative')}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
              activeCorridorTab === 'alternative'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Clear Road (Kazungula)
          </button>
        </div>
      </div>

      {/* Interactive Google Map with Freight Corridors */}
      <div className="w-full relative" style={{ height: compact ? '280px' : '380px' }}>
        {mapError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-900 text-center space-y-2">
            <p className="text-xs text-amber-300">{mapError}</p>
            <p className="text-[11px] text-slate-400">
              Corridor: {originDisplay} ➔ {destDisplay}
            </p>
          </div>
        ) : (
          <APIProvider apiKey={apiKey}>
            <Map
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              defaultCenter={originCoords}
              defaultZoom={5}
              gestureHandling="greedy"
              disableDefaultUI={false}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Point A Marker (Sourcing Origin) */}
              <AdvancedMarker position={originCoords} title={`Point A (Origin): ${originDisplay}`}>
                <div className="flex flex-col items-center group cursor-pointer">
                  <div className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black shadow-lg flex items-center gap-1 border border-amber-300">
                    <span className="w-2 h-2 rounded-full bg-slate-950"></span>
                    <span>POINT A: {config.originCity || 'Origin'}</span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-md mt-0.5"></div>
                </div>
              </AdvancedMarker>

              {/* Point B Marker (Delivery Destination) */}
              <AdvancedMarker position={destCoords} title={`Point B (Destination): ${destDisplay}`}>
                <div className="flex flex-col items-center group cursor-pointer">
                  <div className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-black shadow-lg flex items-center gap-1 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-slate-950"></span>
                    <span>POINT B: {config.destCity || 'Destination'}</span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md mt-0.5"></div>
                </div>
              </AdvancedMarker>

              {/* Key Freight Highway Landmarks */}
              {/* 1. Beitbridge Border Post */}
              <AdvancedMarker
                position={{ lat: -22.2167, lng: 30.0000 }}
                title="Beitbridge Border Post (RSA / Zimbabwe)"
                onClick={() =>
                  setSelectedWaypoint({
                    name: 'Beitbridge Border Post (RSA / Zimbabwe)',
                    location: 'Limpopo / Zimbabwe Border',
                    type: 'border',
                    lat: -22.2167,
                    lng: 30.0000,
                    note: 'Primary commercial freight entry. Automated ZIMRA clearance. Potential 12–36h month-end queue bottleneck.',
                  })
                }
              >
                <div className="flex flex-col items-center cursor-pointer">
                  <div className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-bold shadow border border-slate-900">
                    🚧 Beitbridge
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-950"></div>
                </div>
              </AdvancedMarker>

              {/* 2. Chirundu Escarpment Hazard */}
              <AdvancedMarker
                position={{ lat: -16.2500, lng: 29.1000 }}
                title="Chirundu Escarpment Descent (14 km Dangerous Slope)"
                onClick={() =>
                  setSelectedWaypoint({
                    name: 'Chirundu Mountain Escarpment Descent',
                    location: 'Mashonaland West, Zimbabwe approach',
                    type: 'bottleneck',
                    lat: -16.2500,
                    lng: 29.1000,
                    note: 'Steep 10-12% winding decline. Low gear engine compression braking mandatory. Arrestor beds available.',
                  })
                }
              >
                <div className="flex flex-col items-center cursor-pointer">
                  <div className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-bold shadow border border-red-300 animate-pulse">
                    ⚠️ Chirundu Escarpment
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white"></div>
                </div>
              </AdvancedMarker>

              {/* 3. Kazungula Bridge One-Stop Border Post (Clear Road Alternative) */}
              <AdvancedMarker
                position={{ lat: -17.7889, lng: 25.2603 }}
                title="Kazungula Bridge OSBP (Botswana / Zambia)"
                onClick={() =>
                  setSelectedWaypoint({
                    name: 'Kazungula Bridge One-Stop Border Post',
                    location: 'Zambezi River, Kazungula',
                    type: 'border',
                    lat: -17.7889,
                    lng: 25.2603,
                    note: 'Secondary "Clear Road" alternative crossing. Drive-through cargo scanner, 5.8m bridge clearance, cuts border delay to under 3 hours!',
                  })
                }
              >
                <div className="flex flex-col items-center cursor-pointer">
                  <div className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[9px] font-bold shadow border border-emerald-300">
                    🌉 Kazungula Bridge (Clear Road)
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950"></div>
                </div>
              </AdvancedMarker>

              {/* Polylines for Primary and Secondary Alternative Corridors */}
              <MultiRoutePolylineAndBounds
                primaryPath={routing.primaryCorridor.pathCoordinates}
                alternativePath={routing.alternativeCorridor.pathCoordinates}
                showPrimary={activeCorridorTab === 'both' || activeCorridorTab === 'primary'}
                showAlternative={activeCorridorTab === 'both' || activeCorridorTab === 'alternative'}
              />
            </Map>
          </APIProvider>
        )}

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-10 bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 text-[11px] shadow-lg max-w-sm space-y-1.5">
          <div className="font-bold text-slate-200 flex items-center justify-between border-b border-slate-800 pb-1">
            <span>Freight Route Legend:</span>
            <span className="text-[10px] text-amber-400 font-mono">{(routing.vehicle.maxGrossVehicleMassKg / 1000).toFixed(0)}t GVM</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-amber-500 rounded-full"></span>
            <span className="text-amber-300 font-medium">Primary Corridor (N1 ➔ Beitbridge ➔ Chirundu)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-1 border-b-2 border-dashed border-emerald-400"></span>
            <span className="text-emerald-300 font-medium">Secondary &quot;Clear Road&quot; (Botswana ➔ Kazungula Bridge)</span>
          </div>

          <div className="text-[10px] text-slate-400 pt-0.5 flex items-center gap-1">
            <Info className="w-3 h-3 text-sky-400 shrink-0" />
            <span>Click any waypoint marker on the map to view conditions.</span>
          </div>
        </div>

        {/* Selected Waypoint Detail Card Overlay */}
        {selectedWaypoint && (
          <div className="absolute top-3 right-3 z-10 bg-slate-950/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-700 shadow-xl max-w-xs space-y-2 animate-fadeIn text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                  {selectedWaypoint.type}
                </span>
                <h4 className="font-bold text-slate-100">{selectedWaypoint.name}</h4>
                <p className="text-[11px] text-slate-400">{selectedWaypoint.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWaypoint(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900 p-2 rounded-lg border border-slate-800">
              {selectedWaypoint.note}
            </p>
          </div>
        )}
      </div>

      {/* 4-Tab Commercial Transport Routing Details Section */}
      <div className="bg-slate-950 border-t border-slate-800 p-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-850 pb-3 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveAnalysisSection('corridors')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeAnalysisSection === 'corridors'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-850'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>1. Preferred Freight Corridors</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAnalysisSection('conditions')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeAnalysisSection === 'conditions'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-850'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>2. Road Conditions &amp; Clearances</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAnalysisSection('alternative')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeAnalysisSection === 'alternative'
                ? 'bg-emerald-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-850'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. Alternative Routes (&quot;Clear Road&quot;)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAnalysisSection('vehicle')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeAnalysisSection === 'vehicle'
                ? 'bg-sky-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-850'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-sky-400" />
            <span>4. Vehicle &amp; Cargo Checklist</span>
          </button>
        </div>

        {/* TAB 1: PREFERRED FREIGHT CORRIDORS */}
        {activeAnalysisSection === 'corridors' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  <span>Primary Freight Corridor: {routing.primaryCorridor.name}</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  Road Quality: {routing.primaryCorridor.roadQualityScore}/100
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                This is the standard direct highway network favored by commercial road haulers operating semi-trucks, flatbeds carrying heavy machinery, and consolidated curtain-siders between South Africa and Zambia.
              </p>
            </div>

            {/* Highway by Highway Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">1</span>
                  <span className="font-bold text-slate-100">South Africa Segment (N1)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Dual-lane SANRAL freeway via Pretoria, Kranskop, Polokwane, and Musina. High standard highway with multi-axle truck stops and electronic tolling.
                </p>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">2</span>
                  <span className="font-bold text-slate-100">Zimbabwe Transit (A4 &amp; A1)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Beitbridge border to Masvingo and Harare (A4), continuing along the A1 through Chinhoyi and Karoi. Single-lane paved trunk road with designated overtaking sections.
                </p>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">3</span>
                  <span className="font-bold text-slate-100">Zambia Trunk (T2 &amp; T3)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Chirundu crossing over Zambezi, ascending to Kafue and Lusaka Bypass, then Great North Road (T2) to Kapiri Mposhi and T3 expressway into Ndola and Kitwe.
                </p>
              </div>
            </div>

            {/* Corridor Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Total Road Distance</span>
                <span className="text-sm font-bold text-amber-300">{routing.primaryCorridor.totalDistanceKm} km</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Est. Total Transit</span>
                <span className="text-sm font-bold text-sky-300">{routing.primaryCorridor.estimatedTransitTime}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Toll Plazas Count</span>
                <span className="text-sm font-bold text-emerald-300">{routing.primaryCorridor.tollCount} Plazas</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Estimated Toll Cost</span>
                <span className="text-sm font-bold text-purple-300">~${routing.primaryCorridor.estimatedTollCostUSD} USD</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROAD CONDITIONS, CLEARANCES & TOLLS */}
        {activeAnalysisSection === 'conditions' && (
          <div className="space-y-4 text-xs">
            {/* Toll Plazas Breakdown */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Major Commercial Toll Roads &amp; Plazas ({routing.primaryCorridor.tollPlazas.length} Checkpoints)</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Est. Total: <strong>${routing.primaryCorridor.estimatedTollCostUSD} USD</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {routing.primaryCorridor.tollPlazas.slice(0, 6).map((toll, idx) => (
                  <div key={idx} className="p-2 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-[11px]">{toll.name}</span>
                      <span className="text-amber-300 font-bold text-[11px]">${toll.feeEstimateUSD}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{toll.country} ({toll.road})</span>
                      <span className="truncate max-w-[120px]">{toll.paymentMethods}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clearances, Weight Limits & Bottlenecks */}
            <div className="space-y-2.5">
              <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Weight Restrictions, Low Clearances &amp; Critical Bottlenecks</span>
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {routing.primaryCorridor.restrictionsAndClearances.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border space-y-1.5 ${
                      item.severity === 'critical'
                        ? 'bg-red-950/20 border-red-500/40 text-red-200'
                        : item.severity === 'high'
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.severity === 'critical'
                              ? 'bg-red-400 animate-ping'
                              : item.severity === 'high'
                              ? 'bg-amber-400'
                              : 'bg-sky-400'
                          }`}
                        ></span>
                        <span>{item.title}</span>
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          item.severity === 'critical'
                            ? 'bg-red-500/30 text-red-300'
                            : item.severity === 'high'
                            ? 'bg-amber-500/30 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">{item.details}</p>

                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[10px] text-slate-400">
                      <strong className="text-slate-300">Transporter Mitigation: </strong>
                      {item.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ALTERNATIVE ROUTES ("CLEAR ROAD" SECONDARY CORRIDOR) */}
        {activeAnalysisSection === 'alternative' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  <span>Secondary &quot;Clear Road&quot; Alternative: {routing.alternativeCorridor.name}</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                  Bypasses Beitbridge &amp; Chirundu
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                In case of construction delays, weather disruptions, or multi-day customs congestion at Beitbridge, commercial transporters switch to the <strong>Trans-Kalahari / Botswana A1 &amp; Kazungula Bridge Corridor</strong>.
              </p>
            </div>

            {/* Strategic Comparison Matrix */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <span className="font-bold text-slate-200 text-xs block uppercase tracking-wider">
                Direct Route vs. &quot;Clear Road&quot; Comparison
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">Tarmac Distance</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-emerald-400">{routing.alternativeCorridor.totalDistanceKm} km</span>
                    <span className="text-[10px] text-slate-500">(+190 km vs Direct)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Flat terrain throughout Botswana.</span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">Customs &amp; Border Delay</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-emerald-400">&lt; 3 Hours</span>
                    <span className="text-[10px] text-emerald-400 font-bold">(-24 to 48 hrs faster)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Automated drive-through cargo scanner.</span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">Mountain Passes &amp; Slopes</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-emerald-400">0 Mountain Passes</span>
                    <span className="text-[10px] text-emerald-400 font-bold">(Zero Escarpments)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Safe for heavy flatbed machinery loads.</span>
                </div>
              </div>

              {/* Expert Recommendation Box */}
              <div className="p-3 bg-slate-950/80 border border-emerald-500/30 rounded-xl text-xs space-y-1.5 text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commercial Freight Dispatcher Verdict:</span>
                </div>
                <p className="leading-relaxed text-[11px] text-slate-300">
                  {routing.corridorComparison.verdictRecommendation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VEHICLE & CARGO CHECKLIST */}
        {activeAnalysisSection === 'vehicle' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-sky-400 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span>Vehicle Profile: {routing.vehicle.name}</span>
              </span>
              <p className="text-slate-300 leading-relaxed text-xs">
                Configured for commercial haulage of <strong>{routing.vehicle.cargoType}</strong> along trans-African corridors.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold">Axle Configuration</span>
                <span className="text-xs font-bold text-slate-200">{routing.vehicle.axleConfiguration}</span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold">Max Legal GVM Limit</span>
                <span className="text-xs font-bold text-amber-300">{(routing.vehicle.maxGrossVehicleMassKg / 1000).toFixed(0)} Tonnes</span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold">Standard Clearance Height</span>
                <span className="text-xs font-bold text-sky-300">{routing.vehicle.standardClearanceM} meters</span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold">Avg Fuel Consumption</span>
                <span className="text-xs font-bold text-emerald-300">~{routing.vehicle.fuelBurnPer100Km} L / 100 km</span>
              </div>
            </div>

            {/* Required Transit Permits Checklist */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="font-bold text-slate-200 text-xs block uppercase tracking-wider">
                Mandatory SADC Cross-Border Documentation &amp; Permits
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {routing.vehicle.specialPermits.map((permit, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[11px]">{permit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
