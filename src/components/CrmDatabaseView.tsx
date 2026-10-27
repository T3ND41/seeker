import React, { useState } from 'react';
import {
  CrmEntity,
  PipelineStage,
  LeadScore,
  ResponseSentiment,
  ResaleOpportunity,
} from '../types';
import {
  Users,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Search,
  Filter,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  Upload,
  Calendar,
  DollarSign,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Tag,
  Briefcase,
  Layers,
  ChevronRight,
  Award,
  Zap,
  MessageSquare,
  Sliders,
} from 'lucide-react';
import { soundManager } from '../utils/audioCues';
import { buildWhatsAppLink, sanitizeWhatsAppNumber } from '../utils/contactUtils';

interface CrmDatabaseViewProps {
  entities: CrmEntity[];
  onUpdateEntity: (entity: CrmEntity) => void;
  onDeleteEntity: (id: string) => void;
  onOpenNegotiation: (entity: CrmEntity) => void;
  onOpenRfq: (entity: CrmEntity) => void;
  resaleOpportunities: ResaleOpportunity[];
}

export const CrmDatabaseView: React.FC<CrmDatabaseViewProps> = ({
  entities,
  onUpdateEntity,
  onDeleteEntity,
  onOpenNegotiation,
  onOpenRfq,
  resaleOpportunities,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'supplier' | 'customer'>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal for New / Edit Entity
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<CrmEntity | null>(null);

  // New Entity Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'supplier' | 'customer'>('supplier');
  const [formCategory, setFormCategory] = useState('');
  const [formIndustry, setFormIndustry] = useState('');
  const [formCountry, setFormCountry] = useState('South Africa');
  const [formCity, setFormCity] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formContactRole, setFormContactRole] = useState('Sales / Commercial Manager');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formProducts, setFormProducts] = useState('');
  const [formStage, setFormStage] = useState<PipelineStage>('Discovered');
  const [formScore, setFormScore] = useState<LeadScore>('Strong Lead');
  const [formInitialPrice, setFormInitialPrice] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formNotes, setFormNotes] = useState('');

  const openNewModal = () => {
    setEditingEntity(null);
    setFormName('');
    setFormType('supplier');
    setFormCategory('Wholesale Equipment');
    setFormIndustry('Mining & Industrial');
    setFormCountry('South Africa');
    setFormCity('Johannesburg');
    setFormWebsite('');
    setFormContactName('');
    setFormContactRole('Sales & Commercial Contact');
    setFormContactEmail('');
    setFormContactPhone('');
    setFormProducts('1.8m Mining Barrier Cones');
    setFormStage('Discovered');
    setFormScore('Strong Lead');
    setFormInitialPrice('');
    setFormCurrency('USD');
    setFormNotes('');
    setIsEditModalOpen(true);
  };

  const openEditModal = (entity: CrmEntity) => {
    setEditingEntity(entity);
    setFormName(entity.name);
    setFormType(entity.entityType);
    setFormCategory(entity.category);
    setFormIndustry(entity.industry);
    setFormCountry(entity.location.country);
    setFormCity(entity.location.area);
    setFormWebsite(entity.website || '');
    const firstContact = entity.contactPersons[0];
    setFormContactName(firstContact?.name || '');
    setFormContactRole(firstContact?.role || 'Commercial Manager');
    setFormContactEmail(firstContact?.email || '');
    setFormContactPhone(firstContact?.phone || firstContact?.whatsapp || '');
    setFormProducts(entity.productsOrNeeds.join(', '));
    setFormStage(entity.pipelineStage);
    setFormScore(entity.leadScore);
    setFormInitialPrice(entity.initialQuotePrice ? String(entity.initialQuotePrice) : '');
    setFormCurrency(entity.currency || 'USD');
    setFormNotes(entity.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const contactPersons = formContactName.trim()
      ? [
          {
            id: editingEntity?.contactPersons[0]?.id || `cp-${Date.now()}`,
            name: formContactName.trim(),
            role: formContactRole.trim(),
            email: formContactEmail.trim() || undefined,
            phone: formContactPhone.trim() || undefined,
            whatsapp: formContactPhone.trim() || undefined,
          },
        ]
      : editingEntity?.contactPersons || [];

    const productsList = formProducts
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const priceNum = formInitialPrice ? parseFloat(formInitialPrice) : undefined;

    const updated: CrmEntity = {
      id: editingEntity ? editingEntity.id : `crm-${Date.now()}`,
      entityType: formType,
      name: formName.trim(),
      category: formCategory.trim() || 'General Business',
      industry: formIndustry.trim() || 'Industrial',
      location: {
        country: formCountry.trim(),
        province: editingEntity?.location.province || '',
        area: formCity.trim(),
      },
      website: formWebsite.trim() || undefined,
      description: editingEntity?.description || `${formCategory} provider in ${formCountry}`,
      contactPersons,
      pipelineStage: formStage,
      leadScore: formScore,
      verificationScore: editingEntity?.verificationScore || 85,
      productsOrNeeds: productsList,
      tags: editingEntity?.tags || [formIndustry],
      notes: formNotes.trim(),
      currency: formCurrency,
      initialQuotePrice: priceNum || editingEntity?.initialQuotePrice,
      currentQuotePrice: priceNum || editingEntity?.currentQuotePrice,
      targetPrice: editingEntity?.targetPrice || (priceNum ? priceNum * 0.88 : undefined),
      concessionsObtained: editingEntity?.concessionsObtained || [],
      totalSavingsAchieved: editingEntity?.totalSavingsAchieved || 0,
      savingsPercentage: editingEntity?.savingsPercentage || 0,
      negotiationRounds: editingEntity?.negotiationRounds || [],
      createdAt: editingEntity?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onUpdateEntity(updated);
    setIsEditModalOpen(false);
    soundManager.playStepSuccess();
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (entities.length === 0) return;
    const headers = [
      'Type',
      'Company Name',
      'Category',
      'Industry',
      'Country',
      'Area',
      'Pipeline Stage',
      'Lead Score',
      'Primary Contact',
      'Contact Role',
      'Email',
      'Phone',
      'Initial Price',
      'Current Price',
      'Total Savings',
      'Products',
    ];

    const rows = entities.map((e) => {
      const c = e.contactPersons[0];
      return [
        `"${e.entityType}"`,
        `"${e.name.replace(/"/g, '""')}"`,
        `"${e.category.replace(/"/g, '""')}"`,
        `"${e.industry.replace(/"/g, '""')}"`,
        `"${e.location.country.replace(/"/g, '""')}"`,
        `"${e.location.area.replace(/"/g, '""')}"`,
        `"${e.pipelineStage}"`,
        `"${e.leadScore}"`,
        `"${(c?.name || '').replace(/"/g, '""')}"`,
        `"${(c?.role || '').replace(/"/g, '""')}"`,
        `"${(c?.email || '').replace(/"/g, '""')}"`,
        `"${(c?.phone || '').replace(/"/g, '""')}"`,
        `"${e.initialQuotePrice || ''}"`,
        `"${e.currentQuotePrice || ''}"`,
        `"${e.totalSavingsAchieved || 0}"`,
        `"${(e.productsOrNeeds || []).join('; ').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `CRM_Procurement_Contacts_${Date.now()}.csv`;
    link.click();
  };

  // Filter entities
  const filteredEntities = entities.filter((e) => {
    if (typeFilter !== 'all' && e.entityType !== typeFilter) return false;
    if (stageFilter !== 'all' && e.pipelineStage !== stageFilter) return false;
    if (scoreFilter !== 'all' && e.leadScore !== scoreFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = e.name.toLowerCase().includes(q);
      const matchLoc = e.location.country.toLowerCase().includes(q) || e.location.area.toLowerCase().includes(q);
      const matchProd = e.productsOrNeeds.some((p) => p.toLowerCase().includes(q));
      const matchContact = e.contactPersons.some(
        (c) => c.name.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q))
      );
      if (!matchName && !matchLoc && !matchProd && !matchContact) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                Commercial Procurement &amp; Lead CRM Database
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {entities.length} Contacts Tracked
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Permanent repository of verified suppliers, customer buyer leads, pricing intelligence, and negotiation records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openNewModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact / Lead</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={entities.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 transition disabled:opacity-50"
            title="Export CRM database to CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Resale Arbitrage Alerts Banner if matches exist */}
      {resaleOpportunities.length > 0 && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-400/20 text-emerald-300">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-300">
                Commercial Resale Loop Alert: {resaleOpportunities.length} Match Found!
              </span>
              <p className="text-[11px] text-emerald-400/80">
                Low-cost supplier matches active buyer requirement in your CRM (Projected gross margins: {resaleOpportunities[0].grossMarginPercent}%)
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Reseller Opportunity
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company, contact, country, or product..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Entity Type Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
              typeFilter === 'all' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({entities.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('supplier')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
              typeFilter === 'supplier' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Suppliers ({entities.filter((e) => e.entityType === 'supplier').length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('customer')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
              typeFilter === 'customer' ? 'bg-sky-400 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Customers ({entities.filter((e) => e.entityType === 'customer').length})
          </button>
        </div>

        {/* Pipeline Stage Select */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Stage:</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Stages</option>
            <option value="Discovered">Discovered</option>
            <option value="Researching">Researching</option>
            <option value="Verified">Verified</option>
            <option value="Qualified">Qualified</option>
            <option value="Contact Ready">Contact Ready</option>
            <option value="Contacted">Contacted</option>
            <option value="Replied">Replied</option>
            <option value="Interested">Interested</option>
            <option value="Quotation Requested">Quotation Requested</option>
            <option value="Opportunity">Opportunity</option>
            <option value="Negotiating">Negotiating</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        {/* Lead Score Select */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Score:</span>
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Scores</option>
            <option value="Hot Lead">Hot Lead</option>
            <option value="Strong Lead">Strong Lead</option>
            <option value="Possible Lead">Possible Lead</option>
            <option value="Low Priority">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Contacts List Grid */}
      {filteredEntities.length === 0 ? (
        <div className="p-12 text-center bg-slate-950 border border-dashed border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-300">No CRM Contacts Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Add contacts manually or search for suppliers and leads using the Sourcing tool to auto-populate your CRM.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewModal}
            className="mt-2 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow transition"
          >
            Add New Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntities.map((entity) => {
            const isSupplier = entity.entityType === 'supplier';
            const primaryContact = entity.contactPersons[0];
            const hasRounds = entity.negotiationRounds && entity.negotiationRounds.length > 0;

            return (
              <div
                key={entity.id}
                className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between space-y-3 transition shadow-sm"
              >
                <div className="space-y-2.5">
                  {/* Top Badge Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isSupplier
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-sky-400/20 text-sky-300 border border-sky-400/30'
                          }`}
                        >
                          {isSupplier ? '🏭 Supplier' : '👥 Customer'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300">
                          {entity.pipelineStage}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{entity.name}</h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        entity.leadScore === 'Hot Lead'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : entity.leadScore === 'Strong Lead'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {entity.leadScore}
                    </span>
                  </div>

                  {/* Industry & Location */}
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>
                      {entity.location.area ? `${entity.location.area}, ` : ''}
                      {entity.location.country}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="truncate">{entity.industry}</span>
                  </div>

                  {/* Primary Contact Person if found */}
                  {primaryContact && (
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between text-slate-200 font-semibold">
                        <span>{primaryContact.name}</span>
                        <span className="text-slate-400 text-[10px]">{primaryContact.role}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] flex-wrap">
                        {primaryContact.email && (
                          <a
                            href={`mailto:${primaryContact.email}`}
                            className="flex items-center gap-1 text-sky-400 hover:underline"
                            title={`Send email to ${primaryContact.email}`}
                          >
                            <Mail className="w-3 h-3 text-sky-400" />
                            <span className="truncate max-w-[130px]">{primaryContact.email}</span>
                          </a>
                        )}
                        {primaryContact.phone && (
                          <a
                            href={`tel:${primaryContact.phone.replace(/[^\d+]/g, '')}`}
                            className="flex items-center gap-1 text-slate-300 hover:text-white"
                            title={`Call ${primaryContact.phone}`}
                          >
                            <Phone className="w-3 h-3 text-amber-400" />
                            <span>{primaryContact.phone}</span>
                          </a>
                        )}
                        {(primaryContact.whatsapp || primaryContact.phone) && (
                          <a
                            href={buildWhatsAppLink(
                              primaryContact.whatsapp || primaryContact.phone || '',
                              `Hello ${primaryContact.name}, following up regarding our commercial requirements with ${entity.name}.`,
                              entity.location.country
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 text-[10px] font-bold"
                            title={`Direct WhatsApp chat with ${primaryContact.name}`}
                          >
                            <MessageSquare className="w-2.5 h-2.5 fill-current" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pricing and Negotiation Intelligence Card */}
                  {isSupplier && (entity.initialQuotePrice || entity.currentQuotePrice) && (
                    <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Current Quote:</span>
                        <span className="font-bold text-amber-300">
                          {entity.currency || 'USD'} {entity.currentQuotePrice}
                        </span>
                      </div>
                      {entity.totalSavingsAchieved > 0 && (
                        <div className="flex items-center justify-between text-emerald-400 font-semibold text-[10px]">
                          <span>Negotiated Savings:</span>
                          <span>
                            -{entity.currency || 'USD'} {entity.totalSavingsAchieved} ({entity.savingsPercentage}%)
                          </span>
                        </div>
                      )}
                      {entity.targetPrice && (
                        <div className="flex items-center justify-between text-slate-500 text-[10px]">
                          <span>Target Floor:</span>
                          <span>
                            {entity.currency || 'USD'} {entity.targetPrice}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Concessions Count Badge */}
                  {entity.concessionsObtained?.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <Award className="w-3 h-3" />
                      <span>{entity.concessionsObtained.length} Commercial Concessions Secured</span>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-2.5 border-t border-slate-900 flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    {/* Action 1: Negotiate (for suppliers) */}
                    {isSupplier && (
                      <button
                        type="button"
                        onClick={() => onOpenNegotiation(entity)}
                        className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-semibold flex items-center gap-1 transition"
                        title="Open AI Multi-Round Negotiation Workbench"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Negotiate</span>
                      </button>
                    )}

                    {/* Action 2: RFQ Email */}
                    <button
                      type="button"
                      onClick={() => onOpenRfq(entity)}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1 transition"
                      title="Compose RFQ or sales outreach email"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(entity)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Edit contact details"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteEntity(entity.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                      title="Delete from CRM"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / New Contact Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingEntity ? 'Edit Contact & Commercial Details' : 'Add New CRM Contact / Organization'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntity} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="e.g. Atlas Safety Equipment Ltd"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Entity Type</label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="supplier">🏭 Supplier / Manufacturer</option>
                    <option value="customer">👥 Customer / Commercial Buyer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Industry</label>
                  <input
                    type="text"
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                    placeholder="e.g. Mining & Heavy PPE"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Country</label>
                  <input
                    type="text"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    placeholder="e.g. South Africa, Zambia"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">City / Area</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. Johannesburg, Ndola"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Contact Person Details */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-amber-400 block uppercase tracking-wider">
                  Contact Person Information
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">Contact Name</label>
                    <input
                      type="text"
                      value={formContactName}
                      onChange={(e) => setFormContactName(e.target.value)}
                      placeholder="e.g. David Van Der Merwe"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">Job Role / Title</label>
                    <input
                      type="text"
                      value={formContactRole}
                      onChange={(e) => setFormContactRole(e.target.value)}
                      placeholder="e.g. Sales Manager / Procurement"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">Email</label>
                    <input
                      type="email"
                      value={formContactEmail}
                      onChange={(e) => setFormContactEmail(e.target.value)}
                      placeholder="sales@supplier.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={formContactPhone}
                      onChange={(e) => setFormContactPhone(e.target.value)}
                      placeholder="+27 11 000 0000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Products and Commercials */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Products / Categories</label>
                  <input
                    type="text"
                    value={formProducts}
                    onChange={(e) => setFormProducts(e.target.value)}
                    placeholder="e.g. 1.8m Mining Cones, Road Barriers, PPE"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Pipeline Stage</label>
                  <select
                    value={formStage}
                    onChange={(e: any) => setFormStage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="Discovered">Discovered</option>
                    <option value="Researching">Researching</option>
                    <option value="Verified">Verified</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Contact Ready">Contact Ready</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Quotation Requested">Quotation Requested</option>
                    <option value="Negotiating">Negotiating</option>
                    <option value="Won">Won</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Quote Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formInitialPrice}
                    onChange={(e) => setFormInitialPrice(e.target.value)}
                    placeholder="1250.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Currency</label>
                  <input
                    type="text"
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    placeholder="USD or ZAR"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Lead Score</label>
                  <select
                    value={formScore}
                    onChange={(e: any) => setFormScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="Hot Lead">Hot Lead</option>
                    <option value="Strong Lead">Strong Lead</option>
                    <option value="Possible Lead">Possible Lead</option>
                    <option value="Low Priority">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Notes / Commercial Intel</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Supplier mentioned discounts available for orders over 500 units; open to Net 30 terms on repeat orders."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow"
                >
                  Save to CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
