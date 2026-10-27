import React, { useState } from 'react';
import {
  LeadItem,
  RetentionStrategy,
  LeadGenerationResult,
  WebSource,
  CrmEntity,
  NegotiationRoundRecord,
  NegotiationConcession,
  ResaleOpportunity,
} from '../types';
import { generateLeadsApi, smartSearchExpandApi, SmartSearchExpansionResult } from '../services/api';
import {
  Users,
  Building2,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Search,
  ExternalLink,
  Volume2,
  Copy,
  Check,
  Download,
  Filter,
  Sparkles,
  Phone,
  Mail,
  Linkedin,
  MessageSquare,
  Globe,
  Plus,
  RefreshCw,
  Package,
  Layers,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Clock,
  Briefcase,
  Share2,
  Scale,
  Truck,
  Navigation,
  Map as MapIcon,
  Zap,
  Send,
  Cpu,
} from 'lucide-react';
import { soundManager } from '../utils/audioCues';
import { RfqEmailModal } from './RfqEmailModal';
import { CrmDatabaseView } from './CrmDatabaseView';
import { NegotiationIntelligenceHub } from './NegotiationIntelligenceHub';
import { ContactActionGroup } from './ContactActionGroup';
import { OriginDestinationMap, RouteLogisticsConfig } from './OriginDestinationMap';
import { BatchOutreachSourcingHub } from './BatchOutreachSourcingHub';
import { ModelSelectorModal } from './ModelSelectorModal';
import { INITIAL_SUPPLIERS, INITIAL_CUSTOMERS, INITIAL_RETENTION_PLAYBOOK } from '../utils/seedLeads';

interface LeadGenRetentionHubProps {
  onSpeak: (text: string) => void;
  onOpenScreenViewer?: () => void;
}

