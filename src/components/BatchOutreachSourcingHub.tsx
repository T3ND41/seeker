import React, { useState, useMemo, useEffect } from 'react';
import {
  Mail,
  Users,
  Package,
  Truck,
  Send,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Download,
  Layers,
  Scale,
  DollarSign,
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  Filter,
  ArrowRight,
  Clock,
  ShieldCheck,
  Eye,
  FileText,
  RefreshCw,
  X,
  Share2,
  AlertCircle,
} from 'lucide-react';
import { LeadItem, CrmEntity } from '../types';
import { RouteLogisticsConfig } from './OriginDestinationMap';
import { soundManager } from '../utils/audioCues';
import { buildWhatsAppLink, sanitizeWhatsAppNumber } from '../utils/contactUtils';

export interface BatchOutreachSourcingHubProps {
  clients: LeadItem[];
  suppliers: LeadItem[];
  routeConfig: RouteLogisticsConfig;
  searchedItemName?: string;
  searchedIndustry?: string;
  onClose?: () => void;
  onSaveLeadToCrm?: (item: LeadItem) => void;
  senderSignature?: string;
}

export interface ClientEmailDraft {
  clientId: string;
  clientName: string;
  companyName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientWhatsapp: string;
  destinationCity: string;
  destinationCountry: string;
  subject: string;
  body: string;
  whatsappMessage: string;
  status: 'Draft' | 'Ready' | 'Dispatched';
  templateAngle: string;
}

export interface SupplierRfqDraft {
  supplierId: string;
  supplierName: string;
  companyName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientWhatsapp: string;
  originCity: string;
  originCountry: string;
  quotedUnitPrice?: number;
  moq?: string;
  leadTimeDays?: number;
  freightCostEst?: number;
  landedCostEst?: number;
  subject: string;
  body: string;
  status: 'Pending Quote' | 'Quote Received' | 'Awarded' | 'Declined';
}

