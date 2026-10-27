/**
 * Geolocation & Route Utilities for Sourcing Origin and Delivery Destination
 */

export interface LocationPoint {
  country: string;
  province?: string;
  city: string;
  address?: string;
  lat: number;
  lng: number;
}

// Known coordinates for major African, European, and Global industrial and mining logistics hubs
const KNOWN_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // South Africa
  'johannesburg': { lat: -26.2041, lng: 28.0473 },
  'pretoria': { lat: -25.7479, lng: 28.2293 },
  'germiston': { lat: -26.2251, lng: 28.1678 },
  'durban': { lat: -29.8587, lng: 31.0218 },
  'cape town': { lat: -33.9249, lng: 18.4241 },
  'alberton': { lat: -26.2625, lng: 28.1256 },
  'alrode': { lat: -26.3117, lng: 28.1402 },
  'witbank': { lat: -25.8728, lng: 29.2332 },
  'emalahleni': { lat: -25.8728, lng: 29.2332 },
  'boksburg': { lat: -26.2127, lng: 28.2587 },
  'kempton park': { lat: -26.1076, lng: 28.2313 },
  'sasolburg': { lat: -26.8153, lng: 27.8288 },
  'bloemfontein': { lat: -29.0852, lng: 26.1596 },
  'polokwane': { lat: -23.9045, lng: 29.4689 },
  'gauteng': { lat: -26.2708, lng: 28.1123 },
  'south africa': { lat: -26.2041, lng: 28.0473 },

  // Zambia
  'lusaka': { lat: -15.3875, lng: 28.3228 },
  'kitwe': { lat: -12.8024, lng: 28.2132 },
  'ndola': { lat: -12.9906, lng: 28.6366 },
  'solwezi': { lat: -12.1818, lng: 26.3894 },
  'chingola': { lat: -12.5367, lng: 27.8542 },
  'chililabombwe': { lat: -12.3644, lng: 27.8229 },
  'mufulira': { lat: -12.5498, lng: 28.2407 },
  'kalumbila': { lat: -12.2341, lng: 25.3217 },
  'copperbelt': { lat: -12.8024, lng: 28.2132 },
  'north-western': { lat: -12.1818, lng: 26.3894 },
  'zambia': { lat: -15.3875, lng: 28.3228 },

  // Zimbabwe
  'harare': { lat: -17.8252, lng: 31.0335 },
  'bulawayo': { lat: -20.1554, lng: 28.5833 },
  'zimbabwe': { lat: -17.8252, lng: 31.0335 },

  // DRC
  'lubumbashi': { lat: -11.6876, lng: 27.4847 },
  'kolwezi': { lat: -10.7167, lng: 25.4667 },
  'drc': { lat: -11.6876, lng: 27.4847 },

  // Botswana
  'gaborone': { lat: -24.6282, lng: 25.9231 },
  'francistown': { lat: -21.1736, lng: 27.5125 },
  'botswana': { lat: -24.6282, lng: 25.9231 },

  // East Africa
  'nairobi': { lat: -1.2921, lng: 36.8219 },
  'dar es salaam': { lat: -6.7924, lng: 39.2083 },
  'kenya': { lat: -1.2921, lng: 36.8219 },
  'tanzania': { lat: -6.7924, lng: 39.2083 },

  // Global Hubs
  'london': { lat: 51.5074, lng: -0.1278 },
  'united kingdom': { lat: 51.5074, lng: -0.1278 },
  'shanghai': { lat: 31.2304, lng: 121.4737 },
  'guangzhou': { lat: 23.1291, lng: 113.2644 },
  'shenzhen': { lat: 22.5431, lng: 114.0579 },
  'china': { lat: 31.2304, lng: 121.4737 },
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'uae': { lat: 25.2048, lng: 55.2708 },
  'new york': { lat: 40.7128, lng: -74.006 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'toronto': { lat: 43.6532, lng: -79.3832 },
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'frankfurt': { lat: 50.1109, lng: 8.6821 },
  'germany': { lat: 50.1109, lng: 8.6821 },
};

