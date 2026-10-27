import React, { useState, useEffect } from 'react';
import { RfqEmailRequest, RfqEmailResponse, LeadItem, EmailOption } from '../types';
import { generateRfqEmailApi } from '../services/api';
import {
  Mail,
  Send,
  Copy,
  Check,
  X,
  FileText,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Building2,
  Package,
  Layers,
  MapPin,
  Download,
  RefreshCw,
  Edit3,
  Phone,
  CheckCircle2,
  Navigation,
  Truck,
  ArrowRight,
  Map as MapIcon,
} from 'lucide-react';
import { soundManager } from '../utils/audioCues';
import { buildWhatsAppLink, sanitizeWhatsAppNumber, formatDisplayPhone } from '../utils/contactUtils';
import { OriginDestinationMap, RouteLogisticsConfig } from './OriginDestinationMap';

interface RfqEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: LeadItem | null;
  defaultOrigin?: string;
  defaultDestination?: string;
  routeConfig?: RouteLogisticsConfig;
  onUpdateRouteConfig?: (config: RouteLogisticsConfig) => void;
}

export const RfqEmailModal: React.FC<RfqEmailModalProps> = ({
  isOpen,
  onClose,
  supplier,
  defaultOrigin = 'Johannesburg, Gauteng, South Africa',
  defaultDestination = 'Kitwe, Copperbelt, Zambia',
  routeConfig,
  onUpdateRouteConfig,
}) => {
  // Sourcing Origin & Delivery Destination State (Initialized from active routeConfig if provided)
  const [originCountry, setOriginCountry] = useState(routeConfig?.originCountry || 'South Africa');
  const [originProvince, setOriginProvince] = useState(routeConfig?.originProvince || 'Gauteng');
  const [originCity, setOriginCity] = useState(routeConfig?.originCity || 'Johannesburg');
  const [originAddress, setOriginAddress] = useState(routeConfig?.originAddress || 'Industrial Zone, Johannesburg');

  const [destCountry, setDestCountry] = useState(routeConfig?.destCountry || 'Zambia');
  const [destProvince, setDestProvince] = useState(routeConfig?.destProvince || 'Copperbelt');
  const [destCity, setDestCity] = useState(routeConfig?.destCity || 'Kitwe');
  const [destAddress, setDestAddress] = useState(routeConfig?.destAddress || 'Chibuluma Road Industrial Area, Kitwe');

  const [showRouteMap, setShowRouteMap] = useState(false);

  // Sync with routeConfig prop whenever modal opens
  useEffect(() => {
    if (isOpen && routeConfig) {
      if (routeConfig.originCountry) setOriginCountry(routeConfig.originCountry);
      if (routeConfig.originProvince) setOriginProvince(routeConfig.originProvince);
      if (routeConfig.originCity) setOriginCity(routeConfig.originCity);
      if (routeConfig.originAddress) setOriginAddress(routeConfig.originAddress);

      if (routeConfig.destCountry) setDestCountry(routeConfig.destCountry);
      if (routeConfig.destProvince) setDestProvince(routeConfig.destProvince);
      if (routeConfig.destCity) setDestCity(routeConfig.destCity);
      if (routeConfig.destAddress) setDestAddress(routeConfig.destAddress);
    }
  }, [isOpen, routeConfig]);

  // Sync changes back to routeConfig so parent view and modal stay in lockstep
  const handleOriginAddressChange = (val: string) => {
    setOriginAddress(val);
    if (onUpdateRouteConfig && routeConfig) {
      onUpdateRouteConfig({ ...routeConfig, originAddress: val });
    }
  };

  const handleDestAddressChange = (val: string) => {
    setDestAddress(val);
    if (onUpdateRouteConfig && routeConfig) {
      onUpdateRouteConfig({ ...routeConfig, destAddress: val });
    }
  };

  // RFQ / Proposal Form State
  const isCustomer = supplier?.entityType === 'customer';
  const [productName, setProductName] = useState('1.8 m Mining Barrier Cones');
  const [productDescription, setProductDescription] = useState(
    '1.8 m Barrier / Mining Cones for demarcating work areas, exclusion zones, road edges and hazardous areas in mining or industrial environments.'
  );
  const [quantity, setQuantity] = useState('8');
  const [colour, setColour] = useState('white-Branded (logo and branding guidelines will be sent)');

  const [specificationsText, setSpecificationsText] = useState(
    `Height: 1.8 m / 1800 mm\nQuantity: 8\nHeavy-duty durable plastic construction\nSuitable for open-cast mining and harsh outdoor environments\nHigh-visibility colours\nReflective strips or reflective stickers preferred\nStackable design preferred\nStable base / heavy-duty option preferred\nOptional branding or decals, if available`
  );

  const [requestedQuoteDetailsText, setRequestedQuoteDetailsText] = useState(
    `Unit price\nAvailable colours\nWeight per cone\nMinimum order quantity\nLead time\nDelivery cost from Origin to Destination\nProduct pictures or catalogue\nPayment terms`
  );

  // Custom User Signature (stored in localStorage)
  const [senderSignature, setSenderSignature] = useState(() => {
    try {
      const saved = localStorage.getItem('screensense_rfq_signature');
      return saved || 'Kind regards,\nHanekom Innovations Limited.';
    } catch {
      return 'Kind regards,\nHanekom Innovations Limited.';
    }
  });

  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierWhatsapp, setSupplierWhatsapp] = useState('');

  // 5 Prepared Email Options State
  const [emailOptions, setEmailOptions] = useState<EmailOption[]>([]);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState(0);

  // Active email preview state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [whatsappSummary, setWhatsappSummary] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState<'email' | 'whatsapp'>('email');

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedType, setCopiedType] = useState<'body' | 'subject' | 'whatsapp' | 'contacts' | null>(null);

  // Sync supplier/contact prop if changed
  useEffect(() => {
    if (supplier) {
      setSupplierName(supplier.name);
      const email = supplier.email || (supplier.website ? `sales@${supplier.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}` : '');
      const phone = supplier.phone || supplier.contactChannels?.find((c) => !c.includes('@') && /[\d+]/.test(c)) || '';
      const whatsapp = supplier.whatsapp || phone;
      setSupplierEmail(email);
      setSupplierPhone(phone);
      setSupplierWhatsapp(whatsapp);

      // Only adjust origin/destination if not already customized by user
      if (supplier.entityType === 'supplier') {
        if (supplier.location?.country) setOriginCountry(supplier.location.country);
        if (supplier.location?.province) setOriginProvince(supplier.location.province);
        if (supplier.location?.area) setOriginCity(supplier.location.area);
        // Do NOT overwrite user's custom address if already provided
        if (supplier.address && (!originAddress || originAddress === 'Industrial Zone, Johannesburg')) {
          setOriginAddress(supplier.address);
        }
      } else if (supplier.entityType === 'customer') {
        if (supplier.location?.country) setDestCountry(supplier.location.country);
        if (supplier.location?.province) setDestProvince(supplier.location.province);
        if (supplier.location?.area) setDestCity(supplier.location.area);
        // Do NOT overwrite user's custom address if already provided
        if (supplier.address && (!destAddress || destAddress === 'Chibuluma Road Industrial Area, Kitwe')) {
          setDestAddress(supplier.address);
        }
      }
    } else {
      setSupplierName('Commercial Sales Team');
      setSupplierEmail('sales@supplier.co.za');
      setSupplierPhone('+27 11 830 4400');
      setSupplierWhatsapp('+27 11 830 4400');
    }
  }, [supplier]);

  // Persist signature changes
  const handleSignatureChange = (val: string) => {
    setSenderSignature(val);
    try {
      localStorage.setItem('screensense_rfq_signature', val);
    } catch {}
  };

  const originText = `${originCity || 'Johannesburg'}${originProvince ? `, ${originProvince}` : ''}, ${originCountry || 'South Africa'}`;
  const destText = `${destCity || 'Kitwe'}${destProvince ? `, ${destProvince}` : ''}, ${destCountry || 'Zambia'}`;

  // Local rapid generation helper: Prepares 5 distinct email choices for any contact
  const buildLocalEmails = () => {
    const specs = specificationsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const quotes = requestedQuoteDetailsText
      .split('\n')
      .map((q) => q.trim())
      .filter(Boolean);

    const specList = specs.length > 0 ? specs.map((s) => `- ${s}`).join('\n') : `- Quantity: ${quantity}\n- Standard industrial specification`;
    const quoteList = quotes.length > 0 ? quotes.map((q) => `- ${q}`).join('\n') : `- Unit price\n- Minimum order quantity (MOQ)\n- Lead time\n- Freight & Delivery cost from ${originText} to ${destText}\n- Payment terms`;

    let fiveOptions: EmailOption[] = [];

    if (isCustomer) {
      // 5 Distinct Customer Sales Pitch Templates
      fiveOptions = [
        {
          id: 'email-1',
          title: '1. Commercial Supply Proposal',
          tag: 'Formal Pitch',
          angle: 'Professional B2B supply offer tailored to client operations and procurement requirements',
          subject: `Commercial Supply Proposal – ${productName} [Delivery to ${destCity}, ${destCountry}]`,
          body: `Good day ${supplierName || 'Procurement Team'},\n\nWe are pleased to introduce our supply capabilities for ${productName} to support your operations in ${destText}.\n\nProposed Sourcing & Logistics Details:\n- Sourcing Origin: ${originText}${originAddress ? ` (${originAddress})` : ''}\n- Delivery Destination: ${destText}${destAddress ? ` (${destAddress})` : ''}\n- Target Batch Quantity: ${quantity} units\n${colour ? `- Specification & Colour: ${colour}\n` : ''}\nProduct Specifications:\n${specList}\n\nOur Commercial Advantages:\n- Direct landed supply with reliable delivery to ${destCity}\n- High-durability UV-stabilized materials engineered for demanding African conditions\n- Flexible payment terms and certified SADC compliance\n\nPlease let us know if you would like us to share our full catalogue and competitive pricing schedule.\n\n${senderSignature}`,
          whatsappSummary: `Good day ${supplierName}, we supply high-durability ${productName} with scheduled delivery to ${destCity}, ${destCountry}. Can we share our commercial price schedule? ${senderSignature.split('\n')[0]}`,
        },
        {
          id: 'email-2',
          title: '2. Volume Wholesale Margins',
          tag: 'Wholesale Discount',
          angle: 'Focuses on volume price breaks, landed cost savings, and operational margins',
          subject: `Wholesale Volume Pricing & Rebate Offer – ${productName}`,
          body: `Dear ${supplierName || 'Procurement Lead'},\n\nWe are reaching out to present substantial volume savings on ${productName} for your upcoming replenishment cycles in ${destText}.\n\nLogistics Route:\n- Dispatched from: ${originText}\n- Direct delivery to: ${destText}\n\nWe offer tiered commercial pricing to maximize your purchasing budget:\n- Initial Requirement: ${quantity} units\n- Tier 1 Volume Break (3x): Substantial unit cost reduction\n- Tier 2 Framework Volume (10x): Preferred contractor pricing + volume rebate\n\nSpecifications:\n${specList}\n\nWe would welcome a brief discussion to review how our supply corridor can lower your delivered cost.\n\n${senderSignature}`,
          whatsappSummary: `Hello ${supplierName}, we have tiered volume discounts on ${productName} delivered from ${originCity} to ${destCity}. Could we share our price breaks with your procurement team? ${senderSignature.split('\n')[0]}`,
        },
        {
          id: 'email-3',
          title: '3. Long-Term Supply Agreement',
          tag: 'Partnership',
          angle: 'Positions your company as a reliable recurring supply partner with buffer stock and SLAs',
          subject: `Long-Term Supply Partnership & Consignment Agreement – ${productName}`,
          body: `Dear ${supplierName || 'Management'},\n\nWe are interested in establishing a preferred vendor partnership with ${supplierName} for the regular supply of ${productName}.\n\nSupply Framework Overview:\n- Origin Hub: ${originText}\n- Client Facility / Mine Site: ${destText}\n\nOur Partnership Inclusions:\n1. Dedicated buffer stock maintained to eliminate operational downtime\n2. Guaranteed delivery lead times from ${originCity} to ${destCity}\n3. Quarterly volume rebate and locked 12-month raw material pricing\n4. Free corporate branding and high-visibility decals on all units\n\nWe look forward to presenting a structured supply agreement for your evaluation.\n\n${senderSignature}`,
          whatsappSummary: `Good day ${supplierName}, we are looking to establish a long-term preferred supply agreement for ${productName} delivered to ${destCity}. Please connect to explore a vendor partnership. ${senderSignature.split('\n')[0]}`,
        },
        {
          id: 'email-4',
          title: '4. Catalog & Free Sample Offer',
          tag: 'Low Friction',
          angle: 'Low-friction inquiry offering technical datasheet, compliance certificates, and a free trial sample',
          subject: `Product Catalogue & Evaluation Sample: ${productName}`,
          body: `Good day ${supplierName || 'Team'},\n\nWe are sharing our technical product catalogue for ${productName}, designed specifically for heavy industrial and mining operations.\n\nLogistics Summary:\n- Shipped from: ${originText}\n- Delivered to: ${destText}\n\nSpecifications & Compliance:\n${specList}\n\nTo allow your safety and operations team to assess our material quality firsthand, we would be pleased to arrange an evaluation sample delivered to your ${destCity} site.\n\nPlease confirm the best recipient and physical address to receive our product brochure and sample unit.\n\n${senderSignature}`,
          whatsappSummary: `Hi ${supplierName}, would you like us to dispatch a free sample and technical catalogue of our ${productName} to your ${destCity} office? ${senderSignature.split('\n')[0]}`,
        },
        {
          id: 'email-5',
          title: '5. Fast-Track Order & Priority Stock',
          tag: 'Urgent Delivery',
          angle: 'Immediate availability notification for active deployment or urgent site replenishment',
          subject: `Priority Stock Available for Immediate Delivery to ${destCity}: ${productName}`,
          body: `Attention: ${supplierName || 'Procurement Team'},\n\nWe currently have active inventory of ${productName} staged and ready for immediate dispatch from our ${originCity} depot to ${destText}.\n\nOrder Details:\n- Quantity Available: ${quantity}+ units\n- Sourcing Origin: ${originText}\n- Destination Site: ${destText}\n- Specifications: Fully compliant heavy-duty specification (${specList.replace(/\n/g, ', ')})\n\nIf you have active demarcations, safety audits, or immediate replenishment needs, we can confirm priority truck loading within 24 hours.\n\nPlease reply with your purchase requisition to lock in current batch pricing.\n\n${senderSignature}`,
          whatsappSummary: `URGENT: We have stock of ${productName} ready for rapid dispatch from ${originCity} to ${destCity}. Can we reserve your batch today? ${senderSignature.split('\n')[0]}`,
        },
      ];
    } else {
      // 5 Distinct Supplier RFQ Templates
      fiveOptions = [
        {
          id: 'email-1',
          title: '1. Formal Sourcing RFQ',
          tag: 'Formal & Direct',
          angle: 'Structured B2B procurement inquiry with full specifications and quotation breakdown',
          subject: `Request for Quotation – ${productName} [Transit: ${originCity} ➔ ${destCity}]`,
          body: `Good day ${supplierName || 'Sales Team'},\n\nPlease assist with a formal commercial quotation for the following equipment:\n\nProduct Required:\n${productName}${productDescription ? ` – ${productDescription}` : ''}\n\nSourcing & Logistics Details:\n- Sourcing Origin (Your Facility): ${originText}${originAddress ? ` (${originAddress})` : ''}\n- Delivery Destination: ${destText}${destAddress ? ` (${destAddress})` : ''}\n\nRequired Specifications:\n- Target Quantity: ${quantity} units\n${colour ? `- Colour / Branding: ${colour}\n` : ''}${specList}\n\nPlease include the following details in your quotation:\n${quoteList}\n\nWe look forward to receiving your quotation.\n\n${senderSignature}`,
          whatsappSummary: `Good day ${supplierName || 'Sales Team'}, please assist with a formal quote for ${quantity}x ${productName} to be delivered from ${originCity} to ${destCity}, ${destCountry}. Please share unit price and lead time. ${senderSignature.split('\n')[0]}`,
        },
        {
          id: 'email-2',
          title: '2. Volume Pricing & Tier Discovery',
          tag: 'Commercial Scale',
          angle: 'Explores price curve discounts and quantity breaks for repeat and bulk orders',
          subject: `Commercial Pricing & Volume Tier Inquiry – ${productName}`,
          body: `Good day ${supplierName || 'Commercial Team'},\n\nWe are currently evaluating supply options for ${productName} for our operations in ${destText}, sourced from ${originText}.\n\nOur initial requirement is ${quantity} units, with expected ongoing recurring procurement. To help us structure our purchase order, please provide tiered commercial pricing across:\n- ${quantity} units (Initial batch)\n- ${parseInt(String(quantity), 10) * 3 || 30} units (Follow-up batch)\n- ${parseInt(String(quantity), 10) * 10 || 100} units (Bulk framework)\n\nSpecifications Required:\n${specList}\n\nPlease also confirm lead times, packaging dimensions, and freight rates for delivery from ${originCity} to ${destCity}.\n\n${senderSignature}`,
          whatsappSummary: `Good day ${supplierName}, we need tiered pricing for ${quantity}x ${productName} sourced from ${originCity} to ${destCity}. Could you share your volume discount breaks? ${senderSignature.split('\n')[0]}`,
        },
        {
          id: 'email-3',
          title: '3. Strategic Supply Partnership',
          tag: 'Long-Term Supply',
          angle: 'Positions buyer as high-value regional distributor seeking recurring supplier framework',
          subject: `Supply Partnership & Framework Inquiry – ${productName}`,
          body: `Dear ${supplierName || 'Sales'} Commercial Team,\n\nWe are reaching out to discuss establishing a reliable supply relationship for ${productName}.\n\nWe are actively expanding our distribution and operational deployment in ${destText}, and we are identifying qualified manufacturers in ${originText} who can offer consistent quality, dependable lead times, and competitive trade terms.\n\nTo begin our supplier evaluation, please furnish:\n1. Quotation for ${quantity} units of ${productName}\n2. Product technical datasheet and compliance certificates\n3. Standard distributor or trade terms (e.g. Net 30, consignment options)\n4. Delivery schedules and transport options from ${originCity} to ${destCity}\n\nWe appreciate your collaboration and look forward to building a productive partnership.\n\n${senderSignature}`,
          whatsappSummary: `Good day ${supplierName || 'Sales Team'}, we are looking to establish a recurring supply partnership for ${productName} starting with ${quantity} units from ${originCity} to ${destCity}. Please connect to discuss trade terms. ${senderSignature.split('\n')[0]}`,
        },
        {
          id: 'email-4',
          title: '4. Quick Catalog & Lead Time Check',
          tag: 'Low Friction',
          angle: 'Concise, quick turnaround inquiry requesting technical brochure and stock availability',
          subject: `Quick Inquiry: Availability & Catalog – ${productName}`,
          body: `Good day ${supplierName || 'Sales Team'},\n\nWe have an active requirement for ${quantity} units of ${productName} to be delivered to ${destText}.\n\nCould you kindly confirm:\n- Whether you currently have stock available at your ${originCity} facility or manufacturing lead time\n- Estimated unit cost for ${quantity} units\n- High-resolution product images or technical specification PDF\n- Estimated freight cost to ${destText}\n\nThank you for your assistance.\n\n${senderSignature}`,
          whatsappSummary: `Hi ${supplierName || 'Sales Team'}, do you have ${quantity}x ${productName} currently in stock in ${originCity}? Please share quick unit price and delivery estimate to ${destCity}. ${senderSignature.split('\n')[0]}`,
        },
        {
          id: 'email-5',
          title: '5. Urgent Procurement & Tender Dispatch',
          tag: 'High Urgency',
          angle: 'Express commercial timeline requiring prompt pricing for active deployment',
          subject: `URGENT Sourcing Quote Required: ${productName} [Destination: ${destCity}, ${destCountry}]`,
          body: `Attention: ${supplierName || 'Sales'} Desk,\n\nURGENT: We have an immediate commercial deployment requiring ${quantity} units of ${productName}.\n\nWe are finalizing purchase approvals and require your formal commercial quotation within 24–48 hours.\n\nSpecifications:\n${specList}\n\nLogistics Route:\n- Sourcing Origin: ${originText}\n- Final Destination: ${destText}${destAddress ? ` (${destAddress})` : ''}\n\nPlease email your best quotation immediately including:\n- Firm unit price and any volume break\n- Earliest confirmed dispatch date from ${originCity}\n- Payment terms and pro-forma invoice instructions\n\nThank you for treating this with priority.\n\n${senderSignature}`,
          whatsappSummary: `URGENT: Need fast quote for ${quantity}x ${productName} for immediate sign-off. Destination: ${destCity}. Please confirm earliest delivery date and price today! ${senderSignature.split('\n')[0]}`,
        },
      ];
    }

    setEmailOptions(fiveOptions);
    const active = fiveOptions[selectedEmailIndex] || fiveOptions[0];
    setSubject(active.subject);
    setBody(active.body);
    setWhatsappSummary(active.whatsappSummary);
  };

  // Trigger initial generation when modal opens
  useEffect(() => {
    if (isOpen) {
      buildLocalEmails();
    }
  }, [isOpen, supplier, originCity, originCountry, destCity, destCountry]);

  // AI-powered RFQ polish and generation of 5 distinct emails
  const handleGenerateAiEmail = async () => {
    setIsGenerating(true);
    soundManager.playScanStart();

    const specs = specificationsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const quotes = requestedQuoteDetailsText
      .split('\n')
      .map((q) => q.trim())
      .filter(Boolean);

    try {
      const res = await generateRfqEmailApi({
        supplierName: supplierName || 'Commercial Partner',
        supplierEmail,
        supplierPhone,
        supplierWhatsapp,
        productName,
        productDescription,
        quantity,
        colour,
        specifications: specs,
        requestedQuoteDetails: quotes,
        deliveryDestination: destText,
        sourcingOrigin: originText,
        senderSignature,
        emailType: isCustomer ? 'customer_pitch' : 'rfq',
      });

      if (res.emails && res.emails.length > 0) {
        setEmailOptions(res.emails);
        const idx = Math.min(selectedEmailIndex, res.emails.length - 1);
        setSubject(res.emails[idx].subject);
        setBody(res.emails[idx].body);
        setWhatsappSummary(res.emails[idx].whatsappSummary || '');
      } else {
        setSubject(res.subject);
        setBody(res.body);
        setWhatsappSummary(res.whatsappSummary || '');
      }
      soundManager.playScanComplete();
    } catch (e) {
      console.warn('AI generation error, using client template:', e);
      buildLocalEmails();
    } finally {
      setIsGenerating(false);
    }
  };

  // Switch between the 5 prepared email choices
  const handleSelectEmailOption = (index: number) => {
    setSelectedEmailIndex(index);
    const chosen = emailOptions[index];
    if (chosen) {
      setSubject(chosen.subject);
      setBody(chosen.body);
      setWhatsappSummary(chosen.whatsappSummary || '');
      soundManager.playTargetLocated();
    }
  };

  // Keep email option updated when user edits in live preview
  const handleBodyChange = (newBody: string) => {
    setBody(newBody);
    if (emailOptions[selectedEmailIndex]) {
      const updated = [...emailOptions];
      updated[selectedEmailIndex] = { ...updated[selectedEmailIndex], body: newBody };
      setEmailOptions(updated);
    }
  };

  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    if (emailOptions[selectedEmailIndex]) {
      const updated = [...emailOptions];
      updated[selectedEmailIndex] = { ...updated[selectedEmailIndex], subject: newSubject };
      setEmailOptions(updated);
    }
  };

  // Copy helper
  const handleCopy = (text: string, type: 'body' | 'subject' | 'whatsapp' | 'contacts') => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
      soundManager.playTargetLocated();
    } catch {}
  };

  // One-click Dispatch via mailto:
  const handleOpenMailto = () => {
    const to = supplierEmail || '';
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const mailtoUrl = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
    window.open(mailtoUrl, '_blank');
  };

  // Open in Gmail web
  const handleOpenGmail = () => {
    const to = supplierEmail || '';
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${encodedSubject}&body=${encodedBody}`;
    window.open(gmailUrl, '_blank');
  };

  // Clean WhatsApp number and build direct wa.me link
  const targetWaNumber = supplierWhatsapp || supplierPhone || '';
  const cleanWaNumber = sanitizeWhatsAppNumber(targetWaNumber, destCountry || originCountry);
  const waLink = targetWaNumber
    ? buildWhatsAppLink(targetWaNumber, whatsappSummary || body, destCountry || originCountry)
    : '#';

  // Open direct WhatsApp chat
  const handleOpenWhatsApp = () => {
    if (waLink && waLink !== '#') {
      soundManager.playStepSuccess();
      window.open(waLink, '_blank');
    } else {
      const encodedText = encodeURIComponent(whatsappSummary || body);
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    }
  };

  // Download .eml file
  const handleDownloadEml = () => {
    const emlContent = `To: ${supplierEmail || 'contact@example.com'}\nSubject: ${subject}\nX-Unsent: 1\nContent-Type: text/plain; charset=utf-8\n\n${body}`;
    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${isCustomer ? 'Pitch' : 'RFQ'}_${productName.replace(/[^a-zA-Z0-9]/g, '_')}_Option${selectedEmailIndex + 1}_${Date.now()}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeRouteConfig: RouteLogisticsConfig = {
    originCountry,
    originProvince,
    originCity,
    originAddress,
    destCountry,
    destProvince,
    destCity,
    destAddress,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  {isCustomer ? 'Customer Sales Outreach & Commercial Proposal' : 'Sourcing RFQ & Supplier Outreach Engine'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  5 Draft Choices
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  <span>{originCity} ➔ {destCity}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Choose from 5 distinct commercial angles, inspect origin &amp; destination corridor, and dispatch via Email or direct WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRouteMap(!showRouteMap)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                showRouteMap
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md font-bold'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{showRouteMap ? 'Hide Route Map' : '🗺️ View Origin & Destination Map'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Collapsible Route Map View */}
        {showRouteMap && (
          <div className="p-3 bg-slate-950 border-b border-slate-800">
            <OriginDestinationMap
              config={activeRouteConfig}
              onChangeConfig={(c) => {
                setOriginCountry(c.originCountry);
                setOriginProvince(c.originProvince);
                setOriginCity(c.originCity);
                handleOriginAddressChange(c.originAddress);
                setDestCountry(c.destCountry);
                setDestProvince(c.destProvince);
                setDestCity(c.destCity);
                handleDestAddressChange(c.destAddress);
              }}
              onApplyToEmails={() => {
                buildLocalEmails();
                soundManager.playStepSuccess();
              }}
              compact
            />
          </div>
        )}

        {/* Modal Body - 2 Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Form & Route Details (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Origin & Destination Logistics Corridor Inputs */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>Logistics Corridor: Origin ➔ Destination</span>
              </span>

              {/* Origin Inputs */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-400/30 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-amber-300 font-bold text-[11px]">
                  <span>Sourcing Origin (Coming from)</span>
                  <span className="text-[10px] text-slate-400">Point A</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    value={originCountry}
                    onChange={(e) => setOriginCountry(e.target.value)}
                    placeholder="Country (e.g. South Africa)"
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-amber-200"
                  />
                  <input
                    type="text"
                    value={originProvince}
                    onChange={(e) => setOriginProvince(e.target.value)}
                    placeholder="State/Province (Gauteng)"
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200"
                  />
                  <input
                    type="text"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    placeholder="City (Johannesburg)"
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Origin Facility / Factory Address</span>
                  <button
                    type="button"
                    onClick={() => handleOriginAddressChange(`Industrial Depot, ${originCity || 'Johannesburg'}, ${originCountry || 'South Africa'}`)}
                    className="text-slate-400 hover:text-amber-400 underline cursor-pointer"
                  >
                    ↺ Reset to area default
                  </button>
                </div>
                <input
                  type="text"
                  value={originAddress}
                  onChange={(e) => handleOriginAddressChange(e.target.value)}
                  placeholder="Specific facility or factory address"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Destination Inputs */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-400/30 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-emerald-300 font-bold text-[11px]">
                  <span>Delivery Destination (Going to)</span>
                  <span className="text-[10px] text-slate-400">Point B</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    value={destCountry}
                    onChange={(e) => setDestCountry(e.target.value)}
                    placeholder="Country (e.g. Zambia)"
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-emerald-300 font-medium"
                  />
                  <input
                    type="text"
                    value={destProvince}
                    onChange={(e) => setDestProvince(e.target.value)}
                    placeholder="State (Copperbelt/Lusaka)"
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200"
                  />
                  <input
                    type="text"
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    placeholder="City (Kitwe/Lusaka/Solwezi)"
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="text-emerald-400 font-semibold">Delivery Site / Mine / Warehouse Address</span>
                  <button
                    type="button"
                    onClick={() => handleDestAddressChange(`Receiving Site, ${destCity || 'Kitwe'}, ${destCountry || 'Zambia'}`)}
                    className="text-slate-400 hover:text-emerald-400 underline cursor-pointer"
                  >
                    ↺ Reset to area default
                  </button>
                </div>
                <input
                  type="text"
                  value={destAddress}
                  onChange={(e) => handleDestAddressChange(e.target.value)}
                  placeholder="Specific mine site, plant, or warehouse address"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-[11px] text-emerald-200 focus:outline-none focus:border-emerald-400"
                />
                {supplier?.address && supplier.address !== destAddress && (
                  <button
                    type="button"
                    onClick={() => handleDestAddressChange(supplier.address!)}
                    className="text-[10px] text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Use contact's registered location:</span>
                    <strong className="text-slate-200 truncate max-w-xs">{supplier.address}</strong>
                  </button>
                )}
              </div>
            </div>

            {/* Recipient Details & Contacts */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isCustomer ? 'Target Buyer Organization' : 'Target Supplier / Vendor'}
                </span>
                {cleanWaNumber && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    WhatsApp Ready
                  </span>
                )}
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Company / Recipient Name</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Organization / Company Name"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Email</label>
                  <input
                    type="email"
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                    placeholder="sales@company.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={supplierWhatsapp || supplierPhone}
                    onChange={(e) => {
                      setSupplierWhatsapp(e.target.value);
                      setSupplierPhone(e.target.value);
                    }}
                    placeholder="+27 11 830 4400"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300"
                  />
                </div>
              </div>

              {/* Direct Contact Links */}
              <div className="flex items-center gap-1.5 pt-1">
                {supplierEmail && (
                  <a
                    href={`mailto:${supplierEmail}`}
                    className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-semibold flex items-center gap-1 hover:bg-sky-500/20"
                  >
                    <Mail className="w-2.5 h-2.5" />
                    <span>Email: {supplierEmail.split('@')[0]}</span>
                  </a>
                )}
                {supplierPhone && (
                  <a
                    href={`tel:${supplierPhone.replace(/[^\d+]/g, '')}`}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold flex items-center gap-1 hover:bg-slate-700"
                  >
                    <Phone className="w-2.5 h-2.5 text-amber-400" />
                    <span>Call</span>
                  </a>
                )}
                {cleanWaNumber && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-600/50"
                  >
                    <MessageSquare className="w-2.5 h-2.5 fill-current" />
                    <span>WhatsApp (+{cleanWaNumber})</span>
                  </a>
                )}
              </div>
            </div>

            {/* Product & Quantity */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Product Required *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. 1.8 m Mining Barrier Cones"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Quantity *
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 8"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            {/* Technical Specifications Text Area */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Required Specifications (1 per line)
              </label>
              <textarea
                value={specificationsText}
                onChange={(e) => setSpecificationsText(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Custom Sender Signature */}
            <div>
              <label className="text-[11px] font-semibold text-amber-300 flex items-center justify-between mb-1">
                <span>Sender Signature / Sign-Off</span>
                <span className="text-[10px] text-slate-400">(Saved to browser)</span>
              </label>
              <textarea
                value={senderSignature}
                onChange={(e) => handleSignatureChange(e.target.value)}
                rows={2}
                placeholder="Kind regards,\nHanekom Innovations Limited."
                className="w-full bg-slate-950 border border-amber-400/40 rounded-xl p-2 text-xs text-amber-200 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Polish / AI Generate Button */}
            <button
              type="button"
              onClick={handleGenerateAiEmail}
              disabled={isGenerating || !productName.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Generating 5 Route-Aware Email Templates...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Regenerate 5 Email Options with AI</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: 5 Selectable Email Options & Live Preview & Dispatch (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3.5">
            {/* 5 Distinct Email Choices Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>5 Selectable Email Templates ({isCustomer ? 'Client Pitch' : 'Supplier RFQ'})</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Click any template to load &amp; customize
                </span>
              </div>

              {/* 5 Email Option Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                {(emailOptions.length > 0 ? emailOptions : [1, 2, 3, 4, 5]).map((opt: any, idx: number) => {
                  const isSelected = selectedEmailIndex === idx;
                  const title = opt.title || `Email ${idx + 1}`;
                  const tag = opt.tag || ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'][idx];

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectEmailOption(idx)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-400/20 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${isSelected ? 'text-amber-300' : 'text-slate-500'}`}>
                            {tag}
                          </span>
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" />}
                        </div>
                        <div className="text-xs font-bold line-clamp-1 text-slate-100">
                          {title.replace(/^\d+\.\s*/, '')}
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-500 line-clamp-1 mt-1">
                        {opt.angle || 'Outreach template'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email Preview Header & Channel Switcher */}
            <div className="flex items-center justify-between pt-1">
              {/* Tab Selector: Email vs WhatsApp */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('email')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activePreviewTab === 'email'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Format</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab('whatsapp')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    activePreviewTab === 'whatsapp'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Message</span>
                </button>
              </div>

              {/* Copy Action */}
              <button
                type="button"
                onClick={() => handleCopy(activePreviewTab === 'email' ? body : whatsappSummary, activePreviewTab === 'email' ? 'body' : 'whatsapp')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedType === (activePreviewTab === 'email' ? 'body' : 'whatsapp') ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            {/* Email Subject Line Bar */}
            {activePreviewTab === 'email' && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                    Subject:
                  </span>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-amber-300 w-full focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(subject, 'subject')}
                  className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                  title="Copy subject line"
                >
                  {copiedType === 'subject' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Editable Content Preview Box */}
            <div className="flex-1 min-h-[260px] flex flex-col bg-slate-950 rounded-2xl border border-slate-800 p-4 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1">
                <Edit3 className="w-3 h-3" />
                <span>Editable Preview – Option {selectedEmailIndex + 1} (Directly tweak any line before sending)</span>
              </span>

              {activePreviewTab === 'email' ? (
                <textarea
                  value={body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  rows={13}
                  className="w-full flex-1 bg-transparent text-xs text-slate-200 font-mono leading-relaxed resize-none focus:outline-none"
                />
              ) : (
                <textarea
                  value={whatsappSummary}
                  onChange={(e) => setWhatsappSummary(e.target.value)}
                  rows={8}
                  className="w-full flex-1 bg-transparent text-xs text-emerald-300 font-mono leading-relaxed resize-none focus:outline-none"
                />
              )}
            </div>

            {/* Dispatch Action Buttons (Email, Gmail, WhatsApp Direct) */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Send Option {selectedEmailIndex + 1} ({emailOptions[selectedEmailIndex]?.title || 'Selected Draft'})
                </span>
                {cleanWaNumber && (
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    Recipient WhatsApp: +{cleanWaNumber}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. Direct WhatsApp Button */}
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm hover:shadow-emerald-500/20 cursor-pointer"
                  title={cleanWaNumber ? `Open WhatsApp chat directly with +${cleanWaNumber}` : 'Open WhatsApp chat'}
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-current" />
                  <span>WhatsApp {cleanWaNumber ? `(+${cleanWaNumber.slice(-4)})` : ''}</span>
                </button>

                {/* 2. Default Mailto */}
                <button
                  type="button"
                  onClick={handleOpenMailto}
                  className="py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow cursor-pointer"
                  title="Open in your default mail application"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via Mail</span>
                </button>

                {/* 3. Open in Gmail */}
                <button
                  type="button"
                  onClick={handleOpenGmail}
                  className="py-2.5 px-3 bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow cursor-pointer"
                  title="Compose directly in Gmail Web"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Gmail Web</span>
                </button>

                {/* 4. Download .eml file */}
                <button
                  type="button"
                  onClick={handleDownloadEml}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Download as RFC-822 .eml draft file"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save .eml</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-900">
                <span>Route: <strong className="text-amber-300">{originCity}</strong> ➔ <strong className="text-emerald-300">{destCity}</strong></span>
                <span>Signed: <strong className="text-slate-400">{senderSignature.replace(/\n/g, ' ')}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