export const BatchOutreachSourcingHub: React.FC<BatchOutreachSourcingHubProps> = ({
  clients,
  suppliers,
  routeConfig,
  searchedItemName = '1.8m Mining Barrier Cones',
  searchedIndustry = 'Mining & Industrial Safety',
  onClose,
  onSaveLeadToCrm,
  senderSignature = 'Kind regards,\nHanekom Innovations Limited.',
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'clients_email' | 'suppliers_rfq' | 'demand_aggregation'>('clients_email');

  // Selected clients and suppliers IDs
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(() =>
    clients.slice(0, 8).map((c) => c.id)
  );

  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>(() =>
    suppliers.slice(0, 6).map((s) => s.id)
  );

  // Campaign specs configuration
  const [campaignProduct, setCampaignProduct] = useState(searchedItemName);
  const [campaignSpecs, setCampaignSpecs] = useState(
    'Heavy-duty UV-stabilized construction, 1.8m height, high-reflectivity class 1 prismatic bands, heavy ballast base for mine haul roads and open-cast demarcation.'
  );
  const [targetBatchQuantity, setTargetBatchQuantity] = useState('50');
  const [proposedUnitPrice, setProposedUnitPrice] = useState('78');
  const [chosenTemplateStyle, setChosenTemplateStyle] = useState<
    'formal' | 'volume_discount' | 'landed_delivery' | 'compliance_safety' | 'urgent_stock'
  >('formal');

  // Active client email draft inspection
  const [inspectedClientIndex, setInspectedClientIndex] = useState(0);
  const [customDraftOverrides, setCustomDraftOverrides] = useState<
    Record<string, { subject?: string; body?: string; status?: 'Draft' | 'Ready' | 'Dispatched' }>
  >({});

  // Supplier RFQ Quotes tracker
  const [supplierQuoteOverrides, setSupplierQuoteOverrides] = useState<
    Record<string, { quotedPrice?: number; moq?: string; leadTime?: number; status?: SupplierRfqDraft['status'] }>
  >({
    [suppliers[0]?.id || 'sup-1']: { quotedPrice: 78, moq: '8 units', leadTime: 7, status: 'Quote Received' },
    [suppliers[1]?.id || 'sup-2']: { quotedPrice: 82, moq: '15 units', leadTime: 5, status: 'Quote Received' },
    [suppliers[2]?.id || 'sup-3']: { quotedPrice: 72, moq: '50 units', leadTime: 12, status: 'Quote Received' },
  });

  // Notification / Feedback toast
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    soundManager.playStepSuccess();
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  // 1. Generate Custom Emails for all selected clients
  const clientEmailDrafts: ClientEmailDraft[] = useMemo(() => {
    const selectedClientsList = clients.filter((c) => selectedClientIds.includes(c.id));

    return selectedClientsList.map((client) => {
      const email =
        client.email ||
        (client.website
          ? `procurement@${client.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}`
          : 'procurement@client-mining.com');
      const phone = client.phone || client.contactChannels?.find((c) => /[\d+]/.test(c)) || '+260 212 650000';
      const whatsapp = client.whatsapp || phone;
      const destCity = client.location?.area || routeConfig.destCity || 'Kitwe';
      const destCountry = client.location?.country || routeConfig.destCountry || 'Zambia';
      const destAddress = client.address || routeConfig.destAddress || `Industrial Area, ${destCity}`;
      const contactPerson = client.customerDetails?.decisionMakerRole || 'Procurement & Safety Equipment Lead';

      let defaultSubject = '';
      let defaultBody = '';
      let defaultAngle = '';

      switch (chosenTemplateStyle) {
        case 'formal':
          defaultAngle = 'Formal Commercial Supply Pitch';
          defaultSubject = `Commercial Supply Proposal: ${campaignProduct} [Scheduled Delivery to ${destCity}]`;
          defaultBody = `Dear ${contactPerson} / ${client.name} Procurement Team,\n\nWe are pleased to introduce our direct landed commercial supply of ${campaignProduct} engineered specifically for open-cast mining operations and industrial haul road demarcation in ${destCity}, ${destCountry}.\n\nSupply Logistics & Specifications:\n- Sourcing Origin: ${routeConfig.originCity}, ${routeConfig.originCountry} (${routeConfig.originAddress || 'Main Depot'})\n- Destination Site: ${destCity}, ${destCountry} (${destAddress})\n- Initial Batch Allocation: ${targetBatchQuantity} units\n- Standard Unit Offer: $${proposedUnitPrice} USD (DDP ${destCity})\n- Engineering Specs: ${campaignSpecs}\n\nOur Commercial Advantages:\n- SADC Certificate of Origin verified for zero customs duty tariffs\n- Direct cross-border road freight delivery to your facility gate\n- Full batch warranty with guaranteed UV degradation resistance\n\nPlease let us know if we may submit our comprehensive technical data sheet and arrange a delivery schedule.\n\n${senderSignature}`;
          break;

        case 'volume_discount':
          defaultAngle = 'Volume Wholesale Discount Pitch';
          defaultSubject = `Wholesale Volume Pricing Schedule: ${campaignProduct} for ${client.name}`;
          defaultBody = `Good day ${client.name} Commercial Team,\n\nIn review of ongoing safety procurement across the ${destCity} mining sector, we have structured an aggressive volume price-break schedule for ${campaignProduct}.\n\nConsolidated Batch Terms:\n- Order Quantity: ${targetBatchQuantity}+ units\n- Negotiated Landed Price: $${proposedUnitPrice} USD delivered to ${destCity}\n- Delivery Corridor: Direct transit from ${routeConfig.originCity} to ${destAddress}\n- Lead Time: 5 to 8 business days upon order confirmation\n\nBy pooling container haulage on this primary freight corridor, we reduce landed unit cost by over 12% compared to local ad-hoc replenishment.\n\nCould we provide a formal commercial quotation for your current quarter safety budget?\n\n${senderSignature}`;
          break;

        case 'landed_delivery':
          defaultAngle = 'Direct Landed Delivery Corridor';
          defaultSubject = `Direct Haulage Delivery Notice: ${campaignProduct} ➔ ${destCity}, ${destCountry}`;
          defaultBody = `Attention: ${contactPerson} (${client.name}),\n\nWe operate scheduled heavy commercial transport corridors between ${routeConfig.originCity}, ${routeConfig.originCountry} and ${destCity}, ${destCountry}. Our next scheduled haulage run includes dedicated space for ${campaignProduct}.\n\nLogistics Profile:\n- Destination Depot: ${destAddress}\n- Cargo: ${targetBatchQuantity} units of ${campaignProduct}\n- Delivery IncoTerms: DDP (All cross-border clearance, bridge tolls, and freight handled)\n- Unit Price: $${proposedUnitPrice} USD landed at site\n\nBooking space on this run ensures expedited delivery without separate logistical overhead.\n\nKindly confirm if we should reserve this batch for your mine perimeter.\n\n${senderSignature}`;
          break;

        case 'compliance_safety':
          defaultAngle = 'SADC Safety & Mine Compliance';
          defaultSubject = `Mine Safety Regulatory Compliance: ${campaignProduct} [SADC Certified]`;
          defaultBody = `Dear ${contactPerson},\n\nEnsuring complete compliance with regional open-cast mine safety standards is paramount for exclusion zone and haul road operations at ${client.name}.\n\nWe supply SADC-certified ${campaignProduct} engineered to withstand severe African solar radiation and high-impact conditions:\n- UV-Stabilized Polyethylene (zero cracking / colour fade)\n- 360-degree high-intensity retro-reflective delineators\n- Heavy stability base resisting extreme wind and haul-truck turbulence\n- Landed supply directly to ${destCity}, ${destCountry}\n\nWe would be honored to provide sample units and full compliance certification for your safety committee review.\n\n${senderSignature}`;
          break;

        case 'urgent_stock':
        default:
          defaultAngle = 'Immediate Stock Availability';
          defaultSubject = `Immediate Stock Availability: ${campaignProduct} [Ready for Dispatch to ${destCity}]`;
          defaultBody = `Hello ${client.name} Procurement,\n\nWe have a confirmed inventory of ${campaignProduct} currently staged and ready for prompt dispatch to ${destCity}, ${destCountry}.\n\n- Available Quantity: ${targetBatchQuantity} units\n- Delivery Location: ${destAddress}\n- Preferred Commercial Pricing: $${proposedUnitPrice} USD\n- Estimated Transit: 3 to 5 business days via primary commercial corridor\n\nIf you have active safety demarcations or exclusion zone expansions, we can lock in this batch immediately.\n\n${senderSignature}`;
          break;
      }

      // Check user overrides
      const override = customDraftOverrides[client.id] || {};
      const finalSubject = override.subject !== undefined ? override.subject : defaultSubject;
      const finalBody = override.body !== undefined ? override.body : defaultBody;
      const finalStatus = override.status || 'Ready';

      const whatsappSummary = `Good day ${contactPerson} (${client.name}), we have scheduled landed supply of ${campaignProduct} (${targetBatchQuantity} units at $${proposedUnitPrice}) arriving in ${destCity}, ${destCountry}. Can we share the commercial proposal? ${senderSignature.split('\n')[0]}`;

      return {
        clientId: client.id,
        clientName: client.name,
        companyName: client.name,
        recipientEmail: email,
        recipientPhone: phone,
        recipientWhatsapp: whatsapp,
        destinationCity: destCity,
        destinationCountry: destCountry,
        subject: finalSubject,
        body: finalBody,
        whatsappMessage: whatsappSummary,
        status: finalStatus,
        templateAngle: defaultAngle,
      };
    });
  }, [
    clients,
    selectedClientIds,
    chosenTemplateStyle,
    campaignProduct,
    campaignSpecs,
    targetBatchQuantity,
    proposedUnitPrice,
    routeConfig,
    customDraftOverrides,
    senderSignature,
  ]);

  // Active inspected client draft
  const activeInspectedDraft: ClientEmailDraft | undefined =
    clientEmailDrafts[inspectedClientIndex] || clientEmailDrafts[0];

  // 2. Multi-Supplier RFQ Drafts
  const supplierRfqDrafts: SupplierRfqDraft[] = useMemo(() => {
    const selectedSuppliersList = suppliers.filter((s) => selectedSupplierIds.includes(s.id));

    return selectedSuppliersList.map((sup) => {
      const email =
        sup.email ||
        (sup.website
          ? `sales@${sup.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}`
          : 'sales@supplier-factory.co.za');
      const phone = sup.phone || sup.contactChannels?.find((c) => /[\d+]/.test(c)) || '+27 11 830 4400';
      const whatsapp = sup.whatsapp || phone;
      const originCity = sup.location?.area || routeConfig.originCity || 'Johannesburg';
      const originCountry = sup.location?.country || routeConfig.originCountry || 'South Africa';

      const override = supplierQuoteOverrides[sup.id] || {};
      const unitPrice = override.quotedPrice || sup.currentQuotePrice || sup.initialQuotePrice || 75;
      const moq = override.moq || sup.supplierDetails?.moq || '8 units';
      const leadTime = override.leadTime || sup.leadTimeDays || 7;
      const freightCostEst = Math.round(unitPrice * 0.12 * 10) / 10;
      const landedCostEst = Math.round((unitPrice + freightCostEst) * 10) / 10;
      const status = override.status || 'Pending Quote';

      const subject = `RFQ Inquiry: ${campaignProduct} – Batch Order of ${targetBatchQuantity} Units [Export to ${routeConfig.destCity}, ${routeConfig.destCountry}]`;
      const body = `Good day Sales & Commercial Team (${sup.name}),\n\nWe request a formal quotation and pro-forma invoice for the supply of ${campaignProduct} to fulfill active mining contracts in ${routeConfig.destCity}, ${routeConfig.destCountry}.\n\nRequired Specifications:\n- Product: ${campaignProduct}\n- Specification: ${campaignSpecs}\n- Order Batch Quantity: ${targetBatchQuantity} units\n- Target Delivery Destination: ${routeConfig.destCity}, ${routeConfig.destCountry} (${routeConfig.destAddress || 'Receiving Yard'})\n- Sourcing Origin: ${originCity}, ${originCountry}\n\nPlease confirm:\n1. Best export unit price (FOB or DDP Lusaka/Kitwe)\n2. Lead time to dispatch from factory\n3. SADC Trade Certificate of Origin availability\n4. Commercial payment terms for verified purchase order\n\n${senderSignature}`;

      return {
        supplierId: sup.id,
        supplierName: sup.name,
        companyName: sup.name,
        recipientEmail: email,
        recipientPhone: phone,
        recipientWhatsapp: whatsapp,
        originCity,
        originCountry,
        quotedUnitPrice: unitPrice,
        moq,
        leadTimeDays: leadTime,
        freightCostEst,
        landedCostEst,
        subject,
        body,
        status,
      };
    });
  }, [
    suppliers,
    selectedSupplierIds,
    supplierQuoteOverrides,
    campaignProduct,
    campaignSpecs,
    targetBatchQuantity,
    routeConfig,
    senderSignature,
  ]);

  // Selection toggles
  const handleToggleClient = (id: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllClients = () => {
    if (selectedClientIds.length === clients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(clients.map((c) => c.id));
    }
  };

  const handleToggleSupplier = (id: string) => {
    setSelectedSupplierIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllSuppliers = () => {
    if (selectedSupplierIds.length === suppliers.length) {
      setSelectedSupplierIds([]);
    } else {
      setSelectedSupplierIds(suppliers.map((s) => s.id));
    }
  };

  // Dispatch Actions for Clients
  const handleUpdateInspectedDraft = (field: 'subject' | 'body', value: string) => {
    if (!activeInspectedDraft) return;
    setCustomDraftOverrides((prev) => ({
      ...prev,
      [activeInspectedDraft.clientId]: {
        ...prev[activeInspectedDraft.clientId],
        [field]: value,
      },
    }));
  };

  // 1-Click Dispatch via mailto: for individual client
  const handleOpenMailtoForDraft = (draft: ClientEmailDraft) => {
    const to = draft.recipientEmail;
    const subj = encodeURIComponent(draft.subject);
    const body = encodeURIComponent(draft.body);
    window.open(`mailto:${to}?subject=${subj}&body=${body}`, '_blank');
    setCustomDraftOverrides((prev) => ({
      ...prev,
      [draft.clientId]: {
        ...prev[draft.clientId],
        status: 'Dispatched',
      },
    }));
    triggerToast(`Opened email draft for ${draft.clientName}`);
  };

  // 1-Click Open in Gmail Web
  const handleOpenGmailForDraft = (draft: ClientEmailDraft) => {
    const to = draft.recipientEmail;
    const subj = encodeURIComponent(draft.subject);
    const body = encodeURIComponent(draft.body);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subj}&body=${body}`, '_blank');
    setCustomDraftOverrides((prev) => ({
      ...prev,
      [draft.clientId]: {
        ...prev[draft.clientId],
        status: 'Dispatched',
      },
    }));
    triggerToast(`Opened in Gmail Web for ${draft.clientName}`);
  };

  // 1-Click Launch WhatsApp
  const handleOpenWhatsAppForDraft = (draft: ClientEmailDraft) => {
    const cleanNum = sanitizeWhatsAppNumber(draft.recipientWhatsapp, draft.destinationCountry);
    const link = buildWhatsAppLink(cleanNum, draft.whatsappMessage, draft.destinationCountry);
    window.open(link, '_blank');
    setCustomDraftOverrides((prev) => ({
      ...prev,
      [draft.clientId]: {
        ...prev[draft.clientId],
        status: 'Dispatched',
      },
    }));
    triggerToast(`Opened WhatsApp chat for ${draft.clientName}`);
  };

  // Download single or all .eml files
  const handleDownloadEmlForDraft = (draft: ClientEmailDraft) => {
    const eml = `To: ${draft.recipientEmail}\nSubject: ${draft.subject}\nX-Unsent: 1\nContent-Type: text/plain; charset=utf-8\n\n${draft.body}`;
    const blob = new Blob([eml], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pitch_${draft.clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast(`Downloaded .eml file for ${draft.clientName}`);
  };

  // 1-Click Multi-Client Batch Dispatch
  const handleBatchDispatchMailto = () => {
    if (clientEmailDrafts.length === 0) return;
    // Combine emails as BCC or trigger queue
    const bccList = clientEmailDrafts.map((d) => d.recipientEmail).join(',');
    const primarySubject = encodeURIComponent(clientEmailDrafts[0]?.subject || `Commercial Supply Offer: ${campaignProduct}`);
    const sampleBody = encodeURIComponent(clientEmailDrafts[0]?.body || '');

    window.open(`mailto:?bcc=${encodeURIComponent(bccList)}&subject=${primarySubject}&body=${sampleBody}`, '_blank');

    // Mark all as dispatched
    const newOverrides = { ...customDraftOverrides };
    clientEmailDrafts.forEach((d) => {
      newOverrides[d.clientId] = {
        ...(newOverrides[d.clientId] || {}),
        status: 'Dispatched',
      };
    });
    setCustomDraftOverrides(newOverrides);
    triggerToast(`Dispatched multi-recipient email queue to ${clientEmailDrafts.length} clients!`);
  };

  // Download all .eml files in sequence
  const handleDownloadAllEmls = () => {
    clientEmailDrafts.forEach((draft, idx) => {
      setTimeout(() => {
        handleDownloadEmlForDraft(draft);
      }, idx * 250);
    });
    triggerToast(`Generating and downloading ${clientEmailDrafts.length} customized .eml files...`);
  };

  // Copy all drafts as formatted text
  const handleCopyAllClientDrafts = () => {
    const allText = clientEmailDrafts
      .map(
        (d, i) =>
          `--- [CLIENT EMAIL ${i + 1}/${clientEmailDrafts.length}: ${d.clientName} (${d.destinationCity}, ${d.destinationCountry})] ---\nTO: ${d.recipientEmail}\nPHONE/WA: ${d.recipientWhatsapp}\nSUBJECT: ${d.subject}\n\n${d.body}\n`
      )
      .join('\n\n');

    try {
      navigator.clipboard.writeText(allText);
      triggerToast(`Copied all ${clientEmailDrafts.length} personalized client outreach drafts!`);
    } catch {}
  };

  // Multi-Client Demand Aggregation calculation
  const aggregationData = useMemo(() => {
    const qtyPerClient = parseInt(targetBatchQuantity) || 50;
    const totalClientsCount = selectedClientIds.length;
    const pooledDemandQuantity = totalClientsCount * qtyPerClient;

    // Best supplier price from quote overrides or defaults
    const supplierPrices = supplierRfqDrafts.map((s) => s.quotedUnitPrice || 75);
    const bestSupplierPrice = supplierPrices.length > 0 ? Math.min(...supplierPrices) : 75;

    // Landed cost calculation (adding estimated 12% freight/toll clearance)
    const landedPerUnit = Math.round(bestSupplierPrice * 1.12 * 100) / 100;
    const sellingPerUnit = parseFloat(proposedUnitPrice) || 78;

    const totalRevenue = Math.round(sellingPerUnit * pooledDemandQuantity);
    const totalProcurementCost = Math.round(landedPerUnit * pooledDemandQuantity);
    const netGrossProfit = Math.max(0, totalRevenue - totalProcurementCost);
    const marginPct = totalRevenue > 0 ? Math.round((netGrossProfit / totalRevenue) * 1000) / 10 : 0;

    return {
      pooledDemandQuantity,
      totalClientsCount,
      bestSupplierPrice,
      landedPerUnit,
      sellingPerUnit,
      totalRevenue,
      totalProcurementCost,
      netGrossProfit,
      marginPct,
    };
  }, [selectedClientIds, targetBatchQuantity, proposedUnitPrice, supplierRfqDrafts]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-xl border border-emerald-400 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black shadow-md flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-100">
                Multi-Client Custom Outreach &amp; Multi-Supplier Sourcing Hub
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Simultaneous Sourcing &amp; Sales
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {selectedClientIds.length} Clients • {selectedSupplierIds.length} Suppliers
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Personalize and dispatch custom commercial proposals to multiple clients at once while issuing consolidated RFQs to multiple suppliers.
            </p>
          </div>
        </div>

        {/* Global Action buttons */}
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close Hub"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-4 py-2 bg-slate-925 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveMainTab('clients_email')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'clients_email'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-850'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>1. Multi-Client Custom Emails ({clientEmailDrafts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('suppliers_rfq')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'suppliers_rfq'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-850'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>2. Multi-Supplier Sourcing Matrix ({supplierRfqDrafts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('demand_aggregation')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'demand_aggregation'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-850'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>3. Pooled Demand &amp; Arbitrage Margin</span>
          </button>
        </div>

        {/* Corridor Context Pill */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
          <Truck className="w-3.5 h-3.5 text-amber-400" />
          <span>Corridor: <strong>{routeConfig.originCity} ➔ {routeConfig.destCity}</strong></span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: MULTI-CLIENT CUSTOM EMAIL DISPATCH */}
        {activeMainTab === 'clients_email' && (
          <div className="space-y-4">
            {/* Campaign Parameters Strip */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Searched Item / Product</label>
                <input
                  type="text"
                  value={campaignProduct}
                  onChange={(e) => setCampaignProduct(e.target.value)}
                  placeholder="e.g. 1.8m Mining Barrier Cones"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-200 focus:outline-none focus:border-amber-400 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Target Batch Qty per Client</label>
                <input
                  type="number"
                  value={targetBatchQuantity}
                  onChange={(e) => setTargetBatchQuantity(e.target.value)}
                  placeholder="50"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Proposed Selling Price ($ USD)</label>
                <input
                  type="number"
                  value={proposedUnitPrice}
                  onChange={(e) => setProposedUnitPrice(e.target.value)}
                  placeholder="78"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 focus:outline-none focus:border-emerald-400 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Pitch Angle / Template</label>
                <select
                  value={chosenTemplateStyle}
                  onChange={(e) => setChosenTemplateStyle(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-semibold cursor-pointer"
                >
                  <option value="formal">1. Formal Commercial Supply Pitch</option>
                  <option value="volume_discount">2. Wholesale Volume Pricing Rebate</option>
                  <option value="landed_delivery">3. Direct Landed Delivery Corridor</option>
                  <option value="compliance_safety">4. SADC Safety &amp; Mine Compliance</option>
                  <option value="urgent_stock">5. Immediate Stock Availability</option>
                </select>
              </div>
            </div>

            {/* Split Screen: Left Recipient Checklist & Right Live Custom Email Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Select Clients (5 cols) */}
              <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      Target Clients ({clients.length})
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300">
                      {selectedClientIds.length} Selected
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSelectAllClients}
                    className="text-[11px] font-semibold text-amber-400 hover:underline cursor-pointer"
                  >
                    {selectedClientIds.length === clients.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {/* Client items scroll list */}
                <div className="space-y-2 flex-1 max-h-[460px] overflow-y-auto pr-1">
                  {clients.map((client, idx) => {
                    const isSelected = selectedClientIds.includes(client.id);
                    const isInspected = activeInspectedDraft?.clientId === client.id;
                    const override = customDraftOverrides[client.id];
                    const isDispatched = override?.status === 'Dispatched';

                    return (
                      <div
                        key={client.id}
                        className={`p-2.5 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-2 ${
                          isInspected
                            ? 'bg-amber-400/10 border-amber-400/50 ring-1 ring-amber-400/30'
                            : isSelected
                            ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-950/60 border-slate-850 opacity-60 hover:opacity-100'
                        }`}
                        onClick={() => {
                          const cIdx = clientEmailDrafts.findIndex((d) => d.clientId === client.id);
                          if (cIdx >= 0) setInspectedClientIndex(cIdx);
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleClient(client.id);
                            }}
                            className="w-4 h-4 rounded border-slate-700 text-amber-400 focus:ring-amber-400 cursor-pointer"
                          />

                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-100 truncate flex items-center gap-1.5">
                              <span>{client.name}</span>
                              {isDispatched && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                                  Sent
                                </span>
                              )}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">
                              {client.customerDetails?.decisionMakerRole || 'Procurement Buyer'} • {client.location?.area || routeConfig.destCity}, {client.location?.country || routeConfig.destCountry}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const draft = clientEmailDrafts.find((d) => d.clientId === client.id);
                              if (draft) handleOpenMailtoForDraft(draft);
                            }}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Direct Mailto"
                          >
                            <Mail className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const draft = clientEmailDrafts.find((d) => d.clientId === client.id);
                              if (draft) handleOpenWhatsAppForDraft(draft);
                            }}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Direct WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bulk Dispatch Footer Bar */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Batch Actions ({selectedClientIds.length} recipients):</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleBatchDispatchMailto}
                      disabled={selectedClientIds.length === 0}
                      className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch via Email Client</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadAllEmls}
                      disabled={selectedClientIds.length === 0}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Download .eml Files</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyAllClientDrafts}
                    disabled={selectedClientIds.length === 0}
                    className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-sky-400" />
                    <span>Copy All Drafts to Clipboard</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Active Client Live Customized Email Preview & Edit (7 cols) */}
              <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3.5 flex flex-col">
                {activeInspectedDraft ? (
                  <>
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300">
                            Recipient #{inspectedClientIndex + 1} of {clientEmailDrafts.length}
                          </span>
                          <h3 className="text-sm font-bold text-slate-100">
                            {activeInspectedDraft.clientName}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Delivery: {activeInspectedDraft.destinationCity}, {activeInspectedDraft.destinationCountry} • Pitch: {activeInspectedDraft.templateAngle}
                        </p>
                      </div>

                      {/* Individual quick dispatch buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenMailtoForDraft(activeInspectedDraft)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                          title="Open mailto: client"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Email</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenGmailForDraft(activeInspectedDraft)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Open in Gmail Web"
                        >
                          <Mail className="w-3 h-3 text-red-400" />
                          <span>Gmail</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenWhatsAppForDraft(activeInspectedDraft)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Open in WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-400" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadEmlForDraft(activeInspectedDraft)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                          title="Download single .eml file"
                        >
                          <Download className="w-3.5 h-3.5 text-sky-400" />
                        </button>
                      </div>
                    </div>

                    {/* Email Recipient and Subject Row */}
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">To Email Address</label>
                          <input
                            type="text"
                            value={activeInspectedDraft.recipientEmail}
                            readOnly
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 font-mono text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Phone / WhatsApp</label>
                          <input
                            type="text"
                            value={activeInspectedDraft.recipientWhatsapp}
                            readOnly
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-emerald-300 font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Custom Subject Line</label>
                        <input
                          type="text"
                          value={activeInspectedDraft.subject}
                          onChange={(e) => handleUpdateInspectedDraft('subject', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-200 font-semibold focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[10px] text-slate-400 font-semibold">
                            Custom Personalized Message Body
                          </label>
                          <span className="text-[10px] text-slate-500">
                            Auto-tailored for {activeInspectedDraft.clientName}
                          </span>
                        </div>
                        <textarea
                          rows={11}
                          value={activeInspectedDraft.body}
                          onChange={(e) => handleUpdateInspectedDraft('body', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono leading-relaxed resize-y"
                        />
                      </div>
                    </div>

                    {/* WhatsApp companion preview */}
                    <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between text-emerald-400 font-semibold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Direct WhatsApp Pitch Summary</span>
                        </span>
                        <span className="text-[10px] text-slate-400">1-Tap Send</span>
                      </div>
                      <p className="text-[11px] text-slate-300 italic">
                        "{activeInspectedDraft.whatsappMessage}"
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Please select at least one client on the left to preview and customize outreach emails.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-SUPPLIER SOURCING MATRIX */}
        {activeMainTab === 'suppliers_rfq' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Simultaneous Multi-Supplier Sourcing &amp; Quote Comparison</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300">
                    {supplierRfqDrafts.length} Vendors Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Request RFQ quotations from multiple manufacturers simultaneously, benchmark landed costs to {routeConfig.destCity}, and select the highest margin supplier.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllSuppliers}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                >
                  {selectedSupplierIds.length === suppliers.length ? 'Deselect All' : 'Select All Suppliers'}
                </button>
              </div>
            </div>

            {/* Sourcing Side-by-Side Comparison Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-3">Select</th>
                      <th className="p-3">Supplier Name &amp; Origin</th>
                      <th className="p-3">Quoted Price</th>
                      <th className="p-3">MOQ</th>
                      <th className="p-3">Lead Time</th>
                      <th className="p-3">Freight to {routeConfig.destCity}</th>
                      <th className="p-3">Landed Cost</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {supplierRfqDrafts.map((supDraft) => {
                      const isSelected = selectedSupplierIds.includes(supDraft.supplierId);
                      const isLowestPrice =
                        supDraft.quotedUnitPrice !== undefined &&
                        supDraft.quotedUnitPrice ===
                          Math.min(...supplierRfqDrafts.map((s) => s.quotedUnitPrice || 999));

                      return (
                        <tr
                          key={supDraft.supplierId}
                          className={`hover:bg-slate-900/50 transition ${
                            isLowestPrice ? 'bg-amber-400/5' : ''
                          }`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSupplier(supDraft.supplierId)}
                              className="w-4 h-4 rounded border-slate-700 text-amber-400 focus:ring-amber-400 cursor-pointer"
                            />
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-slate-100 flex items-center gap-1.5">
                              <span>{supDraft.supplierName}</span>
                              {isLowestPrice && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-slate-950">
                                  Best Price
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {supDraft.originCity}, {supDraft.originCountry} • {supDraft.recipientEmail}
                            </div>
                          </td>

                          <td className="p-3 font-semibold text-amber-300">
                            ${supDraft.quotedUnitPrice?.toFixed(2)} USD
                          </td>

                          <td className="p-3 text-slate-300 font-medium">
                            {supDraft.moq}
                          </td>

                          <td className="p-3 text-slate-300">
                            {supDraft.leadTimeDays} days
                          </td>

                          <td className="p-3 text-sky-300">
                            ~${supDraft.freightCostEst?.toFixed(2)} / unit
                          </td>

                          <td className="p-3 font-bold text-emerald-400">
                            ${supDraft.landedCostEst?.toFixed(2)} USD
                          </td>

                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                supDraft.status === 'Awarded'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : supDraft.status === 'Quote Received'
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {supDraft.status}
                            </span>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const to = supDraft.recipientEmail;
                                  const subj = encodeURIComponent(supDraft.subject);
                                  const body = encodeURIComponent(supDraft.body);
                                  window.open(`mailto:${to}?subject=${subj}&body=${body}`, '_blank');
                                  triggerToast(`Launched RFQ Email for ${supDraft.supplierName}`);
                                }}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                                title="Send RFQ Email to this supplier"
                              >
                                <Mail className="w-3 h-3" />
                                <span>Send RFQ</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const clean = sanitizeWhatsAppNumber(supDraft.recipientWhatsapp, supDraft.originCountry);
                                  const link = buildWhatsAppLink(
                                    clean,
                                    `Hello ${supDraft.supplierName}, we need a quotation for ${targetBatchQuantity} units of ${campaignProduct} for delivery to ${routeConfig.destCity}. Can you send pro-forma?`,
                                    supDraft.originCountry
                                  );
                                  window.open(link, '_blank');
                                  triggerToast(`Launched WhatsApp RFQ for ${supDraft.supplierName}`);
                                }}
                                className="p-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
                                title="Send WhatsApp RFQ"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: POOLED DEMAND & MULTI-CLIENT MULTI-SUPPLIER ARBITRAGE */}
        {activeMainTab === 'demand_aggregation' && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl shadow-lg space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      Multi-Client Demand Aggregator &amp; Cross-Supplier Arbitrage
                    </h3>
                    <p className="text-xs text-slate-400">
                      Consolidate orders across multiple clients to unlock maximum volume discounts from manufacturing suppliers.
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {aggregationData.totalClientsCount} Clients Pooled • {aggregationData.pooledDemandQuantity} Total Units Demand
                </span>
              </div>

              {/* Arbitrage KPI Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Pooled Demand</span>
                  <div className="text-lg font-black text-amber-300">
                    {aggregationData.pooledDemandQuantity.toLocaleString()} Units
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Across {aggregationData.totalClientsCount} target buyers
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Best Sourced Landed Cost</span>
                  <div className="text-lg font-black text-sky-300">
                    ${aggregationData.landedPerUnit.toFixed(2)} USD
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Includes transit to {routeConfig.destCity}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Consolidated Client Revenue</span>
                  <div className="text-lg font-black text-slate-100">
                    ${aggregationData.totalRevenue.toLocaleString()} USD
                  </div>
                  <span className="text-[10px] text-slate-500">
                    At ${aggregationData.sellingPerUnit}/unit sale price
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold">Projected Net Gross Profit</span>
                  <div className="text-lg font-black text-emerald-400">
                    +${aggregationData.netGrossProfit.toLocaleString()} USD
                  </div>
                  <span className="text-[10px] text-emerald-300/80 font-bold">
                    {aggregationData.marginPct}% Gross Margin
                  </span>
                </div>
              </div>

              {/* Sourcing to Client Fulfillment Breakdown */}
              <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>Trade Flow Execution: Multi-Supplier to Multi-Client</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-amber-400 block font-semibold">1. Sourcing Suppliers (Export)</strong>
                    <p className="text-slate-400">
                      Sourced from {supplierRfqDrafts.slice(0, 3).map((s) => s.supplierName).join(', ')} at ~${aggregationData.bestSupplierPrice}/unit in {routeConfig.originCity}.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-sky-400 block font-semibold">2. Freight Transport Corridor</strong>
                    <p className="text-slate-400">
                      Commercial truck haulage from {routeConfig.originCity} to {routeConfig.destCity} via primary Beitbridge or Kazungula corridor (~$12/unit freight + tolls).
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-emerald-400 block font-semibold">3. Client Delivery &amp; Invoicing</strong>
                    <p className="text-slate-400">
                      Distributed across {clientEmailDrafts.slice(0, 3).map((c) => c.clientName).join(', ')} at ${aggregationData.sellingPerUnit}/unit for a net profit of +${aggregationData.netGrossProfit.toLocaleString()} USD.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