export function resolveCoordinates(cityOrArea: string, province?: string, country?: string): { lat: number; lng: number } {
  const normalize = (s?: string) => (s || '').toLowerCase().trim();
  const c = normalize(cityOrArea);
  const p = normalize(province);
  const co = normalize(country);

  // Exact city match
  for (const [key, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (c && (c === key || c.includes(key) || key.includes(c))) {
      return coords;
    }
  }

  // Province match
  for (const [key, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (p && (p === key || p.includes(key) || key.includes(p))) {
      return coords;
    }
  }

  // Country match
  for (const [key, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (co && (co === key || co.includes(key) || key.includes(co))) {
      return coords;
    }
  }

  // Default to Johannesburg, South Africa
  return { lat: -26.2041, lng: 28.0473 };
}

/**
 * Calculates great-circle distance between two coordinates in kilometers (Haversine formula)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Estimates road freight transit time and key border post for Southern/Central African corridors
 */
export function estimateLogisticsCorridor(
  originCountry: string,
  originCity: string,
  destCountry: string,
  destCity: string
): {
  distanceKm: number;
  estimatedRoadDays: string;
  recommendedIncoterms: string;
  keyBorderPost: string;
  freightMode: string;
} {
  const oCoords = resolveCoordinates(originCity, '', originCountry);
  const dCoords = resolveCoordinates(destCity, '', destCountry);
  const distanceKm = calculateDistanceKm(oCoords.lat, oCoords.lng, dCoords.lat, dCoords.lng);

  const isCrossBorderAfrica =
    (originCountry.toLowerCase().includes('south africa') && destCountry.toLowerCase().includes('zambia')) ||
    (originCountry.toLowerCase().includes('zambia') && destCountry.toLowerCase().includes('south africa'));

  let estimatedRoadDays = '3–5 Business Days';
  let keyBorderPost = 'Direct Domestic Transit';
  let recommendedIncoterms = 'DDP / Delivered Duty Paid';
  let freightMode = 'Consolidated Road Freight';

  if (isCrossBorderAfrica) {
    if (destCity.toLowerCase().includes('solwezi') || destCity.toLowerCase().includes('kalumbila')) {
      estimatedRoadDays = '5–7 Days (incl. Chirundu Border Clearing)';
      keyBorderPost = 'Chirundu Border Post / Kasumbalesa';
    } else if (destCity.toLowerCase().includes('kitwe') || destCity.toLowerCase().includes('ndola')) {
      estimatedRoadDays = '4–6 Days via Beitbridge / Chirundu';
      keyBorderPost = 'Chirundu / Beitbridge Border Post';
    } else {
      estimatedRoadDays = '3–5 Days via Chirundu One-Stop Border';
      keyBorderPost = 'Chirundu One-Stop Border Post (Zambia-Zimbabwe)';
    }
    recommendedIncoterms = 'DDP (Delivered Duty Paid) or DAP (Delivered at Place)';
    freightMode = 'Bonded Cross-Border Heavy Truck Freight';
  } else if (distanceKm > 3000) {
    estimatedRoadDays = '14–25 Days (Air Cargo 3–5 Days)';
    keyBorderPost = 'International Ocean Port / Air Cargo Customs';
    recommendedIncoterms = 'CIF / FOB / DDP';
    freightMode = 'Multimodal Ocean & Air Freight';
  }

  return {
    distanceKm,
    estimatedRoadDays,
    recommendedIncoterms,
    keyBorderPost,
    freightMode,
  };
}

export interface VehicleProfile {
  id: string;
  name: string;
  category: string;
  cargoType: string;
  axleConfiguration: string;
  maxGrossVehicleMassKg: number;
  standardClearanceM: number;
  flatbedDeckLengthM: number;
  escortRequired: boolean;
  fuelBurnPer100Km: number;
  specialPermits: string[];
}

export const COMMERCIAL_VEHICLE_PROFILES: VehicleProfile[] = [
  {
    id: 'flatbed_heavy_machinery',
    name: 'Semi-Truck / Tri-Axle Flatbed (Heavy Machinery & Mining Plant)',
    category: 'Heavy Commercial Freight',
    cargoType: 'Heavy Mining Machinery / Excavator Attachments / Structural Steel',
    axleConfiguration: '6x4 Tractor Unit + 3-Axle Semi-Trailer (Tri-Axle)',
    maxGrossVehicleMassKg: 56000,
    standardClearanceM: 4.65,
    flatbedDeckLengthM: 13.6,
    escortRequired: false,
    fuelBurnPer100Km: 48,
    specialPermits: ['SADC Cross-Border Road Transport Permit', 'Bonded Cargo Transit Transit T1', 'COMESA Yellow Card Insurance'],
  },
  {
    id: 'superlink_mining_cones',
    name: 'Superlink Curtain-Sider / Tautliner (Mining Cones & Pallets)',
    category: 'Consolidated General Cargo',
    cargoType: '1.8m UV Mining Barrier Cones, Haul Road Delineators & Safety Supplies',
    axleConfiguration: '6x4 Tractor + 2-Axle Interlink + 2-Axle Rear Trailer',
    maxGrossVehicleMassKg: 56000,
    standardClearanceM: 4.3,
    flatbedDeckLengthM: 18.2,
    escortRequired: false,
    fuelBurnPer100Km: 44,
    specialPermits: ['SADC Bi-lateral Freight Permit', 'COMESA Yellow Card Insurance'],
  },
  {
    id: 'lowbed_abnormal',
    name: 'Multi-Axle Lowbed Heavy Hauler (Abnormal Over-Dimensional Load)',
    category: 'Abnormal Heavy Haulage',
    cargoType: 'CAT/Komatsu Open-Cast Mining Dump Truck Components, Crushers, Ball Mill Shells',
    axleConfiguration: '8x4 Heavy Tractor + Multi-Axle Steerable Lowbed Trailer',
    maxGrossVehicleMassKg: 85000,
    standardClearanceM: 5.2,
    flatbedDeckLengthM: 22.0,
    escortRequired: true,
    fuelBurnPer100Km: 68,
    specialPermits: ['Abnormal Load Route Permit (SA RTMC / Zim MOT / Zambian RDA)', 'Police / Traffic Escort Clearance', 'ZESCO Overhead Line Lifting Escort'],
  },
  {
    id: 'refrigerated_cargo',
    name: 'Refrigerated Intermodal Rig (Perishables & Mining Camp Catering)',
    category: 'Temperature-Controlled Freight',
    cargoType: 'Fresh Produce, Frozen Food Supplies, Cold-Chain Industrial Reagents',
    axleConfiguration: '6x4 Tractor + Tri-Axle Reefer Trailer',
    maxGrossVehicleMassKg: 50000,
    standardClearanceM: 4.2,
    flatbedDeckLengthM: 13.6,
    escortRequired: false,
    fuelBurnPer100Km: 46,
    specialPermits: ['Sanitary & Phytosanitary Certificate', 'SADC Transit Carnet'],
  },
  {
    id: 'bulk_tanker',
    name: 'Chemical & Reagent Tanker (Mining Processing Liquids)',
    category: 'Hazardous Bulk Liquids',
    cargoType: 'Sulfuric Acid, Solvent Extraction Reagents, Flotation Chemicals, Diesel',
    axleConfiguration: '6x4 Tractor + Stainless Steel Tri-Axle Tanker',
    maxGrossVehicleMassKg: 54000,
    standardClearanceM: 3.9,
    flatbedDeckLengthM: 12.5,
    escortRequired: false,
    fuelBurnPer100Km: 47,
    specialPermits: ['Hazchem Dangerous Goods Driver Certificate', 'Spill Containment Protocol Clearance', 'SADC Hazmat Transit Permit'],
  },
];

export interface FreightWaypoint {
  name: string;
  location: string;
  type: 'origin' | 'highway' | 'toll' | 'border' | 'weighbridge' | 'bottleneck' | 'destination';
  lat: number;
  lng: number;
  note?: string;
}

export interface TollPlazaInfo {
  name: string;
  country: string;
  road: string;
  feeEstimateUSD: number;
  paymentMethods: string;
}

export interface RestrictionClearanceInfo {
  category: 'toll' | 'weight' | 'clearance' | 'bottleneck';
  title: string;
  location: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
}

export interface CorridorRoutePlan {
  id: 'primary' | 'alternative';
  name: string;
  tagline: string;
  status: 'Primary Preferred' | 'Secondary Clear Road Alternative';
  highwaysUsed: string[];
  totalDistanceKm: number;
  estimatedTransitTime: string;
  tollCount: number;
  estimatedTollCostUSD: number;
  borderCrossing: string;
  roadQualityScore: number; // 0-100
  waypoints: FreightWaypoint[];
  pathCoordinates: { lat: number; lng: number }[];
  keyHighlights: string[];
  tollPlazas: TollPlazaInfo[];
  restrictionsAndClearances: RestrictionClearanceInfo[];
  bottlenecksAndHazards: string[];
}

export interface CommercialTransportRoutingResult {
  origin: { country: string; city: string };
  destination: { country: string; city: string };
  vehicle: VehicleProfile;
  primaryCorridor: CorridorRoutePlan;
  alternativeCorridor: CorridorRoutePlan;
  corridorComparison: {
    distanceDiffKm: number;
    timeDiffHours: string;
    tollDiffUSD: number;
    verdictRecommendation: string;
  };
}

/**
 * Resolves full commercial transport routing between Origin and Destination
 * with:
 * 1. Preferred Freight Corridors (Highways, freeways, designated truck corridors)
 * 2. Road Conditions & Clearances (Toll roads, weight restrictions, low clearances, bottlenecks)
 * 3. Alternative Routes (Secondary "clear road" alternative avoiding bottlenecks)
 */
export function getCommercialTransportRouting(
  originCity: string,
  originCountry: string,
  destCity: string,
  destCountry: string,
  vehicleId: string = 'flatbed_heavy_machinery'
): CommercialTransportRoutingResult {
  const vehicle =
    COMMERCIAL_VEHICLE_PROFILES.find((v) => v.id === vehicleId) || COMMERCIAL_VEHICLE_PROFILES[0];

  const oCity = (originCity || 'Johannesburg').trim();
  const oCountry = (originCountry || 'South Africa').trim();
  const dCity = (destCity || 'Kitwe').trim();
  const dCountry = (destCountry || 'Zambia').trim();

  const oCoords = resolveCoordinates(oCity, '', oCountry);
  const dCoords = resolveCoordinates(dCity, '', dCountry);

  // PRIMARY FREIGHT CORRIDOR: The Great North Road via Beitbridge & Chirundu
  // N1 North (SA) -> A4 & A1 (Zimbabwe) -> T2 & T3 (Zambia)
  const primaryWaypoints: FreightWaypoint[] = [
    {
      name: `${oCity} Commercial Freight Depot`,
      location: `${oCity}, ${oCountry}`,
      type: 'origin',
      lat: oCoords.lat,
      lng: oCoords.lng,
      note: 'Initial vehicle pre-trip inspection, axle load test & cargo strapping certification.',
    },
    {
      name: 'Polokwane Weighbridge & Truck Stop',
      location: 'Limpopo, South Africa',
      type: 'weighbridge',
      lat: -23.9045,
      lng: 29.4689,
      note: 'N1 Highway SANRAL compliance check; verified 9t axle / 56t GVM limit.',
    },
    {
      name: 'Beitbridge Border Post (RSA / Zimbabwe)',
      location: 'Limpopo / Matabeleland South Border',
      type: 'border',
      lat: -22.2167,
      lng: 30.0000,
      note: 'High volume commercial customs clearance. SARS EDI & ZIMRA Asycuda World automated declaration.',
    },
    {
      name: 'Masvingo Commercial Corridor Stop',
      location: 'Masvingo, Zimbabwe',
      type: 'highway',
      lat: -20.0637,
      lng: 30.8277,
      note: 'A4 Highway transit corridor; secure overnight guarded truck stop.',
    },
    {
      name: 'Harare Heavy Vehicle Bypass',
      location: 'Harare, Zimbabwe',
      type: 'highway',
      lat: -17.8252,
      lng: 31.0335,
      note: 'Transition from A4 to A1 Highway towards Chinhoyi/Karoi; bypasses central city gridlock.',
    },
    {
      name: 'Chirundu Escarpment Descent (Caution Grade)',
      location: 'Mashonaland West, Zimbabwe',
      type: 'bottleneck',
      lat: -16.2500,
      lng: 29.1000,
      note: 'Steep 14 km winding mountain descent (10–12% grade). Low-gear engine braking (Jake brake) required. Runaway truck arrestor beds at Km 8 and Km 12.',
    },
    {
      name: 'Chirundu One-Stop Border Post (Zim / Zambia)',
      location: 'Zambezi River Border',
      type: 'border',
      lat: -16.0333,
      lng: 28.8500,
      note: 'Single-window joint clearance over the Otto Beit / Chirundu Bridge across Zambezi. 4.65m overhead clearance.',
    },
    {
      name: 'Kafue River Bridge & Weighbridge',
      location: 'Kafue, Lusaka Province, Zambia',
      type: 'weighbridge',
      lat: -15.7691,
      lng: 28.1814,
      note: 'Zambia Road Development Agency (RDA) strict 56t Gross Weight & axle scale.',
    },
    {
      name: 'Kapiri Mposhi Major Freight Interchange',
      location: 'Central Province, Zambia',
      type: 'highway',
      lat: -13.9714,
      lng: 28.6694,
      note: 'Strategic junction where T2 splits into T3 Copperbelt corridor. Round-the-clock vulcanizing & diesel service.',
    },
    {
      name: `${dCity} Final Receiving Depot / Mine Site`,
      location: `${dCity}, ${dCountry}`,
      type: 'destination',
      lat: dCoords.lat,
      lng: dCoords.lng,
      note: 'Final delivery discharge, customs bond acquittal & offloading via mobile crane.',
    },
  ];

  // Primary Path Coordinates for Google Maps Polyline
  const primaryPath: { lat: number; lng: number }[] = [
    { lat: oCoords.lat, lng: oCoords.lng },
    { lat: -25.7479, lng: 28.2293 }, // Pretoria N1
    { lat: -24.7000, lng: 28.4000 }, // Nylstroom/Modimolle
    { lat: -23.9045, lng: 29.4689 }, // Polokwane
    { lat: -22.9900, lng: 29.9000 }, // Louis Trichardt
    { lat: -22.3503, lng: 30.0407 }, // Musina
    { lat: -22.2167, lng: 30.0000 }, // Beitbridge
    { lat: -21.0000, lng: 30.5000 }, // Ngundu
    { lat: -20.0637, lng: 30.8277 }, // Masvingo
    { lat: -19.0211, lng: 30.8922 }, // Chivhu
    { lat: -17.8252, lng: 31.0335 }, // Harare
    { lat: -17.3667, lng: 30.2000 }, // Chinhoyi
    { lat: -16.8099, lng: 29.6925 }, // Karoi
    { lat: -16.2500, lng: 29.1000 }, // Chirundu Escarpment
    { lat: -16.0333, lng: 28.8500 }, // Chirundu Border
    { lat: -15.7691, lng: 28.1814 }, // Kafue
    { lat: -15.3875, lng: 28.3228 }, // Lusaka
    { lat: -14.4469, lng: 28.4464 }, // Kabwe
    { lat: -13.9714, lng: 28.6694 }, // Kapiri Mposhi
    { lat: -12.9906, lng: 28.6366 }, // Ndola
    { lat: dCoords.lat, lng: dCoords.lng }, // Kitwe / Solwezi destination
  ];

  // PRIMARY ROUTE DETAILS
  const primaryCorridor: CorridorRoutePlan = {
    id: 'primary',
    name: 'N1 North ➔ Beitbridge ➔ Chirundu ➔ T2/T3 Copperbelt Trunk',
    tagline: 'Standard Direct Commercial Transporter Route',
    status: 'Primary Preferred',
    highwaysUsed: ['N1 Freeway (South Africa)', 'A4 Masvingo Highway (Zimbabwe)', 'A1 Chirundu Road (Zimbabwe)', 'T2 Great North Road (Zambia)', 'T3 Copperbelt Expressway (Zambia)'],
    totalDistanceKm: 2140,
    estimatedTransitTime: '4–6 Days (incl. border inspections)',
    tollCount: 11,
    estimatedTollCostUSD: 185,
    borderCrossing: 'Beitbridge (SA/Zim) & Chirundu OSBP (Zim/Zambia)',
    roadQualityScore: 84,
    waypoints: primaryWaypoints,
    pathCoordinates: primaryPath,
    keyHighlights: [
      'Shortest physical distance (2,140 km) for heavy road freight connecting Gauteng industrial factories to Copperbelt mining operations.',
      '100% asphalt paved with designated commercial rest halts and heavy vehicle breakdown repair centers.',
      'High density of high-flow diesel hubs and multi-axle tire support centers at Polokwane, Musina, and Harare.',
    ],
    tollPlazas: [
      { name: 'Pumulani Toll Plaza (N1)', country: 'South Africa', road: 'N1 North', feeEstimateUSD: 14, paymentMethods: 'Electronic Tag / Visa / MasterCard' },
      { name: 'Carousel & Kranskop Plazas', country: 'South Africa', road: 'N1 North', feeEstimateUSD: 28, paymentMethods: 'Electronic Tag / Card' },
      { name: 'Nyl & Capricorn Plazas', country: 'South Africa', road: 'N1 North', feeEstimateUSD: 22, paymentMethods: 'Electronic Tag / Card' },
      { name: 'Baobab Plaza (Musina)', country: 'South Africa', road: 'N1 North', feeEstimateUSD: 12, paymentMethods: 'Electronic Tag / Card' },
      { name: 'Beitbridge Modernized Freight Terminal Toll', country: 'Zimbabwe', road: 'A4 Access', feeEstimateUSD: 35, paymentMethods: 'USD Cash / ZIMRA Card' },
      { name: 'Masvingo & Skyline Plazas', country: 'Zimbabwe', road: 'A4 Highway', feeEstimateUSD: 20, paymentMethods: 'ZINARA Road Toll Card / USD' },
      { name: 'Inkomo & Lion’s Den Plazas', country: 'Zimbabwe', road: 'A1 Highway', feeEstimateUSD: 20, paymentMethods: 'USD Cash / ZINARA' },
      { name: 'Shimabala Toll Plaza (Kafue)', country: 'Zambia', road: 'T2 Highway', feeEstimateUSD: 12, paymentMethods: 'NRFA FastPay / USD' },
      { name: 'Katuba & Manyumbi Toll Plazas', country: 'Zambia', road: 'T2 North', feeEstimateUSD: 16, paymentMethods: 'NRFA FastPay / ZMW' },
      { name: 'Kafulafunda Toll Plaza', country: 'Zambia', road: 'T3 Ndola/Kitwe', feeEstimateUSD: 6, paymentMethods: 'NRFA Electronic Card' },
    ],
    restrictionsAndClearances: [
      {
        category: 'weight',
        title: 'SADC Axle Load & Gross Vehicle Mass (GVM) Limit',
        location: 'All Transnational Checkpoints',
        details: 'Maximum 56,000 kg (56 metric tonnes) for 6-axle and 7-axle combinations. Steer axle: 7,700 kg; Drive tandem: 18,000 kg; Tri-axle trailer group: 24,000 kg.',
        severity: 'high',
        mitigation: 'Load cell weigh-in at departure yard. Maintain certified weighbridge slip to avoid automated spot fines at Polokwane and Kafue.',
      },
      {
        category: 'clearance',
        title: 'Overhead Bridge & Power Line Clearances',
        location: 'Chirundu Bridge & Lusaka Railway Underpasses',
        details: 'Standard physical bridge clearance is 4.65 meters. Abnormal loads or tall excavators exceeding 4.8m height require certified route clearance.',
        severity: 'medium',
        mitigation: 'For loads >4.6m, lower air-suspension bags when negotiating underpasses; abnormal rigs require ZESCO utility power escort.',
      },
      {
        category: 'bottleneck',
        title: 'Beitbridge Commercial Border Queue Congestion',
        location: 'Beitbridge Border Post',
        details: 'Month-end cargo volume spikes can lead to 12–36 hour queuing for physical container inspection or paper clearing.',
        severity: 'critical',
        mitigation: 'Utilize automated Green Lane pre-clearance with clearing agent 24 hours prior to truck arrival at Musina depot.',
      },
      {
        category: 'bottleneck',
        title: 'Chirundu Mountain Escarpment Descent (14 km Dangerous Slope)',
        location: 'Chirundu Pass, Zimbabwe approach',
        details: 'Steep 10-12% decline with sharp hairpin bends. Frequent brake overheating on heavily loaded tri-axle flatbeds carrying machinery.',
        severity: 'high',
        mitigation: 'Enforce mandatory stop at Escarpment Truck Checkpoint; engage low crawler gear; rely on engine compression retarder (Jake brake).',
      },
    ],
    bottlenecksAndHazards: [
      'Beitbridge border peak-hour truck congestion and physical customs inspections.',
      'Chirundu Escarpment steep downhill grade: high risk of brake fade on heavy machinery flatbeds.',
      'Kafue Weighbridge queues during morning hours (06:00 - 10:00).',
      'Kapiri Mposhi intersection heavy transit traffic merging towards DRC and Tanzania.',
    ],
  };

  // SECONDARY "CLEAR ROAD" ALTERNATIVE: Trans-Kalahari / Botswana & Kazungula Bridge Corridor
  // N1/N4 (SA) -> Martin's Drift / Groblersbrug -> A1 Botswana -> Kazungula Bridge -> T1 & T2/T3 Zambia
  const alternativeWaypoints: FreightWaypoint[] = [
    {
      name: `${oCity} Commercial Freight Depot`,
      location: `${oCity}, ${oCountry}`,
      type: 'origin',
      lat: oCoords.lat,
      lng: oCoords.lng,
      note: 'Depart via N1 North, connecting onto N11 / N4 Western corridor.',
    },
    {
      name: 'Groblersbrug / Martin’s Drift Border (SA / Botswana)',
      location: 'Limpopo River Crossing',
      type: 'border',
      lat: -22.9976,
      lng: 27.9405,
      note: 'Smooth commercial entry into Botswana. Fast electronic vehicle scanning.',
    },
    {
      name: 'Francistown Heavy Commercial Corridor',
      location: 'Francistown, Botswana',
      type: 'highway',
      lat: -21.1736,
      lng: 27.5125,
      note: 'A1 Highway Botswana; high-standard flat dual-carriageway with zero mountain passes.',
    },
    {
      name: 'Nata Transport Junction (A33 North)',
      location: 'Central District, Botswana',
      type: 'highway',
      lat: -20.2117,
      lng: 26.1772,
      note: 'Turnoff to A33 North towards Kazungula. Fuel depot and wildlife safety zone.',
    },
    {
      name: 'Kazungula Bridge One-Stop Border Post (Botswana / Zambia)',
      location: 'Zambezi River, Kazungula',
      type: 'border',
      lat: -17.7889,
      lng: 25.2603,
      note: 'State-of-the-art curved rail/road cable-stayed bridge and One-Stop Border Post. Automated non-intrusive drive-through X-ray cargo scanner cuts border clearance to under 3 hours!',
    },
    {
      name: 'Livingstone Logistics Hub',
      location: 'Southern Province, Zambia',
      type: 'highway',
      lat: -17.8419,
      lng: 25.8543,
      note: 'Entry onto Zambian T1 Highway. Truck resting area and fuel replenishment.',
    },
    {
      name: 'Choma & Mazabuka Agro-Industrial Corridor',
      location: 'Southern Province, Zambia',
      type: 'highway',
      lat: -16.8078,
      lng: 26.9875,
      note: 'T1 Highway connecting northwards into Kafue without mountain passes.',
    },
    {
      name: 'Kafue Heavy Vehicle Bypass',
      location: 'Kafue, Zambia',
      type: 'weighbridge',
      lat: -15.7691,
      lng: 28.1814,
      note: 'Merges with T2 Highway towards Lusaka and Copperbelt.',
    },
    {
      name: `${dCity} Final Receiving Depot / Mine Site`,
      location: `${dCity}, ${dCountry}`,
      type: 'destination',
      lat: dCoords.lat,
      lng: dCoords.lng,
      note: 'Final discharge point.',
    },
  ];

  // Alternative Path Coordinates for Google Maps Polyline
  const alternativePath: { lat: number; lng: number }[] = [
    { lat: oCoords.lat, lng: oCoords.lng },
    { lat: -25.6500, lng: 27.2400 }, // Rustenburg N4
    { lat: -24.3000, lng: 27.5000 }, // Thabazimbi
    { lat: -22.9976, lng: 27.9405 }, // Groblersbrug / Martin's Drift Border
    { lat: -22.5000, lng: 27.1000 }, // Palapye Botswana
    { lat: -21.1736, lng: 27.5125 }, // Francistown
    { lat: -20.2117, lng: 26.1772 }, // Nata
    { lat: -18.5000, lng: 25.4000 }, // Pandamatenga
    { lat: -17.7889, lng: 25.2603 }, // Kazungula Bridge OSBP
    { lat: -17.8419, lng: 25.8543 }, // Livingstone
    { lat: -16.8078, lng: 26.9875 }, // Choma
    { lat: -15.8560, lng: 27.7480 }, // Mazabuka
    { lat: -15.7691, lng: 28.1814 }, // Kafue
    { lat: -15.3875, lng: 28.3228 }, // Lusaka
    { lat: -14.4469, lng: 28.4464 }, // Kabwe
    { lat: -13.9714, lng: 28.6694 }, // Kapiri Mposhi
    { lat: -12.9906, lng: 28.6366 }, // Ndola
    { lat: dCoords.lat, lng: dCoords.lng }, // Kitwe
  ];

  // ALTERNATIVE "CLEAR ROAD" ROUTE DETAILS
  const alternativeCorridor: CorridorRoutePlan = {
    id: 'alternative',
    name: 'Trans-Kalahari ➔ Botswana A1 ➔ Kazungula Bridge One-Stop Border ➔ T1/T2 Zambia',
    tagline: 'Secondary "Clear Road" Alternative (Bypasses Beitbridge & Chirundu Congestion)',
    status: 'Secondary Clear Road Alternative',
    highwaysUsed: ['N1/N11 Highway (South Africa)', 'A1 Highway (Botswana)', 'A33 Kazungula Road (Botswana)', 'Kazungula Quadripoint Bridge', 'T1 Livingstone Highway (Zambia)', 'T2/T3 Zambian Trunk'],
    totalDistanceKm: 2330,
    estimatedTransitTime: '3–4 Days (Faster Customs & No Escarpment)',
    tollCount: 6,
    estimatedTollCostUSD: 140,
    borderCrossing: 'Groblersbrug (SA/Bots) & Kazungula Bridge OSBP (Bots/Zambia)',
    roadQualityScore: 92,
    waypoints: alternativeWaypoints,
    pathCoordinates: alternativePath,
    keyHighlights: [
      'Bypasses Beitbridge Border completely: avoids recurring 24–48 hour truck gridlocks and complex transit documentation in Zimbabwe.',
      'Completely avoids the treacherous Chirundu Mountain Escarpment: flat, wide, modern roadbed ideal for flatbeds carrying heavy mining machinery.',
      'Kazungula Bridge One-Stop Border Post operates 24/7 with automated high-speed cargo drive-through scanners (average border clearing time: under 3 hours vs 24+ hours at Beitbridge).',
      'Significantly lower transit tolls and simpler single-point customs bond acquittal.',
    ],
    tollPlazas: [
      { name: 'N11 Groblersbrug Access Toll', country: 'South Africa', road: 'N11 Highway', feeEstimateUSD: 8, paymentMethods: 'Electronic Tag / Card' },
      { name: 'Botswana Road Transport Levy (Transit)', country: 'Botswana', road: 'A1 Highway', feeEstimateUSD: 30, paymentMethods: 'Botswana Pula / USD Card' },
      { name: 'Kazungula Bridge Cross-Border Toll', country: 'Bi-National (Botswana/Zambia)', road: 'Kazungula Bridge', feeEstimateUSD: 60, paymentMethods: 'Integrated Electronic Card / Visa' },
      { name: 'Livingstone & Zimba Toll Plazas', country: 'Zambia', road: 'T1 Highway', feeEstimateUSD: 14, paymentMethods: 'NRFA FastPay / USD' },
      { name: 'Shimabala & Manyumbi Plazas', country: 'Zambia', road: 'T2 Highway', feeEstimateUSD: 22, paymentMethods: 'NRFA FastPay / Card' },
      { name: 'Kafulafunda Copperbelt Toll', country: 'Zambia', road: 'T3 Highway', feeEstimateUSD: 6, paymentMethods: 'NRFA FastPay' },
    ],
    restrictionsAndClearances: [
      {
        category: 'clearance',
        title: 'Kazungula Bridge Clearance (Modern High-Capacity Structure)',
        location: 'Kazungula Bridge Crossing',
        details: 'Generous 5.8 meter overhead clearance. Designed explicitly for abnormal mining transport and heavy flatbeds.',
        severity: 'low',
        mitigation: 'Standard abnormal load height passes smoothly without needing power line de-energization.',
      },
      {
        category: 'weight',
        title: 'Botswana & Zambia Axle Load Limits',
        location: 'Martin’s Drift & Kazungula Weighbridges',
        details: 'Harmonized SADC 56t GVM limit. Strict automated weigh-in-motion sensors integrated into the bridge approach toll.',
        severity: 'medium',
        mitigation: 'Ensure axle balance does not exceed 9,000 kg per driving axle.',
      },
      {
        category: 'bottleneck',
        title: 'Wildlife Crossing Zones on A33 (Nata to Kazungula)',
        location: 'A33 Corridor, Northern Botswana',
        details: 'Route traverses conservation corridors where elephants and large game frequently cross, particularly between dusk and dawn.',
        severity: 'medium',
        mitigation: 'Strict enforcement of 80 km/h truck speed limit. Transporters avoid night-time driving between 20:00 and 05:00 on the Nata-Kazungula segment.',
      },
    ],
    bottlenecksAndHazards: [
      'Night-time elephant crossings on Botswana A33 between Nata and Pandamatenga (daylight haulage recommended).',
      'Groblersbrug single-lane bridge: occasional 2-3 hour queue during wet-season river surges.',
      'Slightly longer physical distance (+190 km), easily offset by 24–48 hours saved in border queue time.',
    ],
  };

  return {
    origin: { country: oCountry, city: oCity },
    destination: { country: dCountry, city: dCity },
    vehicle,
    primaryCorridor,
    alternativeCorridor,
    corridorComparison: {
      distanceDiffKm: alternativeCorridor.totalDistanceKm - primaryCorridor.totalDistanceKm, // +190 km
      timeDiffHours: '1 to 2 Days FASTER via Kazungula Bridge Alternative',
      tollDiffUSD: alternativeCorridor.estimatedTollCostUSD - primaryCorridor.estimatedTollCostUSD, // Saves ~$45 in tolls
      verdictRecommendation:
        'RECOMMENDATION: For a Semi-Truck / Flatbed carrying heavy machinery, the Secondary "Clear Road" Alternative via Botswana & Kazungula Bridge is strongly recommended. While it covers 190 km more tarmac, it completely eliminates the dangerous Chirundu mountain escarpment and bypasses Beitbridge multi-day customs congestion, arriving in Kitwe 24 to 48 hours faster with superior road safety.',
    },
  };
}

