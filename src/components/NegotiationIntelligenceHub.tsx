import React, { useState, useEffect } from 'react';
import {
  CrmEntity,
  NegotiationRoundRecord,
  NegotiationRoundType,
  QuantityTier,
  LandedCostBreakdown,
  ResaleOpportunity,
  NegotiationConcession,
} from '../types';
import { negotiateApi, analyzeQuantityTiersApi } from '../services/api';
import {
  DollarSign,
  TrendingUp,
  Award,
  Layers,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Send,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Building2,
  Package,
  Calendar,
  Sliders,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Mail,
  Zap,
  ArrowRight,
  Info,
} from 'lucide-react';
import { soundManager } from '../utils/audioCues';

interface NegotiationIntelligenceHubProps {
  selectedSupplier?: CrmEntity | null;
  allSuppliers: CrmEntity[];
  allCustomers: CrmEntity[];
  onSaveNegotiationRound: (supplierId: string, roundRecord: NegotiationRoundRecord, updatedCurrentPrice?: number) => void;
  onAddConcession: (supplierId: string, concession: NegotiationConcession) => void;
  onOpenRfq: (entity: CrmEntity) => void;
}

export const NegotiationIntelligenceHub: React.FC<NegotiationIntelligenceHubProps> = ({
  selectedSupplier: initialSupplier,
  allSuppliers,
  allCustomers,
  onSaveNegotiationRound,
  onAddConcession,
  onOpenRfq,
}) => {
  // Current active supplier in negotiation
  const [activeSupplierId, setActiveSupplierId] = useState<string>(
    initialSupplier?.id || allSuppliers[0]?.id || ''
  );

  const activeSupplier = allSuppliers.find((s) => s.id === activeSupplierId) || initialSupplier || allSuppliers[0];

  // Negotiation strategy state
  const [roundNumber, setRoundNumber] = useState<number>(() => {
    return (activeSupplier?.negotiationRounds?.length || 0) + 1;
  });

  const [roundType, setRoundType] = useState<NegotiationRoundType>('ROUND_2_COMMERCIAL_PRESSURE');
  const [chosenStrategy, setChosenStrategy] = useState<string>('Price Floor Discovery');
  const [userControlLevel, setUserControlLevel] = useState<'assisted' | 'semi-automatic' | 'autonomous-with-limits'>('assisted');

  // Pricing inputs
  const [productName, setProductName] = useState(
    activeSupplier?.productsOrNeeds[0] || '1.8 m Mining Barrier Cones'
  );
  const [confirmedQuantity, setConfirmedQuantity] = useState<number>(100);
  const [initialPrice, setInitialPrice] = useState<number>(activeSupplier?.initialQuotePrice || 1250);
  const [currentPrice, setCurrentPrice] = useState<number>(activeSupplier?.currentQuotePrice || 1180);
  const [targetPrice, setTargetPrice] = useState<number>(activeSupplier?.targetPrice || 1050);
  const [currency, setCurrency] = useState<string>(activeSupplier?.currency || 'USD');
  const [paymentTerms, setPaymentTerms] = useState<string>(activeSupplier?.paymentTerms || 'Net 30');
  const [destination, setDestination] = useState<string>(activeSupplier?.location?.country || 'Zambia');
  const [senderSignature, setSenderSignature] = useState(() => {
    try {
      return localStorage.getItem('screensense_rfq_signature') || 'Kind regards,\nHanekom Innovations Limited.';
    } catch {
      return 'Kind regards,\nHanekom Innovations Limited.';
    }
  });

  // Staged Quantity Tiers state
  const [tier50, setTier50] = useState<number>(1250);
  const [tier100, setTier100] = useState<number>(1180);
  const [tier250, setTier250] = useState<number>(1120);
  const [tier500, setTier500] = useState<number>(1080);
  const [tier1000, setTier1000] = useState<number>(1020);
  const [quantityTiersAnalysis, setQuantityTiersAnalysis] = useState<any>(null);
  const [isAnalyzingTiers, setIsAnalyzingTiers] = useState(false);

  // Competing Quotes state
  const otherSupplierQuotes = allSuppliers
    .filter((s) => s.id !== activeSupplier?.id && s.currentQuotePrice)
    .map((s) => ({
      supplierName: s.name,
      unitPrice: s.currentQuotePrice || 0,
      terms: s.paymentTerms || 'Standard',
    }));

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{
    strategicRationale: string;
    recommendedCounterPrice: number;
    draftedOutreachMessage: string;
    whatsappSummary: string;
    concessionsToRequest: string[];
    nextBestAction: string;
    riskAssessment: {
      relationshipRisk: 'Low' | 'Medium' | 'High';
      probabilityOfPriceReduction: number;
      recommendedStopTrigger: string;
    };
    landedCostImpact?: any;
  } | null>(null);

  const [copiedType, setCopiedType] = useState<string | null>(null);

  // New Concession Log Input
  const [newConcessionType, setNewConcessionType] = useState<NegotiationConcession['type']>('Price Reduction');
  const [newConcessionDesc, setNewConcessionDesc] = useState('');
  const [newConcessionVal, setNewConcessionVal] = useState('');

  // Active sub-tab in workbench
  const [workbenchTab, setWorkbenchTab] = useState<'negotiator' | 'staged_tiers' | 'floor_discovery' | 'landed_cost' | 'bundling' | 'resale_loop'>('negotiator');

  // Bundling calculator state
  const [bundleLineItems, setBundleLineItems] = useState([
    { name: 'Mining Cones 1.8m', qty: 100, unitPrice: 1180 },
    { name: 'Reflective Warning Vests', qty: 150, unitPrice: 150 },
    { name: 'Heavy Duty Gloves', qty: 200, unitPrice: 85 },
  ]);
  const [bundleDiscountRequest, setBundleDiscountRequest] = useState<number>(8); // 8%

  // Update form when active supplier changes
  useEffect(() => {
    if (activeSupplier) {
      if (activeSupplier.productsOrNeeds[0]) setProductName(activeSupplier.productsOrNeeds[0]);
      if (activeSupplier.initialQuotePrice) setInitialPrice(activeSupplier.initialQuotePrice);
      if (activeSupplier.currentQuotePrice) setCurrentPrice(activeSupplier.currentQuotePrice);
      if (activeSupplier.targetPrice) setTargetPrice(activeSupplier.targetPrice);
      if (activeSupplier.currency) setCurrency(activeSupplier.currency);
      setRoundNumber((activeSupplier.negotiationRounds?.length || 0) + 1);
    }
  }, [activeSupplierId]);

  // Execute AI Negotiation Generation
  const handleGenerateNegotiation = async () => {
    if (!activeSupplier) return;
    setIsGenerating(true);
    soundManager.playScanStart();

    const tiers = [
      { quantity: 50, unitPrice: tier50 },
      { quantity: 100, unitPrice: tier100 },
      { quantity: 250, unitPrice: tier250 },
      { quantity: 500, unitPrice: tier500 },
      { quantity: 1000, unitPrice: tier1000 },
    ];

    try {
      const res = await negotiateApi({
        supplierName: activeSupplier.name,
        supplierLocation: activeSupplier.location.country,
        productName,
        roundNumber,
        roundType,
        chosenStrategy,
        confirmedOrderQuantity: confirmedQuantity,
        initialPrice,
        currentPrice,
        targetPrice,
        currency,
        stagedTiers: tiers,
        competingQuotes: otherSupplierQuotes,
        senderSignature,
        userControlLevel,
        paymentTerms,
        destination,
      });

      setAiResult(res);
      soundManager.playScanComplete();
    } catch (e: any) {
      console.warn('Negotiation generation error:', e);
      soundManager.playAlert();
    } finally {
      setIsGenerating(false);
    }
  };

  // Run Staged Quantity Tier Curve Analysis
  const handleAnalyzeQuantityTiers = async () => {
    setIsAnalyzingTiers(true);
    const tiers = [
      { quantity: 50, unitPrice: tier50 },
      { quantity: 100, unitPrice: tier100 },
      { quantity: 250, unitPrice: tier250 },
      { quantity: 500, unitPrice: tier500 },
      { quantity: 1000, unitPrice: tier1000 },
    ];

    try {
      const res = await analyzeQuantityTiersApi(tiers);
      setQuantityTiersAnalysis(res);
      soundManager.playTargetLocated();
    } catch (e) {
      console.warn('Tier analysis error:', e);
    } finally {
      setIsAnalyzingTiers(false);
    }
  };

  // Save Negotiation Round Record
  const handleRecordRound = () => {
    if (!activeSupplier || !aiResult) return;

    const roundRec: NegotiationRoundRecord = {
      id: `rnd-${Date.now()}`,
      roundNumber,
      roundType,
      strategyUsed: chosenStrategy,
      timestamp: Date.now(),
      initialPriceAtRound: currentPrice,
      negotiatedPriceAtRound: aiResult.recommendedCounterPrice || currentPrice,
      concessions: aiResult.concessionsToRequest || [],
      savingsAmount: Math.max(0, currentPrice - (aiResult.recommendedCounterPrice || currentPrice)) * confirmedQuantity,
      savingsCategory: 'Volume',
      outreachMessage: aiResult.draftedOutreachMessage,
      nextRecommendedAction: aiResult.nextBestAction,
      stopRuleTriggered: aiResult.riskAssessment?.relationshipRisk === 'High',
      stopRuleReason: aiResult.riskAssessment?.recommendedStopTrigger,
    };

    onSaveNegotiationRound(activeSupplier.id, roundRec, aiResult.recommendedCounterPrice);
    setRoundNumber((prev) => prev + 1);
    soundManager.playStepSuccess();
  };

  // Log a verified concession
  const handleLogConcession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSupplier || !newConcessionDesc.trim()) return;

    const concession: NegotiationConcession = {
      id: `conc-${Date.now()}`,
      type: newConcessionType,
      description: newConcessionDesc.trim(),
      estimatedValue: parseFloat(newConcessionVal) || 0,
      roundObtained: roundNumber,
      date: Date.now(),
    };

    onAddConcession(activeSupplier.id, concession);
    setNewConcessionDesc('');
    setNewConcessionVal('');
    soundManager.playStepSuccess();
  };

  // Copy helper
  const handleCopy = (text: string, type: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
      soundManager.playTargetLocated();
    } catch {}
  };

  // Dispatch via mailto
  const handleOpenMailto = () => {
    if (!aiResult) return;
    const to = activeSupplier?.contactPersons[0]?.email || '';
    const subject = encodeURIComponent(`Commercial Proposal & Quotation Review – ${productName}`);
    const body = encodeURIComponent(aiResult.draftedOutreachMessage);
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank');
  };

  // Landed Cost Calculations
  const calcLandedCost = (): LandedCostBreakdown => {
    const subtotal = currentPrice * confirmedQuantity;
    const freight = Math.round(subtotal * 0.07); // ~7% estimated freight
    const insurance = Math.round(subtotal * 0.015);
    const duties = Math.round(subtotal * 0.05);
    const cashDiscount = paymentTerms.toLowerCase().includes('cash') || paymentTerms.toLowerCase().includes('immediate')
      ? Math.round(subtotal * 0.03)
      : 0;
    const concessionsValue = (activeSupplier?.concessionsObtained || []).reduce(
      (acc, c) => acc + (c.estimatedValue || 0),
      0
    );

    const netLanded = subtotal + freight + insurance + duties - cashDiscount - concessionsValue;
    return {
      unitPrice: currentPrice,
      quantity: confirmedQuantity,
      productSubtotal: subtotal,
      freightCost: freight,
      insuranceCost: insurance,
      customsDuty: duties,
      paymentTermCashDiscount: cashDiscount,
      valueConcessionsDeduction: concessionsValue,
      netLandedCost: Math.max(0, netLanded),
      effectiveCostPerUnit: Math.round((netLanded / confirmedQuantity) * 100) / 100,
    };
  };

  const landedCost = calcLandedCost();

  // Bundling calculation
  const totalSeparateBundle = bundleLineItems.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
  const bundledSavings = Math.round(totalSeparateBundle * (bundleDiscountRequest / 100));
  const totalBundledPrice = totalSeparateBundle - bundledSavings;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Banner */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 text-amber-400 border border-amber-400/30">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                AI Commercial Negotiation &amp; Price Floor Intelligence Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Ethical B2B Procurement Specialist
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Discovers price floors, staged quantity curves, non-price concessions, and landed-cost optimization
            </p>
          </div>
        </div>

        {/* Supplier Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Supplier:</span>
          <select
            value={activeSupplierId}
            onChange={(e) => setActiveSupplierId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-400"
          >
            {allSuppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.location.country}) - {s.currency || 'USD'} {s.currentQuotePrice || 'No Quote'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setWorkbenchTab('negotiator')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            workbenchTab === 'negotiator'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Multi-Round Negotiator</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setWorkbenchTab('staged_tiers');
            if (!quantityTiersAnalysis) handleAnalyzeQuantityTiers();
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            workbenchTab === 'staged_tiers'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Staged Quantity Curves</span>
        </button>

        <button
          type="button"
          onClick={() => setWorkbenchTab('floor_discovery')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            workbenchTab === 'floor_discovery'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Price Floor Ledger ({activeSupplier?.concessionsObtained?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setWorkbenchTab('landed_cost')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            workbenchTab === 'landed_cost'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Landed Cost &amp; Value Engine</span>
        </button>

        <button
          type="button"
          onClick={() => setWorkbenchTab('bundling')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            workbenchTab === 'bundling'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Bundling Strategy</span>
        </button>
      </div>

      {/* TAB 1: Multi-Round Negotiator */}
      {workbenchTab === 'negotiator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Commercial Levers & Settings (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Round &amp; Strategy Selection</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300">
                  Round {roundNumber} of 6
                </span>
              </div>

              {/* Round Type Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Negotiation Stage / Round
                </label>
                <select
                  value={roundType}
                  onChange={(e: any) => {
                    setRoundType(e.target.value);
                    if (e.target.value === 'ROUND_1_INFORMATION') setChosenStrategy('Information Gathering & Tier Request');
                    if (e.target.value === 'ROUND_2_COMMERCIAL_PRESSURE') setChosenStrategy('Price Floor Discovery');
                    if (e.target.value === 'ROUND_3_VOLUME_LEVERAGE') setChosenStrategy('Volume Leverage');
                    if (e.target.value === 'ROUND_4_COMPETITIVE_POSITIONING') setChosenStrategy('Competitive Positioning');
                    if (e.target.value === 'ROUND_5_VALUE_NEGOTIATION') setChosenStrategy('Non-Price Value Concessions');
                    if (e.target.value === 'ROUND_6_FINAL_OFFER') setChosenStrategy('Best & Final Commercial Offer');
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="ROUND_1_INFORMATION">Round 1: Information &amp; Tier Pricing</option>
                  <option value="ROUND_2_COMMERCIAL_PRESSURE">Round 2: Commercial Pressure &amp; Floor Discovery</option>
                  <option value="ROUND_3_VOLUME_LEVERAGE">Round 3: Volume Leverage (Confirmed Requirement)</option>
                  <option value="ROUND_4_COMPETITIVE_POSITIONING">Round 4: Competitive Positioning (Verified Competing Quotes)</option>
                  <option value="ROUND_5_VALUE_NEGOTIATION">Round 5: Non-Price Value Negotiation (Freight/Warranty/Terms)</option>
                  <option value="ROUND_6_FINAL_OFFER">Round 6: Best &amp; Final Commercial Offer (BAFO)</option>
                </select>
              </div>

              {/* Specific Commercial Strategy */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Tactical Strategy Lever
                </label>
                <select
                  value={chosenStrategy}
                  onChange={(e) => setChosenStrategy(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="Price Floor Discovery">Price Floor Discovery (Identify Room to Move)</option>
                  <option value="Staged Quantity Disclosure">Staged Quantity Disclosure (Curve Discovery)</option>
                  <option value="Volume Leverage">Volume Leverage (Full Confirmed Quantity)</option>
                  <option value="Competitive Positioning">Competitive Positioning (Competing Market Rates)</option>
                  <option value="Payment Terms Leverage">Payment Terms (Immediate Cash vs Net 30)</option>
                  <option value="Freight & Logistics Optimization">Freight &amp; Logistics (EXW vs DDP Savings)</option>
                  <option value="Value / Non-Price Concessions">Value Concessions (Free Spares, Warranty, Samples)</option>
                  <option value="Future Business Framework">Future Business Leverage (Framework Contract)</option>
                </select>
              </div>

              {/* Order Quantities and Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Confirmed Target Qty</label>
                  <input
                    type="number"
                    value={confirmedQuantity}
                    onChange={(e) => setConfirmedQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g. Net 30, Cash upfront"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Initial Price</label>
                  <input
                    type="number"
                    value={initialPrice}
                    onChange={(e) => setInitialPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-amber-300 block mb-1">Current Quote</label>
                  <input
                    type="number"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-amber-400/50 rounded-xl px-2.5 py-1.5 text-xs text-amber-200 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-emerald-400 block mb-1">Target Price</label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 font-bold"
                  />
                </div>
              </div>

              {/* Control Level Radio */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">User Control Level</label>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setUserControlLevel('assisted')}
                    className={`py-1 px-2 rounded-lg border text-center font-semibold transition ${
                      userControlLevel === 'assisted'
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Assisted (Approve all)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserControlLevel('semi-automatic')}
                    className={`py-1 px-2 rounded-lg border text-center font-semibold transition ${
                      userControlLevel === 'semi-automatic'
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Semi-Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserControlLevel('autonomous-with-limits')}
                    className={`py-1 px-2 rounded-lg border text-center font-semibold transition ${
                      userControlLevel === 'autonomous-with-limits'
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Bounded Limits
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerateNegotiation}
                disabled={isGenerating || !activeSupplier}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Analyzing Pricing Levers...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Generate Round {roundNumber} Counter &amp; Levers</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Concession Logger */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Log Commercial Concession Secured</span>
              </span>

              <form onSubmit={handleLogConcession} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newConcessionType}
                    onChange={(e: any) => setNewConcessionType(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="Price Reduction">Unit Price Cut</option>
                    <option value="Free Shipping">Free Shipping</option>
                    <option value="Reduced Freight">Reduced Freight</option>
                    <option value="Extended Warranty">Extended Warranty</option>
                    <option value="Free Samples">Free Samples</option>
                    <option value="Spare Units">Spare Units / Spares</option>
                    <option value="Payment Terms">Payment Terms Concession</option>
                    <option value="Free Branding">Free Custom Branding</option>
                  </select>

                  <input
                    type="number"
                    value={newConcessionVal}
                    onChange={(e) => setNewConcessionVal(e.target.value)}
                    placeholder="Est. Value ($)"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newConcessionDesc}
                    onChange={(e) => setNewConcessionDesc(e.target.value)}
                    placeholder="e.g. 5% cash discount or free delivery to Lusaka"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                  />
                  <button
                    type="submit"
                    disabled={!newConcessionDesc.trim()}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg disabled:opacity-50"
                  >
                    Log
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: AI Analysis, Drafted Pitch, and Actions (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {aiResult ? (
              <div className="space-y-4">
                {/* Strategic Rationale & Recommended Counter Price */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Commercial Intelligence Analysis</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Recommended Counter:</span>
                      <span className="text-sm font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                        {currency} {aiResult.recommendedCounterPrice}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                    {aiResult.strategicRationale}
                  </p>

                  {/* Requested Concessions Chips */}
                  {aiResult.concessionsToRequest?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                        Target Concessions for this Round:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {aiResult.concessionsToRequest.map((c, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3 text-sky-400" />
                            <span>{c}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Best Action & Stop Rule Warning */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] space-y-1">
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        <span>Recommended Next Action:</span>
                      </span>
                      <p className="text-slate-300">{aiResult.nextBestAction}</p>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] space-y-1">
                      <span className="font-bold text-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>Stop Rule Trigger:</span>
                      </span>
                      <p className="text-slate-400">{aiResult.riskAssessment?.recommendedStopTrigger || 'Conclude if quote is confirmed final.'}</p>
                    </div>
                  </div>
                </div>

                {/* Drafted Outreach Message Box */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      <span>Drafted Round {roundNumber} Outreach Message</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopy(aiResult.draftedOutreachMessage, 'email')}
                      className="px-2 py-0.5 text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 rounded-lg border border-slate-800"
                    >
                      {copiedType === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedType === 'email' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <textarea
                    value={aiResult.draftedOutreachMessage}
                    onChange={(e) => setAiResult({ ...aiResult, draftedOutreachMessage: e.target.value })}
                    rows={10}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-amber-400"
                  />

                  {/* Dispatch Controls */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenMailto}
                        className="py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Email</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const wa = encodeURIComponent(aiResult.whatsappSummary || aiResult.draftedOutreachMessage);
                          window.open(`https://wa.me/?text=${wa}`, '_blank');
                        }}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp Summary</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleRecordRound}
                      className="py-2 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
                    >
                      Log Round to CRM History
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Commercial Negotiation Workbench Ready</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Configure your desired strategy on the left (e.g. Staged Quantity Disclosure, Price Floor Discovery, or Competing Leverage) and click &quot;Generate Round Counter&quot; to review AI-crafted counter-offers and non-price concessions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Staged Quantity Curves */}
      {workbenchTab === 'staged_tiers' && (
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Staged Quantity Curve &amp; Discount Analysis</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300">
                  Price Floor Visibility
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Instead of immediately disclosing maximum order volume, query tiered quantities to discover the supplier&apos;s true pricing curve slope.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeQuantityTiers}
              disabled={isAnalyzingTiers}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
            >
              {isAnalyzingTiers ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
              <span>Recalculate Curve</span>
            </button>
          </div>

          {/* Tier Inputs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">50 Units (MOQ)</label>
              <input
                type="number"
                value={tier50}
                onChange={(e) => setTier50(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">100 Units</label>
              <input
                type="number"
                value={tier100}
                onChange={(e) => setTier100(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">250 Units</label>
              <input
                type="number"
                value={tier250}
                onChange={(e) => setTier250(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">500 Units</label>
              <input
                type="number"
                value={tier500}
                onChange={(e) => setTier500(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">1,000 Units</label>
              <input
                type="number"
                value={tier1000}
                onChange={(e) => setTier1000(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 font-bold"
              />
            </div>
          </div>

          {/* Curve Analysis Results */}
          {quantityTiersAnalysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[11px]">Pricing Curve Slope:</span>
                  <span className="text-sm font-bold text-amber-300">{quantityTiersAnalysis.pricingCurveSlope}</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[11px]">Max Volume Discount:</span>
                  <span className="text-sm font-bold text-emerald-400">{quantityTiersAnalysis.maxDiscountPercent}% from MOQ</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[11px]">Recommended Procurement Sweet Spot:</span>
                  <span className="text-sm font-bold text-sky-300">{quantityTiersAnalysis.recommendedSweetSpot} units</span>
                </div>
              </div>

              {/* Table of Marginal Tier Discounts */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Order Quantity</th>
                      <th className="p-3">Unit Price ({currency})</th>
                      <th className="p-3">Total Order Price</th>
                      <th className="p-3">Discount from MOQ</th>
                      <th className="p-3">Marginal Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {quantityTiersAnalysis.tiers.map((t: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="p-3 font-bold text-slate-200">{t.quantity} units</td>
                        <td className="p-3 text-amber-300 font-semibold">{currency} {t.unitPrice}</td>
                        <td className="p-3 text-slate-300">{currency} {t.totalPrice.toLocaleString()}</td>
                        <td className="p-3 text-emerald-400 font-semibold">
                          {t.discountFromMoqPercent > 0 ? `-${t.discountFromMoqPercent}%` : 'Base (MOQ)'}
                        </td>
                        <td className="p-3 text-sky-400">
                          {t.marginalSavingsPercent > 0 ? `+${t.marginalSavingsPercent}% saved` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Price Floor Discovery Ledger */}
      {workbenchTab === 'floor_discovery' && (
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Price Floor &amp; Concessions Ledger: {activeSupplier?.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                  {currency} {activeSupplier?.totalSavingsAchieved || 0} Total Savings
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Audit trail tracking every price change, volume concession, payment incentive, and warranty expansion
              </p>
            </div>
          </div>

          {/* Visual Round Flow Comparison */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 block">Initial Opening Quote:</span>
              <span className="text-base font-bold text-slate-300">{currency} {activeSupplier?.initialQuotePrice || initialPrice}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Current Negotiated Quote:</span>
              <span className="text-base font-bold text-amber-400">{currency} {activeSupplier?.currentQuotePrice || currentPrice}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Total Unit Price Cut:</span>
              <span className="text-base font-bold text-emerald-400">
                -{currency} {Math.max(0, (activeSupplier?.initialQuotePrice || initialPrice) - (activeSupplier?.currentQuotePrice || currentPrice))}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Effective Savings Rate:</span>
              <span className="text-base font-bold text-emerald-400">
                {activeSupplier?.initialQuotePrice
                  ? `${Math.round((((activeSupplier.initialQuotePrice - (activeSupplier.currentQuotePrice || initialPrice)) / activeSupplier.initialQuotePrice) * 100) * 10) / 10}%`
                  : '0%'}
              </span>
            </div>
          </div>

          {/* Concessions Table */}
          {(!activeSupplier?.concessionsObtained || activeSupplier.concessionsObtained.length === 0) ? (
            <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-500">
              No concessions logged yet for this supplier. Use the logger in the Multi-Round Negotiator tab to record secured agreements.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Concession Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Estimated Commercial Value</th>
                    <th className="p-3">Round Secured</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {activeSupplier.concessionsObtained.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/50">
                      <td className="p-3 font-bold text-amber-300">{c.type}</td>
                      <td className="p-3 text-slate-200">{c.description}</td>
                      <td className="p-3 text-emerald-400 font-semibold">{currency} {c.estimatedValue.toLocaleString()}</td>
                      <td className="p-3 text-slate-400">Round {c.roundObtained}</td>
                      <td className="p-3 text-slate-500">{new Date(c.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Landed Cost & Value Engine */}
      {workbenchTab === 'landed_cost' && (
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Comprehensive Landed Cost &amp; Non-Price Value Engine</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300">
                Never Negotiate Only on Price
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Evaluates shipping, insurance, customs, cash discounts, and non-price value adds to calculate the true cost per unit delivered to {destination}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cost Breakdown Ledger */}
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
              <span className="font-bold text-slate-200 block border-b border-slate-800 pb-2">
                Cost Components ({confirmedQuantity} Units)
              </span>

              <div className="flex justify-between text-slate-300">
                <span>Product Base Subtotal:</span>
                <span>{currency} {landedCost.productSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Estimated Freight &amp; Logistics:</span>
                <span>+{currency} {landedCost.freightCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Marine / Cargo Insurance:</span>
                <span>+{currency} {landedCost.insuranceCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Customs &amp; Clearance Duties:</span>
                <span>+{currency} {landedCost.customsDuty.toLocaleString()}</span>
              </div>
              {landedCost.paymentTermCashDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Cash-Payment Incentive Discount:</span>
                  <span>-{currency} {landedCost.paymentTermCashDiscount.toLocaleString()}</span>
                </div>
              )}
              {landedCost.valueConcessionsDeduction > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Secured Non-Price Concessions Value:</span>
                  <span>-{currency} {landedCost.valueConcessionsDeduction.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
                <span>Total Landed Procurement Cost:</span>
                <span className="text-amber-400">{currency} {landedCost.netLandedCost.toLocaleString()}</span>
              </div>
            </div>

            {/* Effective Metric Box */}
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">Effective Delivered Unit Price:</span>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-2xl font-black text-emerald-400">
                    {currency} {landedCost.effectiveCostPerUnit}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">per unit fully landed</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1.5 bg-slate-950/60 p-3 rounded-xl">
                <span className="font-bold text-amber-300 block">Negotiator Rule:</span>
                <p>
                  A supplier offering $10.00 with free DDP shipping is commercially superior to a supplier offering $9.20 with $1.50/unit EXW freight charges. Always optimize the total landed equation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Bundling Strategy */}
      {workbenchTab === 'bundling' && (
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Multi-Product Consolidation &amp; Bundle Leverage</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                  Volume Synergy
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Instead of procuring items separately, consolidate multi-line orders with a single vendor to demand a portfolio discount.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Product Line</th>
                  <th className="p-3">Requirement Quantity</th>
                  <th className="p-3">Single-Line Quote ({currency})</th>
                  <th className="p-3">Standalone Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {bundleLineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-semibold text-slate-200">{item.name}</td>
                    <td className="p-3">{item.qty}</td>
                    <td className="p-3 text-amber-300">{currency} {item.unitPrice}</td>
                    <td className="p-3 text-slate-300">{currency} {(item.qty * item.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bundle Summary Bar */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Separate Purchases Total:</span>
              <span className="text-sm font-bold text-slate-300">{currency} {totalSeparateBundle.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Consolidated Discount:</span>
              <input
                type="number"
                value={bundleDiscountRequest}
                onChange={(e) => setBundleDiscountRequest(parseFloat(e.target.value) || 0)}
                className="w-16 bg-slate-950 border border-slate-700 rounded-lg p-1 text-center font-bold text-emerald-400"
              />
              <span className="font-bold text-slate-300">%</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Bundle Procurement Savings:</span>
              <span className="text-sm font-extrabold text-emerald-400">-{currency} {bundledSavings.toLocaleString()}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Negotiated Bundle Price:</span>
              <span className="text-base font-extrabold text-amber-400">{currency} {totalBundledPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