export const LeadGenRetentionHub: React.FC<LeadGenRetentionHubProps> = ({
  onSpeak,
  onOpenScreenViewer,
}) => {
  // Search parameters
  const [country, setCountry] = useState('South Africa');
  const [province, setProvince] = useState('Gauteng');
  const [area, setArea] = useState('Johannesburg');
  const [industry, setIndustry] = useState('Clean Energy & Solar');
  const [targetType, setTargetType] = useState<'both' | 'suppliers' | 'customers'>('both');
  const [targetPersona, setTargetPersona] = useState('Procurement, Operations & Facility Directors');
  const [objective, setObjective] = useState<'acquisition' | 'retention' | 'both'>('both');
  const [customKeywords, setCustomKeywords] = useState('commercial solar panels, battery inverters, EPC installers');
  const [groundingMode, setGroundingMode] = useState<'maps' | 'search'>('maps');
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      return localStorage.getItem('screensense_preferred_model') || 'gemini-3.8-flash';
    } catch {
      return 'gemini-3.8-flash';
    }
  });
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  // Loading & Results (Pre-seeded with 12+ verified suppliers and 12+ customers)
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<LeadGenerationResult>(() => ({
    suppliers: INITIAL_SUPPLIERS,
    customers: INITIAL_CUSTOMERS,
    leads: [...INITIAL_SUPPLIERS, ...INITIAL_CUSTOMERS],
    retentionPlaybook: INITIAL_RETENTION_PLAYBOOK,
    marketOverview:
      'Active commercial landscape across Southern & Central Africa (South Africa, Zambia, DRC) with robust demand for heavy 1.8m mining barrier cones, reflective haul road demarcation, and industrial safety infrastructure. High regional manufacturing capacity centered in Gauteng with fast consolidated export transport routes to Kitwe, Ndola, and Solwezi.',
    searchSources: [
      { title: 'Google Maps Business Directory: Gauteng Industrial Fabricators', url: 'https://maps.google.com/?q=Gauteng+Industrial', type: 'maps' },
      { title: 'Chamber of Mines SADC Trade & Procurement Portal', url: 'https://www.google.com/search?q=SADC+mining+procurement', type: 'web' },
      { title: 'Zambian Mining Cadastre & Supplier Registry', url: 'https://www.google.com/search?q=Zambia+Chamber+of+Mines+procurement', type: 'web' },
    ],
    searchQueries: [
      '1.8m mining barrier cones manufacturer South Africa',
      'copperbelt mine safety equipment buyers Zambia',
      'haul road boundary delineators open cast mining',
    ],
  }));

  // Saved Leads Pipeline
  const [savedLeads, setSavedLeads] = useState<LeadItem[]>(() => {
    try {
      const stored = localStorage.getItem('screensense_saved_leads');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<'all' | 'suppliers' | 'customers' | 'corridor' | 'crm' | 'negotiation' | 'retention' | 'pipeline' | 'firefox' | 'campaign'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [firefoxSidebarMode, setFirefoxSidebarMode] = useState(false);
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>([]);

  // Persistent Custom Address Tracker to guarantee user-typed addresses never revert
  const [isCustomDestAddress, setIsCustomDestAddress] = useState<boolean>(() => {
    try {
      return localStorage.getItem('screensense_is_custom_dest') === 'true';
    } catch {
      return false;
    }
  });

  const [isCustomOriginAddress, setIsCustomOriginAddress] = useState<boolean>(() => {
    try {
      return localStorage.getItem('screensense_is_custom_origin') === 'true';
    } catch {
      return false;
    }
  });

  // Sourcing Origin & Delivery Destination Logistics Corridor State (Persistent in localStorage)
  const [routeConfig, setRouteConfig] = useState<RouteLogisticsConfig>(() => {
    try {
      const stored = localStorage.getItem('screensense_route_config');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      originCountry: 'South Africa',
      originProvince: 'Gauteng',
      originCity: 'Johannesburg',
      originAddress: '45 Baragwanath Rd, Industrial Zone, Johannesburg',
      destCountry: 'Zambia',
      destProvince: 'Copperbelt',
      destCity: 'Kitwe',
      destAddress: 'Chibuluma Road Industrial Area, Kitwe, Zambia',
    };
  });

  // Save to localStorage whenever routeConfig or custom address flags update
  React.useEffect(() => {
    try {
      localStorage.setItem('screensense_route_config', JSON.stringify(routeConfig));
      localStorage.setItem('screensense_is_custom_dest', isCustomDestAddress ? 'true' : 'false');
      localStorage.setItem('screensense_is_custom_origin', isCustomOriginAddress ? 'true' : 'false');
    } catch {}
  }, [routeConfig, isCustomDestAddress, isCustomOriginAddress]);

  // Default to true so user immediately sees the interactive Google Map with Point A and Point B
  const [showCorridorMap, setShowCorridorMap] = useState(true);

  // Smart 1-Tap Universal Search for Non-Technical Users
  const [naturalQuery, setNaturalQuery] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);
  const [aiExpansionInfo, setAiExpansionInfo] = useState<SmartSearchExpansionResult | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // RFQ Email Modal State
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [rfqTargetSupplier, setRfqTargetSupplier] = useState<LeadItem | null>(null);

  // Active CRM Database State (Persistent in localStorage)
  const [crmEntities, setCrmEntities] = useState<CrmEntity[]>(() => {
    try {
      const stored = localStorage.getItem('screensense_crm_database');
      if (stored) return JSON.parse(stored);
    } catch {}

    // Default seed contacts for immediate exploration
    return [
      {
        id: 'crm-sup-1',
        entityType: 'supplier',
        name: 'Atlas Safety Equipment Ltd',
        category: 'Heavy Mining Safety & Traffic Barrier Manufacturer',
        industry: 'Mining & Industrial Safety',
        location: {
          country: 'South Africa',
          province: 'Gauteng',
          area: 'Johannesburg',
          address: '45 Baragwanath Rd, Industrial Zone, Johannesburg',
        },
        website: 'https://www.atlassafety.co.za',
        description: 'Manufacturer of heavy-duty 1.8m UV-stabilized mining barrier cones and industrial traffic barriers.',
        contactPersons: [
          {
            id: 'cp-1',
            name: 'David Van Der Merwe',
            role: 'Commercial & Export Sales Manager',
            email: 'sales@atlassafety.co.za',
            phone: '+27 11 830 4400',
            whatsapp: '+27 11 830 4400',
          },
        ],
        pipelineStage: 'Quotation Requested',
        leadScore: 'Hot Lead',
        verificationScore: 95,
        productsOrNeeds: ['1.8m Mining Barrier Cones', 'Reflective Delineators', 'Mine Edge Demarcation'],
        tags: ['Mining', 'Direct Manufacturer', 'Export to Zambia'],
        notes: 'Supplies open-cast mining operations in Zambia and DRC. Initial quote was $85/unit, open to volume breaks for >100 units.',
        currency: 'USD',
        initialQuotePrice: 85,
        currentQuotePrice: 78,
        targetPrice: 70,
        moq: '8 units',
        leadTimeDays: 7,
        paymentTerms: '50% deposit / 50% on bill of lading',
        freightIncoterms: 'DDP Lusaka',
        concessionsObtained: [
          {
            id: 'conc-1',
            type: 'Price Reduction',
            description: 'Volume discount from $85 to $78 per cone for confirmed batch',
            estimatedValue: 700,
            roundObtained: 2,
            date: Date.now() - 86400000,
          },
        ],
        totalSavingsAchieved: 700,
        savingsPercentage: 8.2,
        negotiationRounds: [],
        createdAt: Date.now() - 172800000,
        updatedAt: Date.now(),
      },
      {
        id: 'crm-cust-1',
        entityType: 'customer',
        name: 'Kansanshi Copper Mining Plc',
        category: 'Tier-1 Copper & Gold Mine Operator',
        industry: 'Mining & Mineral Extraction',
        location: {
          country: 'Zambia',
          province: 'North-Western Province',
          area: 'Solwezi',
        },
        website: 'https://www.first-quantum.com',
        description: 'Large-scale open pit copper mine requiring heavy perimeter demarcation and exclusion zone barrier cones.',
        contactPersons: [
          {
            id: 'cp-2',
            name: 'Chileshe Mulenga',
            role: 'Procurement & Safety Equipment Lead',
            email: 'procurement@kansanshi.com',
            phone: '+260 212 650000',
          },
        ],
        pipelineStage: 'Qualified',
        leadScore: 'Hot Lead',
        verificationScore: 98,
        productsOrNeeds: ['1.8m Mining Barrier Cones', 'Reflective Hazard Tape', 'Heavy Duty Base Weights'],
        tags: ['Zambia Mining', 'Active Buyer', 'Large Volume Demand'],
        notes: 'Expanding open pit haul roads; actively seeking compliant 1.8m white/branded safety cones.',
        currency: 'USD',
        concessionsObtained: [],
        totalSavingsAchieved: 0,
        savingsPercentage: 0,
        negotiationRounds: [],
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now(),
      },
    ];
  });

  const [selectedNegotiationSupplier, setSelectedNegotiationSupplier] = useState<CrmEntity | null>(null);

  // Sync CRM updates to localStorage
  const saveCrmEntities = (newEntities: CrmEntity[]) => {
    setCrmEntities(newEntities);
    try {
      localStorage.setItem('screensense_crm_database', JSON.stringify(newEntities));
    } catch {}
  };

  const handleUpdateCrmEntity = (entity: CrmEntity) => {
    const exists = crmEntities.some((e) => e.id === entity.id);
    if (exists) {
      saveCrmEntities(crmEntities.map((e) => (e.id === entity.id ? entity : e)));
    } else {
      saveCrmEntities([entity, ...crmEntities]);
    }
  };

  const handleDeleteCrmEntity = (id: string) => {
    saveCrmEntities(crmEntities.filter((e) => e.id !== id));
  };

  const handleOpenNegotiationForEntity = (entity: CrmEntity) => {
    setSelectedNegotiationSupplier(entity);
    setActiveTab('negotiation');
  };

  const handleOpenRfqForEntity = (entity: CrmEntity) => {
    const leadEquiv: LeadItem = {
      id: entity.id,
      name: entity.name,
      category: entity.category,
      entityType: entity.entityType,
      location: entity.location,
      website: entity.website,
      description: entity.description,
      contactChannels: entity.contactPersons.map((c) => c.email || c.phone || c.name),
      valueProp: '',
      fitScore: 'High',
      suggestedOutreach: `Inquiry regarding ${entity.productsOrNeeds.join(', ')}`,
      status: 'New',
    };
    handleOpenRfq(leadEquiv);
  };

  const handleSaveNegotiationRound = (supplierId: string, roundRecord: NegotiationRoundRecord, updatedCurrentPrice?: number) => {
    saveCrmEntities(
      crmEntities.map((e) => {
        if (e.id !== supplierId) return e;
        const rounds = [...(e.negotiationRounds || []), roundRecord];
        const newCurrent = updatedCurrentPrice || e.currentQuotePrice || roundRecord.negotiatedPriceAtRound;
        const initial = e.initialQuotePrice || newCurrent;
        const totalSavings = Math.max(0, initial - newCurrent) * 100;
        const savingsPct = initial > 0 ? Math.round(((initial - newCurrent) / initial) * 100 * 10) / 10 : 0;
        return {
          ...e,
          currentQuotePrice: newCurrent,
          totalSavingsAchieved: totalSavings,
          savingsPercentage: savingsPct,
          negotiationRounds: rounds,
          pipelineStage: 'Negotiating',
          updatedAt: Date.now(),
        };
      })
    );
  };

  const handleAddConcession = (supplierId: string, concession: NegotiationConcession) => {
    saveCrmEntities(
      crmEntities.map((e) => {
        if (e.id !== supplierId) return e;
        const concs = [...(e.concessionsObtained || []), concession];
        const addedVal = concession.estimatedValue || 0;
        return {
          ...e,
          concessionsObtained: concs,
          totalSavingsAchieved: (e.totalSavingsAchieved || 0) + addedVal,
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Procurement + Sales Resale Arbitrage Loop
  const resaleOpportunities = React.useMemo<ResaleOpportunity[]>(() => {
    const opps: ResaleOpportunity[] = [];
    const suppliers = crmEntities.filter((e) => e.entityType === 'supplier');
    const customers = crmEntities.filter((e) => e.entityType === 'customer');

    for (const sup of suppliers) {
      for (const cust of customers) {
        const commonProduct = sup.productsOrNeeds.find((sp) =>
          cust.productsOrNeeds.some((cp) =>
            sp.toLowerCase().includes(cp.toLowerCase()) || cp.toLowerCase().includes(sp.toLowerCase())
          )
        );

        if (commonProduct) {
          const supplierCost = sup.currentQuotePrice || sup.initialQuotePrice || 75;
          const estimatedLanded = Math.round(supplierCost * 1.15 * 100) / 100;
          const sellingPrice = Math.round(estimatedLanded * 1.35 * 100) / 100;
          const qty = 100;
          const profit = Math.round((sellingPrice - estimatedLanded) * qty);

          opps.push({
            id: `resale-${sup.id}-${cust.id}`,
            supplierId: sup.id,
            supplierName: sup.name,
            customerId: cust.id,
            customerName: cust.name,
            productName: commonProduct,
            supplierCostPerUnit: supplierCost,
            estimatedLandedCostPerUnit: estimatedLanded,
            estimatedSellingPricePerUnit: sellingPrice,
            estimatedQuantity: qty,
            grossMarginPercent: 26.0,
            projectedProfit: profit,
            status: 'Actionable',
          });
        }
      }
    }
    return opps;
  }, [crmEntities]);

  const handleOpenRfq = (supplierItem?: LeadItem) => {
    setRfqTargetSupplier(supplierItem || null);
    setIsRfqModalOpen(true);
  };

  // Preset location quick chips
  const locationPresets = [
    { country: 'South Africa', province: 'Gauteng', area: 'Johannesburg', industry: 'Clean Energy & Solar' },
    { country: 'United Kingdom', province: 'Greater London', area: 'London', industry: 'FinTech & B2B SaaS' },
    { country: 'United States', province: 'California', area: 'San Francisco', industry: 'AI & Enterprise Tech' },
    { country: 'Canada', province: 'Ontario', area: 'Toronto', industry: 'Construction & Materials' },
    { country: 'Kenya', province: 'Nairobi County', area: 'Nairobi', industry: 'AgriTech & Fresh Produce' },
    { country: 'Australia', province: 'New South Wales', area: 'Sydney', industry: 'Healthcare & Medical Devices' },
    { country: 'Zimbabwe', province: 'Harare Province', area: 'Harare', industry: 'Wholesale Trade & Distribution' },
  ];

  const handleApplyPreset = (preset: typeof locationPresets[0]) => {
    setCountry(preset.country);
    setProvince(preset.province);
    setArea(preset.area);
    setIndustry(preset.industry);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!country.trim() || !industry.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    soundManager.playScanStart();

    try {
      const data = await generateLeadsApi({
        country,
        province,
        area,
        industry,
        targetPersona,
        objective,
        targetType,
        customKeywords,
        groundingMode,
        sourcingOrigin: `${routeConfig.originCity}, ${routeConfig.originProvince}, ${routeConfig.originCountry}`,
        deliveryDestination: `${routeConfig.destCity}, ${routeConfig.destProvince}, ${routeConfig.destCountry}`,
        model: selectedModel,
      });

      setResult(data);
      soundManager.playScanComplete();

      // Automatically populate pipeline
      const newDiscovered = data.leads || [];
      if (newDiscovered.length > 0) {
        setSavedLeads((prev) => {
          const newItems = newDiscovered.filter(
            (l) => !prev.some((p) => p.name.toLowerCase() === l.name.toLowerCase())
          );
          const combined = [...newItems, ...prev];
          try {
            localStorage.setItem('screensense_saved_leads', JSON.stringify(combined));
          } catch {}
          return combined;
        });
      }

      // Switch to relevant tab
      if (targetType === 'suppliers') setActiveTab('suppliers');
      else if (targetType === 'customers') setActiveTab('customers');
      else setActiveTab('all');
    } catch (err: any) {
      console.error('Lead Generation failed:', err);
      setErrorMsg(err.message || 'Failed to search for leads and suppliers');
      soundManager.playAlert();
    } finally {
      setIsLoading(false);
    }
  };

  // Smart 1-Tap Search for Non-Technical Users
  const handleSmartAiSearch = async (queryToUse?: string) => {
    const q = (queryToUse !== undefined ? queryToUse : naturalQuery).trim();
    if (!q || isExpanding || isLoading) return;

    setIsExpanding(true);
    setIsLoading(true);
    setErrorMsg(null);
    soundManager.playScanStart();

    try {
      // 1. Expand natural query with AI
      const expansion = await smartSearchExpandApi(q, {
        defaultOrigin: `${routeConfig.originCity}, ${routeConfig.originCountry}`,
        defaultDestination: `${routeConfig.destCity}, ${routeConfig.destCountry}`,
      });

      setAiExpansionInfo(expansion);

      // 2. Synchronize routeConfig (From & To) without overwriting custom addresses
      const keepCustomDest = isCustomDestAddress && Boolean(routeConfig.destAddress && routeConfig.destAddress.trim().length > 0);
      const keepCustomOrig = isCustomOriginAddress && Boolean(routeConfig.originAddress && routeConfig.originAddress.trim().length > 0);

      const resolvedDestCity = expansion.destination?.city || routeConfig.destCity;
      const resolvedDestCountry = expansion.destination?.country || routeConfig.destCountry;
      const resolvedOrigCity = expansion.origin?.city || routeConfig.originCity;
      const resolvedOrigCountry = expansion.origin?.country || routeConfig.originCountry;

      const newRoute: RouteLogisticsConfig = {
        originCountry: resolvedOrigCountry,
        originProvince: expansion.origin?.province || routeConfig.originProvince,
        originCity: resolvedOrigCity,
        originAddress: keepCustomOrig
          ? routeConfig.originAddress
          : (expansion.origin?.address || `Industrial Depot, ${resolvedOrigCity}, ${resolvedOrigCountry}`),
        destCountry: resolvedDestCountry,
        destProvince: expansion.destination?.province || routeConfig.destProvince,
        destCity: resolvedDestCity,
        destAddress: keepCustomDest
          ? routeConfig.destAddress
          : (expansion.destination?.address || `Receiving Site, ${resolvedDestCity}, ${resolvedDestCountry}`),
      };
      setRouteConfig(newRoute);

      // 3. Update search filter fields
      const targetCountry = expansion.destination?.country || expansion.origin?.country || 'Zambia';
      const targetProvince = expansion.destination?.province || expansion.origin?.province || 'Copperbelt';
      const targetCity = expansion.destination?.city || expansion.origin?.city || 'Kitwe';

      setCountry(targetCountry);
      setProvince(targetProvince);
      setArea(targetCity);
      setIndustry(expansion.industry || 'Mining & Industrial Safety');
      setTargetPersona(expansion.targetPersona || 'Procurement Directors & Operations Managers');
      setTargetType(expansion.targetType || 'both');
      setCustomKeywords(expansion.deepKeywords?.join(', ') || expansion.itemOrService);

      // Ensure map is visible so user sees the newly resolved Point A and Point B
      setShowCorridorMap(true);

      // 4. Execute deep search with the AI expanded parameters
      const data = await generateLeadsApi({
        country: targetCountry,
        province: targetProvince,
        area: targetCity,
        industry: expansion.industry,
        targetPersona: expansion.targetPersona,
        targetType: expansion.targetType,
        customKeywords: expansion.deepKeywords?.join(', '),
        groundingMode,
        sourcingOrigin: `${newRoute.originCity}, ${newRoute.originProvince}, ${newRoute.originCountry}`,
        deliveryDestination: `${newRoute.destCity}, ${newRoute.destProvince}, ${newRoute.destCountry}`,
      });

      setResult(data);
      soundManager.playScanComplete();

      // Automatically add discovered items into pipeline
      const newDiscovered = data.leads || [];
      if (newDiscovered.length > 0) {
        setSavedLeads((prev) => {
          const newItems = newDiscovered.filter(
            (l) => !prev.some((p) => p.name.toLowerCase() === l.name.toLowerCase())
          );
          const combined = [...newItems, ...prev];
          try {
            localStorage.setItem('screensense_saved_leads', JSON.stringify(combined));
          } catch {}
          return combined;
        });
      }

      // Switch to relevant tab
      if (expansion.targetType === 'suppliers') setActiveTab('suppliers');
      else if (expansion.targetType === 'customers') setActiveTab('customers');
      else setActiveTab('all');
    } catch (err: any) {
      console.error('Smart AI Search failed:', err);
      setErrorMsg(err.message || 'Smart search failed. Please try again.');
      soundManager.playAlert();
    } finally {
      setIsExpanding(false);
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: LeadItem['status']) => {
    setSavedLeads((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
      try {
        localStorage.setItem('screensense_saved_leads', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    soundManager.playTargetLocated();
  };

  const isLeadInCrm = (name: string) =>
    crmEntities.some((e) => e.name.toLowerCase() === name.toLowerCase());

  const handleSaveLeadToCrm = (item: LeadItem) => {
    const existing = crmEntities.find((e) => e.name.toLowerCase() === item.name.toLowerCase());
    if (existing) {
      if (existing.entityType === 'supplier') {
        setSelectedNegotiationSupplier(existing);
      }
      setActiveTab('crm');
      soundManager.playTargetLocated();
      return;
    }

    const newEntity: CrmEntity = {
      id: `crm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entityType: item.entityType || 'supplier',
      name: item.name,
      category: item.category,
      industry: industry || 'Mining & Industrial',
      location: {
        country: item.location?.country || country,
        province: item.location?.province || province,
        area: item.location?.area || area,
        address: item.address,
      },
      website: item.website,
      mapsUrl: item.mapsUrl,
      description: item.description,
      contactPersons: [
        {
          id: `cp-${Date.now()}`,
          name: item.customerDetails?.decisionMakerRole || (item.entityType === 'supplier' ? 'Sales & Commercial Manager' : 'Procurement Buyer'),
          role: item.customerDetails?.decisionMakerRole || (item.entityType === 'supplier' ? 'Sales Manager' : 'Procurement Lead'),
          email: item.contactChannels?.find((c) => c.includes('@')) || '',
          phone: item.contactChannels?.find((c) => !c.includes('@') && /[\d+]/.test(c)) || '',
        },
      ],
      pipelineStage: item.status === 'Contacted' ? 'Contacted' : 'Discovered',
      leadScore: item.fitScore === 'High' ? 'Hot Lead' : 'Strong Lead',
      verificationScore: 92,
      productsOrNeeds: [item.category, customKeywords.split(',')[0]?.trim()].filter(Boolean),
      tags: [item.location?.country || country, item.entityType || 'lead'],
      notes: `${item.valueProp || ''} ${item.suggestedOutreach ? `\nOutreach Pitch: ${item.suggestedOutreach}` : ''}`.trim(),
      currency: 'USD',
      concessionsObtained: [],
      totalSavingsAchieved: 0,
      savingsPercentage: 0,
      negotiationRounds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveCrmEntities([newEntity, ...crmEntities]);
    soundManager.playStepSuccess();
  };

  const handleCopy = (id: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleExportCSV = () => {
    const listToExport = savedLeads.length > 0 ? savedLeads : result?.leads || [];
    if (listToExport.length === 0) return;

    const headers = [
      'Type',
      'Name',
      'Category',
      'Country',
      'Province',
      'Area',
      'Address',
      'Website',
      'FitScore',
      'Status',
      'SuggestedOutreach',
      'RetentionAngle',
    ];
    const rows = listToExport.map((l) => [
      `"${l.entityType || 'lead'}"`,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.category.replace(/"/g, '""')}"`,
      `"${l.location?.country || ''}"`,
      `"${l.location?.province || ''}"`,
      `"${l.location?.area || ''}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${l.website || ''}"`,
      `"${l.fitScore || ''}"`,
      `"${l.status || 'New'}"`,
      `"${(l.suggestedOutreach || '').replace(/"/g, '""')}"`,
      `"${(l.retentionAngle || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `suppliers_customers_${country}_${area || 'all'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Firefox manifest.json download
  const handleDownloadFirefoxManifest = () => {
    const manifest = {
      manifest_version: 2,
      name: 'ScreenSense AI - Supplier & Customer Lead Finder for Firefox',
      version: '1.0.0',
      description: 'Find verified suppliers, wholesale manufacturers, B2B customer leads, and retention playbooks anywhere in Firefox.',
      icons: {
        '48': 'icons/icon-48.png',
        '96': 'icons/icon-96.png'
      },
      permissions: [
        'activeTab',
        'storage',
        'tabs',
        '<all_urls>'
      ],
      sidebar_action: {
        default_title: 'ScreenSense Sourcing Companion',
        default_panel: 'sidebar.html',
        default_icon: 'icons/icon-48.png'
      },
      browser_action: {
        default_title: 'ScreenSense AI',
        default_popup: 'popup.html'
      }
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const suppliersList = result?.suppliers || result?.leads?.filter((l) => l.entityType === 'supplier') || [];
  const customersList = result?.customers || result?.leads?.filter((l) => l.entityType === 'customer' || !l.entityType) || [];
  const allLeadsList = result?.leads || [];

  return (
    <div
      className={`flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${
        firefoxSidebarMode ? 'max-w-md mx-auto ring-2 ring-orange-500/50' : 'w-full'
      }`}
    >
      {/* Header */}
      <div className="p-4 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">
                Supplier Sourcing &amp; Customer Leads
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                <span>🦊</span>
                <span>Firefox Add-on</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Find verified wholesale suppliers and customer leads with local retention strategies
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('crm')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              activeTab === 'crm'
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Open CRM Database with contact information discovered during RFQ and sourcing"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span>CRM Database ({crmEntities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('negotiation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              activeTab === 'negotiation'
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Open AI Commercial Intelligence, Staged Quantity, and Negotiation Engine"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Negotiator</span>
          </button>

          <button
            onClick={() => setActiveTab('campaign')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              activeTab === 'campaign'
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md'
                : 'bg-gradient-to-r from-sky-600/30 to-indigo-600/30 hover:from-sky-600/40 hover:to-indigo-600/40 text-sky-200 border-sky-500/40'
            }`}
            title="Open Multi-Client Email Campaign & Multi-Supplier Sourcing Hub"
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span>Multi-Client Email &amp; Sourcing</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-sky-400/20 text-sky-200">
              {customersList.length}C / {suppliersList.length}S
            </span>
          </button>

          <button
            onClick={() => handleOpenRfq()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            title="Compose formal RFQ sourcing email with custom signature (e.g. Hanekom Innovations Limited)"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Write Sourcing Email</span>
          </button>

          <button
            onClick={() => setFirefoxSidebarMode(!firefoxSidebarMode)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              firefoxSidebarMode
                ? 'bg-orange-500 text-white border-orange-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Firefox Add-on Sidebar Preview"
          >
            <span>🦊</span>
            <span className="hidden sm:inline">Sidebar Mode</span>
          </button>

          {(allLeadsList.length > 0 || savedLeads.length > 0) && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 transition-colors"
              title="Export discovered entities to CSV"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-5">
        {/* 1. Smart 1-Tap AI Universal Search (For non-technical / simple search) */}
        <div className="p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-400/30 rounded-2xl space-y-3.5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black shadow-md flex items-center justify-center">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Smart AI Universal Search</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    One-Tap Search
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Enter any product, item, supplier, or customer in plain English. AI will automatically find keywords, industry, decision-maker roles, and origin/destination corridor.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>{showAdvancedFilters ? 'Hide Advanced Form' : 'Show Advanced Form'}</span>
            </button>
          </div>

          {/* Single input & Search Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSmartAiSearch();
            }}
            className="flex flex-col sm:flex-row items-stretch gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={naturalQuery}
                onChange={(e) => setNaturalQuery(e.target.value)}
                placeholder="e.g. 1.8m barrier cones from South Africa to Kitwe Zambia, or solar panels in Lusaka, or mining safety gear"
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl pl-10 pr-14 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none shadow-inner"
              />
              {naturalQuery && (
                <button
                  type="button"
                  onClick={() => setNaturalQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5 rounded cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isExpanding || isLoading || !naturalQuery.trim()}
              className="px-6 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {isExpanding || isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>AI Searching &amp; Sourcing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>AI Deep Search</span>
                </>
              )}
            </button>
          </form>

          {/* Quick example chips */}
          <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto pt-0.5 pb-1">
            <span className="text-slate-400 whitespace-nowrap font-medium">Quick Examples:</span>
            {[
              '1.8m barrier cones from South Africa to Kitwe Zambia',
              'Commercial solar panels from Johannesburg to Lusaka',
              'Copper mining cables from Durban to Ndola Zambia',
              'Mine safety PPE and boots for Kansanshi Solwezi',
            ].map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNaturalQuery(example);
                  handleSmartAiSearch(example);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-amber-400/40 text-[11px] whitespace-nowrap transition cursor-pointer"
              >
                {example}
              </button>
            ))}
          </div>

          {/* AI Explanation Pill if present */}
          {aiExpansionInfo && (
            <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/25 text-xs text-slate-200 space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Deep Search Intelligence:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {aiExpansionInfo.deepKeywords?.length || 0} Keywords Generated • {aiExpansionInfo.targetPersona}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {aiExpansionInfo.explanation}
              </p>
              <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                  Item: <strong>{aiExpansionInfo.itemOrService}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300">
                  Industry: <strong>{aiExpansionInfo.industry}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                  Corridor: <strong>{routeConfig.originCity}, {routeConfig.originCountry} ➔ {routeConfig.destCity}, {routeConfig.destCountry}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Sourcing Origin (FROM) & Delivery Destination (TO) Hub with Always-Visible Interactive Google Map */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <span>Sourcing Origin (FROM) ➔ Delivery Destination (TO)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Google Maps Platform
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Set where goods are coming from and where they are going to (e.g. South Africa, Gauteng to Zambia, Kitwe or Lusaka).
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  // Swap Origin and Destination
                  setRouteConfig({
                    originCountry: routeConfig.destCountry,
                    originProvince: routeConfig.destProvince,
                    originCity: routeConfig.destCity,
                    originAddress: routeConfig.destAddress,
                    destCountry: routeConfig.originCountry,
                    destProvince: routeConfig.originProvince,
                    destCity: routeConfig.originCity,
                    destAddress: routeConfig.originAddress,
                  });
                  setCountry(routeConfig.originCountry);
                  setProvince(routeConfig.originProvince);
                  setArea(routeConfig.originCity);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Swap Origin and Destination points"
              >
                <span>⇄</span>
                <span>Swap Points</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCorridorMap(!showCorridorMap)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                  showCorridorMap
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border-slate-700'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>{showCorridorMap ? 'Hide Map' : 'Show Google Map (2 Points)'}</span>
              </button>
            </div>
          </div>

          {/* FROM & TO Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Point A (FROM) */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                    A
                  </span>
                  <span>FROM: Sourcing Origin</span>
                </span>
                <span className="text-[10px] text-slate-400">Where items come from</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Origin Country *</label>
                  <input
                    type="text"
                    value={routeConfig.originCountry}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRouteConfig((prev) => {
                        const keepCustom = isCustomOriginAddress && Boolean(prev.originAddress && prev.originAddress.trim().length > 0);
                        return {
                          ...prev,
                          originCountry: val,
                          originAddress: keepCustom ? prev.originAddress : (prev.originCity ? `Industrial Depot, ${prev.originCity}, ${val}` : prev.originAddress),
                        };
                      });
                    }}
                    placeholder="e.g. South Africa"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-200 font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Origin State / Province</label>
                  <input
                    type="text"
                    value={routeConfig.originProvince}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRouteConfig((prev) => ({ ...prev, originProvince: val }));
                    }}
                    placeholder="e.g. Gauteng"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Origin City / Area *</label>
                  <input
                    type="text"
                    value={routeConfig.originCity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRouteConfig((prev) => {
                        const keepCustom = isCustomOriginAddress && Boolean(prev.originAddress && prev.originAddress.trim().length > 0);
                        return {
                          ...prev,
                          originCity: val,
                          originAddress: keepCustom ? prev.originAddress : (val.trim() ? `Industrial Depot, ${val}` : ''),
                        };
                      });
                    }}
                    placeholder="e.g. Johannesburg"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] text-slate-400 font-semibold">
                    Origin Facility / Factory Address
                  </label>
                  {isCustomOriginAddress && routeConfig.originAddress ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1">
                        <Check className="w-3 h-3 text-amber-400" />
                        <span>Custom Address Set</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomOriginAddress(false);
                          setRouteConfig((prev) => ({
                            ...prev,
                            originAddress: `Industrial Zone Depot, ${prev.originCity || 'Johannesburg'}, ${prev.originCountry || 'South Africa'}`,
                          }));
                        }}
                        className="text-[10px] text-slate-400 hover:text-amber-400 underline cursor-pointer"
                      >
                        ↺ Reset to area default
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setRouteConfig((prev) => ({
                          ...prev,
                          originAddress: `Industrial Zone Depot, ${prev.originCity || 'Johannesburg'}, ${prev.originCountry || 'South Africa'}`,
                        }));
                      }}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                    >
                      + Fill default for {routeConfig.originCity || 'City'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={routeConfig.originAddress}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIsCustomOriginAddress(val.trim().length > 0);
                    setRouteConfig((prev) => ({ ...prev, originAddress: val }));
                  }}
                  placeholder="e.g. 45 Baragwanath Rd, Industrial Zone, Johannesburg"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 placeholder:text-slate-600 font-medium"
                />
              </div>
            </div>

            {/* Point B (TO) */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                    B
                  </span>
                  <span>TO: Delivery Destination</span>
                </span>
                <span className="text-[10px] text-slate-400">Where items must be delivered</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Destination Country *</label>
                  <input
                    type="text"
                    value={routeConfig.destCountry}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRouteConfig((prev) => {
                        const keepCustom = isCustomDestAddress && Boolean(prev.destAddress && prev.destAddress.trim().length > 0);
                        return {
                          ...prev,
                          destCountry: val,
                          destAddress: keepCustom ? prev.destAddress : (prev.destCity ? `Receiving Yard, ${prev.destCity}, ${val}` : prev.destAddress),
                        };
                      });
                      setCountry(val);
                    }}
                    placeholder="e.g. Zambia"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-medium focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Destination State *</label>
                  <input
                    type="text"
                    value={routeConfig.destProvince}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRouteConfig((prev) => ({ ...prev, destProvince: val }));
                      setProvince(val);
                    }}
                    placeholder="e.g. Copperbelt or Lusaka"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Destination City *</label>
                  <input
                    type="text"
                    value={routeConfig.destCity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRouteConfig((prev) => {
                        const keepCustom = isCustomDestAddress && Boolean(prev.destAddress && prev.destAddress.trim().length > 0);
                        return {
                          ...prev,
                          destCity: val,
                          destAddress: keepCustom ? prev.destAddress : (val.trim() ? `Receiving Site, ${val}` : ''),
                        };
                      });
                      setArea(val);
                    }}
                    placeholder="e.g. Kitwe, Lusaka, Solwezi"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] text-slate-400 font-semibold">
                    Delivery Site / Mine / Facility Address (Optional)
                  </label>
                  {isCustomDestAddress && routeConfig.destAddress ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Custom Address Locked</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomDestAddress(false);
                          setRouteConfig((prev) => ({
                            ...prev,
                            destAddress: `Receiving Site, ${prev.destCity || 'Kitwe'}, ${prev.destCountry || 'Zambia'}`,
                          }));
                        }}
                        className="text-[10px] text-slate-400 hover:text-emerald-400 underline cursor-pointer"
                      >
                        ↺ Reset to area default
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setRouteConfig((prev) => ({
                          ...prev,
                          destAddress: `Receiving Site, ${prev.destCity || 'Kitwe'}, ${prev.destCountry || 'Zambia'}`,
                        }));
                      }}
                      className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                    >
                      + Fill default for {routeConfig.destCity || 'City'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={routeConfig.destAddress}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIsCustomDestAddress(val.trim().length > 0);
                    setRouteConfig((prev) => ({ ...prev, destAddress: val }));
                  }}
                  placeholder="e.g. Plot 1290, Chibuluma Road Mining Depot, Kitwe, Zambia"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-emerald-200 focus:outline-none focus:border-emerald-400 placeholder:text-slate-600 font-medium"
                />
              </div>
            </div>
          </div>

          {/* 1-Click Popular Corridor Presets */}
          <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto pb-1">
            <span className="text-slate-400 font-semibold whitespace-nowrap">Quick Corridors:</span>
            {[
              { label: '🇿🇦 JHB ➔ 🇿🇲 Kitwe (Copperbelt)', origC: 'South Africa', origP: 'Gauteng', origCity: 'Johannesburg', destC: 'Zambia', destP: 'Copperbelt', destCity: 'Kitwe' },
              { label: '🇿🇦 JHB ➔ 🇿🇲 Lusaka (Capital)', origC: 'South Africa', origP: 'Gauteng', origCity: 'Johannesburg', destC: 'Zambia', destP: 'Lusaka Province', destCity: 'Lusaka' },
              { label: '🇿🇦 JHB ➔ 🇿🇲 Solwezi (Mines)', origC: 'South Africa', origP: 'Gauteng', origCity: 'Johannesburg', destC: 'Zambia', destP: 'North-Western', destCity: 'Solwezi' },
              { label: '🇿🇦 Durban ➔ 🇿🇲 Ndola', origC: 'South Africa', origP: 'KwaZulu-Natal', origCity: 'Durban', destC: 'Zambia', destP: 'Copperbelt', destCity: 'Ndola' },
              { label: '🇬🇧 London ➔ 🇿🇦 JHB', origC: 'United Kingdom', origP: 'Greater London', origCity: 'London', destC: 'South Africa', destP: 'Gauteng', destCity: 'Johannesburg' },
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setRouteConfig((prev) => {
                    const keepDest = isCustomDestAddress && Boolean(prev.destAddress && prev.destAddress.trim().length > 0);
                    const keepOrig = isCustomOriginAddress && Boolean(prev.originAddress && prev.originAddress.trim().length > 0);
                    return {
                      originCountry: preset.origC,
                      originProvince: preset.origP,
                      originCity: preset.origCity,
                      originAddress: keepOrig ? prev.originAddress : `Industrial Depot, ${preset.origCity}`,
                      destCountry: preset.destC,
                      destProvince: preset.destP,
                      destCity: preset.destCity,
                      destAddress: keepDest ? prev.destAddress : `Receiving Site, ${preset.destCity}`,
                    };
                  });
                  setCountry(preset.destC);
                  setProvince(preset.destP);
                  setArea(preset.destCity);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap text-xs transition cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Interactive Google Map with 2 Connected Points */}
          {showCorridorMap && (
            <div className="pt-1">
              <OriginDestinationMap
                config={routeConfig}
                onChangeConfig={setRouteConfig}
                hideInputs={true}
              />
            </div>
          )}
        </div>

        {/* 3. Detailed Sourcing & Lead Discovery Filters (Collapsible for advanced users) */}
        {showAdvancedFilters && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 shadow-sm animate-fadeIn">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>Fine-Tuned Sourcing &amp; Lead Discovery Filters</span>
              </span>

              {/* Quick Location Presets */}
              <div className="flex items-center gap-1 text-[11px] text-slate-400 overflow-x-auto max-w-full">
                <span className="whitespace-nowrap">Presets:</span>
                {locationPresets.slice(0, 4).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleApplyPreset(p)}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors whitespace-nowrap"
                  >
                    {p.area}, {p.country}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSearch} className="space-y-3">
            {/* Target Type Selector Buttons */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                What are you looking to find?
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('suppliers')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    targetType === 'suppliers'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Suppliers / Vendors</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('customers')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    targetType === 'customers'
                      ? 'bg-sky-400/20 border-sky-400 text-sky-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Customers / Leads</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('both')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    targetType === 'both'
                      ? 'bg-purple-400/20 border-purple-400 text-purple-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Both Suppliers &amp; Leads</span>
                </button>
              </div>
            </div>

            {/* Geographical Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. South Africa, UK, USA"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Province / State / Region
                </label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="e.g. Gauteng, California, Ontario"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Area / City / District
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Johannesburg, London, Toronto"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Industry and Product Keywords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Industry / Sector *
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Clean Energy, Solar Equipment, Textiles"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Specific Products / Keywords
                </label>
                <input
                  type="text"
                  value={customKeywords}
                  onChange={(e) => setCustomKeywords(e.target.value)}
                  placeholder="e.g. solar panels, battery inverters, raw materials"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Target Persona and Objective */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Target Decision Makers / Roles
                </label>
                <input
                  type="text"
                  value={targetPersona}
                  onChange={(e) => setTargetPersona(e.target.value)}
                  placeholder="e.g. Procurement Managers, Operations Directors"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Retention Focus
                </label>
                <select
                  value={objective}
                  onChange={(e: any) => setObjective(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="both">Balanced: Sourcing, Leads &amp; Customer Retention</option>
                  <option value="acquisition">Sourcing &amp; Customer Acquisition Only</option>
                  <option value="retention">Account Retention &amp; Churn Reduction Only</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Grounding Source:</span>
                <button
                  type="button"
                  onClick={() => setGroundingMode(groundingMode === 'maps' ? 'search' : 'maps')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 hover:bg-slate-800"
                >
                  {groundingMode === 'maps' ? (
                    <>
                      <MapPin className="w-3 h-3 text-red-400" />
                      <span>Google Maps Grounding</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3 h-3 text-sky-400" />
                      <span>Google Search Grounding</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !country.trim() || !industry.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Sourcing in {area || province || country}...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-slate-950" />
                    <span>Find {targetType === 'both' ? 'Suppliers & Customers' : targetType === 'suppliers' ? 'Suppliers' : 'Customers'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

        {/* Error message banner */}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-red-300 font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Results ({allLeadsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'suppliers'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Suppliers ({suppliersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'customers'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers ({customersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('campaign')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'campaign'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                : 'text-sky-300 hover:text-sky-100 hover:bg-sky-500/10 border border-sky-500/30'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span>Multi-Client Email &amp; Sourcing ({customersList.length}C / {suppliersList.length}S)</span>
          </button>

          <button
            onClick={() => setActiveTab('corridor')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'corridor'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Route &amp; Map Corridor</span>
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'crm'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>CRM Database ({crmEntities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('negotiation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'negotiation'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>AI Negotiation Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('retention')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'retention'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Retention Playbook ({result?.retentionPlaybook?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pipeline'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Saved Pipeline ({savedLeads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('firefox')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'firefox'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'
            }`}
          >
            <span>🦊</span>
            <span>Firefox Add-on</span>
          </button>

          <button
            onClick={() => handleOpenRfq()}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 border border-amber-400/30"
          >
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            <span>RFQ Sourcing Email Composer</span>
          </button>
        </div>

        {/* Tab 1: All / Filtered Results */}
        {(activeTab === 'all' || activeTab === 'suppliers' || activeTab === 'customers') && (
          <div className="space-y-4">
            {/* Active Sourcing Origin & Delivery Destination Logistics Strip */}
            <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 flex-wrap shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mr-2">Route Corridor:</span>
                  <span className="font-bold text-amber-300">Point A (Origin): {routeConfig.originCity}, {routeConfig.originCountry}</span>
                  <span className="text-slate-500 mx-1.5">➔</span>
                  <span className="font-bold text-emerald-300">Point B (Destination): {routeConfig.destCity}, {routeConfig.destCountry}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('corridor')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <MapIcon className="w-3 h-3 text-sky-400" />
                  <span>Full Map Corridor</span>
                </button>
              </div>
            </div>

            {/* Market Overview Card */}
            {result?.marketOverview && (
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-start gap-3">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 mt-0.5">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 mb-1">
                    Market Intelligence: {area || province || country} ({industry})
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {result.marketOverview}
                  </p>
                </div>
              </div>
            )}

            {/* List of Entities */}
            {(() => {
              const currentList =
                activeTab === 'suppliers'
                  ? suppliersList
                  : activeTab === 'customers'
                  ? customersList
                  : allLeadsList;

              if (currentList.length === 0) {
                return (
                  <div className="p-8 text-center bg-slate-950 border border-dashed border-slate-800 rounded-2xl space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300">
                        No {activeTab === 'suppliers' ? 'suppliers' : activeTab === 'customers' ? 'customers' : 'records'} loaded yet
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Use the filters above to search for verified businesses, wholesalers, manufacturers, and buyers in your target country and city.
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {/* Multi-Selection Batch Controls Header */}
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">
                        {activeTab === 'suppliers' ? 'Suppliers' : activeTab === 'customers' ? 'Clients' : 'Entities'} ({currentList.length})
                      </span>
                      {batchSelectedIds.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {batchSelectedIds.length} Selected
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (batchSelectedIds.length === currentList.length) {
                            setBatchSelectedIds([]);
                          } else {
                            setBatchSelectedIds(currentList.map((i) => i.id));
                          }
                        }}
                        className="text-[11px] font-semibold text-amber-400 hover:underline cursor-pointer"
                      >
                        {batchSelectedIds.length === currentList.length ? 'Deselect All' : `Select All (${currentList.length})`}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('campaign')}
                        className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1 shadow cursor-pointer"
                        title="Open Multi-Client Email Campaign & Sourcing Hub"
                      >
                        <Send className="w-3 h-3" />
                        <span>Launch Multi-Email &amp; Sourcing ({batchSelectedIds.length || currentList.length})</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentList.map((item) => (
                      <EntityCard
                        key={item.id}
                        item={item}
                        onSpeak={onSpeak}
                        onCopy={handleCopy}
                        copiedId={copiedId}
                        onUpdateStatus={handleUpdateStatus}
                        onOpenRfq={handleOpenRfq}
                        onSaveToCrm={handleSaveLeadToCrm}
                        isInCrm={isLeadInCrm(item.name)}
                        isSelected={batchSelectedIds.includes(item.id)}
                        onToggleSelect={(id) => {
                          setBatchSelectedIds((prev) =>
                            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                          );
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab 2: Retention Playbook */}
        {activeTab === 'retention' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-xs text-amber-300 flex items-center justify-between">
              <span>
                Localized customer retention and churn reduction playbook customized for{' '}
                <strong>{country}</strong> ({industry})
              </span>
              <button
                onClick={() =>
                  onSpeak(
                    result?.retentionPlaybook?.map((r) => `${r.title}. ${r.description}`).join(' ') ||
                      'No playbook available yet'
                  )
                }
                className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:underline"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Read Aloud</span>
              </button>
            </div>

            {(!result?.retentionPlaybook || result.retentionPlaybook.length === 0) ? (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-500">
                Run a search to generate a localized customer retention and churn reduction playbook.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.retentionPlaybook.map((strat, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span>{strat.title}</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {strat.impact || 'High Impact'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {strat.description}
                    </p>

                    {strat.localizedContext && (
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                        <strong className="text-slate-300">Local Context: </strong>
                        {strat.localizedContext}
                      </div>
                    )}

                    {strat.actionSteps?.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Execution Steps:
                        </span>
                        {strat.actionSteps.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Saved Pipeline */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-400">
                Track your active discussions, supplier quotes, and customer accounts
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filter Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-200"
                >
                  <option value="all">All ({savedLeads.length})</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="In Discussion">In Discussion</option>
                  <option value="Retained">Retained</option>
                </select>
              </div>
            </div>

            {savedLeads.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-500">
                No items saved to pipeline yet. Sourced suppliers and customer leads appear here automatically.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedLeads
                  .filter((l) => filterStatus === 'all' || l.status === filterStatus)
                  .map((item) => (
                    <EntityCard
                      key={item.id}
                      item={item}
                      onSpeak={onSpeak}
                      onCopy={handleCopy}
                      copiedId={copiedId}
                      onUpdateStatus={handleUpdateStatus}
                      onOpenRfq={handleOpenRfq}
                      onSaveToCrm={handleSaveLeadToCrm}
                      isInCrm={isLeadInCrm(item.name)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: CRM Database Interface */}
        {activeTab === 'crm' && (
          <div className="space-y-4">
            <CrmDatabaseView
              entities={crmEntities}
              onUpdateEntity={handleUpdateCrmEntity}
              onDeleteEntity={handleDeleteCrmEntity}
              onOpenNegotiation={handleOpenNegotiationForEntity}
              onOpenRfq={handleOpenRfqForEntity}
              resaleOpportunities={resaleOpportunities}
            />
          </div>
        )}

        {/* Tab: Dedicated Commercial Intelligence & Negotiation Engine */}
        {activeTab === 'negotiation' && (
          <div className="space-y-4">
            <NegotiationIntelligenceHub
              selectedSupplier={selectedNegotiationSupplier}
              allSuppliers={crmEntities.filter((e) => e.entityType === 'supplier')}
              allCustomers={crmEntities.filter((e) => e.entityType === 'customer')}
              onSaveNegotiationRound={handleSaveNegotiationRound}
              onAddConcession={handleAddConcession}
              onOpenRfq={handleOpenRfqForEntity}
            />
          </div>
        )}

        {/* Tab 4: Firefox Add-on Companion & Export */}
        {activeTab === 'firefox' && (
          <div className="space-y-4 p-5 bg-slate-950 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-2xl">
                🦊
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>Firefox Add-on Integration</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    WebExtension Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Run ScreenSense directly in Firefox's sidebar or as a browser action add-on
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                <h4 className="font-bold text-orange-400 flex items-center gap-2">
                  <span>📦 How to Load in Firefox</span>
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                  <li>Open Firefox and type <code className="bg-slate-950 px-1.5 py-0.5 rounded text-orange-300">about:debugging</code> in the address bar.</li>
                  <li>Click <strong>&quot;This Firefox&quot;</strong> in the left sidebar.</li>
                  <li>Click <strong>&quot;Load Temporary Add-on...&quot;</strong>.</li>
                  <li>Select the downloaded <code className="bg-slate-950 px-1.5 py-0.5 rounded text-orange-300">manifest.json</code> file.</li>
                  <li>The ScreenSense sidebar icon will appear in your Firefox toolbar!</li>
                </ol>
                <button
                  onClick={handleDownloadFirefoxManifest}
                  className="mt-2 w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Firefox manifest.json</span>
                </button>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                <h4 className="font-bold text-amber-400 flex items-center gap-2">
                  <span>🖥️ Firefox Sidebar Features</span>
                </h4>
                <ul className="space-y-1.5 text-slate-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <span><strong>Live Web Sourcing:</strong> Browse trade portals, supplier directories, or client sites while the sidebar automatically extracts leads.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <span><strong>Screen Vision Inspector:</strong> Scan vendor price lists, invoices, and supplier catalogues directly from active tabs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <span><strong>Direct Outreach:</strong> Launch WhatsApp, Email, or LinkedIn inquiries with pre-filled localized pitches.</span>
                  </li>
                </ul>

                <button
                  onClick={() => setFirefoxSidebarMode(!firefoxSidebarMode)}
                  className="mt-2 w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Sliders className="w-4 h-4 text-orange-400" />
                  <span>{firefoxSidebarMode ? 'Switch to Full Web App Mode' : 'Preview Firefox Sidebar Mode'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Logistics Route & Corridor */}
        {activeTab === 'corridor' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 mt-0.5">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>Sourcing Origin &amp; Delivery Destination Corridor</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Google Maps Platform
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Set up sourcing origin (Point A: e.g. South Africa, Gauteng, Johannesburg) and delivery destination (Point B: e.g. Zambia, Copperbelt, Kitwe or Lusaka). The interactive map plots both points, calculates geodesic distance, estimates transit times, and automatically binds to all 5 RFQ and customer outreach email templates.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenRfq()}
                className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Compose RFQ for Route</span>
              </button>
            </div>

            <OriginDestinationMap
              config={routeConfig}
              onConfigChange={setRouteConfig}
            />
          </div>
        )}

        {/* Tab: Multi-Client Email Campaign & Multi-Supplier Sourcing Hub */}
        {activeTab === 'campaign' && (
          <div className="h-full min-h-[640px]">
            <BatchOutreachSourcingHub
              clients={customersList}
              suppliers={suppliersList}
              routeConfig={routeConfig}
              searchedItemName={customKeywords.split(',')[0]?.trim() || naturalQuery || '1.8m Mining Barrier Cones'}
              searchedIndustry={industry}
              onSaveLeadToCrm={handleSaveLeadToCrm}
              onClose={() => setActiveTab('all')}
            />
          </div>
        )}
      </div>

      {/* Floating Batch Outreach & Sourcing Action Bar when entities are selected */}
      {batchSelectedIds.length > 0 && activeTab !== 'campaign' && (
        <div className="sticky bottom-3 z-30 mx-auto max-w-xl w-full px-4">
          <div className="p-3 bg-slate-950/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="font-bold text-slate-100">
                {batchSelectedIds.length} Entities Selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBatchSelectedIds([])}
                className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-[11px] underline cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('campaign')}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Launch Multi-Client Email &amp; Sourcing</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sourcing RFQ Email Composer Modal */}
      <RfqEmailModal
        isOpen={isRfqModalOpen}
        onClose={() => setIsRfqModalOpen(false)}
        supplier={rfqTargetSupplier}
        defaultOrigin={`${routeConfig.originCity}, ${routeConfig.originProvince}, ${routeConfig.originCountry}`}
        defaultDestination={`${routeConfig.destCity}, ${routeConfig.destProvince}, ${routeConfig.destCountry}`}
        routeConfig={routeConfig}
        onUpdateRouteConfig={setRouteConfig}
      />
    </div>
  );
};

// Sub-component for individual Supplier or Customer Lead Card
interface EntityCardProps {
  item: LeadItem;
  onSpeak: (text: string) => void;
  onCopy: (id: string, text: string) => void;
  copiedId: string | null;
  onUpdateStatus: (id: string, status: LeadItem['status']) => void;
  onOpenRfq?: (item: LeadItem) => void;
  onSaveToCrm?: (item: LeadItem) => void;
  isInCrm?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const EntityCard: React.FC<EntityCardProps> = ({
  item,
  onSpeak,
  onCopy,
  copiedId,
  onUpdateStatus,
  onOpenRfq,
  onSaveToCrm,
  isInCrm = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const isSupplier = item.entityType === 'supplier';

  return (
    <div
      className={`p-4 bg-slate-950 border rounded-2xl flex flex-col justify-between space-y-3 transition-all shadow-sm ${
        isSelected
          ? 'border-amber-400 ring-2 ring-amber-400/30 bg-slate-925 shadow-amber-500/10'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(item.id)}
                className="mt-1 w-4 h-4 rounded border-slate-700 text-amber-400 focus:ring-amber-400 cursor-pointer"
                title="Select for Multi-Client Email Campaign or Multi-Supplier Sourcing"
              />
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isSupplier
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-sky-400/20 text-sky-300 border border-sky-400/30'
                  }`}
                >
                  {isSupplier ? '🏭 Supplier / Vendor' : '👥 Customer / Buyer'}
                </span>

                <span className="text-[11px] font-semibold text-slate-400">
                  {item.category}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-100 mt-1">
                {item.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                item.fitScore === 'High'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {item.fitScore} Fit
            </span>

            <button
              onClick={() => onSpeak(`${item.name}. ${item.description}. Suggested outreach: ${item.suggestedOutreach}`)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              title="Listen to overview"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed">
          {item.description}
        </p>

        {/* Location & Address */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="truncate">
            {item.address || `${item.location?.area || ''}, ${item.location?.province || ''}, ${item.location?.country || ''}`}
          </span>
          {item.mapsUrl && (
            <a
              href={item.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:underline inline-flex items-center gap-0.5 text-[11px] shrink-0"
            >
              <span>Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Supplier details pill if supplier */}
        {isSupplier && item.supplierDetails && (
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
            {item.supplierDetails.moq && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Min Order Qty (MOQ):</span>
                <span className="font-semibold text-amber-300">{item.supplierDetails.moq}</span>
              </div>
            )}
            {item.supplierDetails.supplyCapacity && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Supply Capacity:</span>
                <span>{item.supplierDetails.supplyCapacity}</span>
              </div>
            )}
            {item.supplierDetails.tradeTerms && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Trade Terms:</span>
                <span>{item.supplierDetails.tradeTerms}</span>
              </div>
            )}
          </div>
        )}

        {/* Customer details pill if customer */}
        {!isSupplier && item.customerDetails && (
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
            {item.customerDetails.decisionMakerRole && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Target Role:</span>
                <span className="font-semibold text-sky-300">{item.customerDetails.decisionMakerRole}</span>
              </div>
            )}
            {item.customerDetails.buyingIntent && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Buying Intent:</span>
                <span className="text-emerald-400 font-semibold">{item.customerDetails.buyingIntent}</span>
              </div>
            )}
          </div>
        )}

        {/* Suggested Outreach Pitch */}
        {item.suggestedOutreach && (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{isSupplier ? 'Supplier Inquiry Pitch' : 'Sales Outreach Pitch'}</span>
              </span>
              <button
                onClick={() => onCopy(item.id, item.suggestedOutreach)}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="italic text-slate-400 leading-relaxed">&ldquo;{item.suggestedOutreach}&rdquo;</p>
          </div>
        )}

        {/* Retention / Loyalty Driver */}
        {item.retentionAngle && (
          <div className="text-[11px] text-slate-400">
            <strong className="text-slate-300">Retention Strategy: </strong>
            <span>{item.retentionAngle}</span>
          </div>
        )}

        {/* Direct Contacts Action Group (Email, Phone, WhatsApp) */}
        <div className="pt-2.5 border-t border-slate-900/90 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-3 h-3 text-amber-400" />
              <span>Direct Contacts</span>
            </span>
            {(item.whatsapp || item.phone) && (
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                <MessageSquare className="w-2.5 h-2.5 fill-current" />
                <span>WhatsApp Active</span>
              </span>
            )}
          </div>
          <ContactActionGroup
            name={item.name}
            email={item.email}
            phone={item.phone}
            whatsapp={item.whatsapp}
            website={item.website}
            country={item.location?.country}
            category={item.category}
            suggestedOutreach={item.suggestedOutreach}
            onOpenEmailComposer={() => onOpenRfq?.(item)}
            variant="compact"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2 flex-wrap">
        {/* Status selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500">Status:</span>
          <select
            value={item.status || 'New'}
            onChange={(e) => onUpdateStatus(item.id, e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-[11px] text-slate-300"
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="In Discussion">In Discussion</option>
            <option value="Retained">Retained</option>
          </select>
        </div>

        {/* Links & Contact */}
        <div className="flex items-center gap-1.5">
          {item.website && (
            <a
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1"
            >
              <Globe className="w-3 h-3 text-sky-400" />
              <span>Website</span>
            </a>
          )}

          {/* Add to CRM Database Button */}
          {onSaveToCrm && (
            <button
              type="button"
              onClick={() => onSaveToCrm(item)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                isInCrm
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                  : 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-600/40'
              }`}
              title={isInCrm ? 'View in CRM Database' : 'Save contact and details to permanent CRM Database'}
            >
              {isInCrm ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3 text-emerald-400" />}
              <span>{isInCrm ? 'In CRM' : 'Save to CRM'}</span>
            </button>
          )}

          {/* 5 Distinct Email Templates Button */}
          <button
            type="button"
            onClick={() => onOpenRfq?.(item)}
            className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title={isSupplier ? 'Draft 5 RFQ Sourcing Email Templates for this supplier' : 'Draft 5 Commercial Pitch & Outreach Templates for this client'}
          >
            <Mail className="w-3.5 h-3.5 text-sky-400" />
            <span>{isSupplier ? 'Draft 5 RFQs' : 'Draft 5 Pitches'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-sky-400/20 text-sky-200">5</span>
          </button>

          {/* Quick Contact Link */}
          <a
            href={
              item.website?.includes('linkedin')
                ? item.website
                : `https://www.google.com/search?q=${encodeURIComponent(item.name + ' contact phone email')}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-semibold flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Connect</span>
          </a>
        </div>
      </div>
    </div>
  );
};
