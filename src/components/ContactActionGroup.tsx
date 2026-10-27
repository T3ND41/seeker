import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Copy, Check, ExternalLink, ChevronDown } from 'lucide-react';
import { buildWhatsAppLink, sanitizeWhatsAppNumber, formatDisplayPhone } from '../utils/contactUtils';
import { soundManager } from '../utils/audioCues';

interface ContactActionGroupProps {
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  country?: string;
  category?: string;
  suggestedOutreach?: string;
  onOpenEmailComposer?: () => void;
  variant?: 'compact' | 'expanded' | 'full';
}

export const ContactActionGroup: React.FC<ContactActionGroupProps> = ({
  name,
  email,
  phone,
  whatsapp,
  website,
  country = 'South Africa',
  category = 'Industrial Goods',
  suggestedOutreach,
  onOpenEmailComposer,
  variant = 'compact',
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isOpenMenu, setIsOpenMenu] = useState(false);

  // Derive active phone and whatsapp numbers
  const effectivePhone = phone || (whatsapp ? whatsapp : '');
  const effectiveWhatsApp = whatsapp || phone || '';
  const effectiveEmail = email || (website ? `info@${website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}` : '');

  // Pre-configured WhatsApp intro pitch
  const whatsappIntroMessage = suggestedOutreach
    ? `Hello ${name}, I am reaching out regarding ${category}. ${suggestedOutreach}`
    : `Hello ${name}, I am interested in sourcing ${category} and would like to request product pricing and specifications.`;

  const waLink = effectiveWhatsApp
    ? buildWhatsAppLink(effectiveWhatsApp, whatsappIntroMessage, country)
    : '#';

  const handleCopy = (e: React.MouseEvent, text: string, type: string) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
      soundManager.playTargetLocated();
    } catch {}
  };

  const cleanWaNumber = sanitizeWhatsAppNumber(effectiveWhatsApp, country);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Email Button */}
        {effectiveEmail ? (
          <a
            href={`mailto:${effectiveEmail}?subject=${encodeURIComponent(`Inquiry regarding ${category} - ${name}`)}`}
            onClick={(e) => {
              if (onOpenEmailComposer) {
                e.preventDefault();
                onOpenEmailComposer();
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            title={`Email ${effectiveEmail} (Click to compose)`}
          >
            <Mail className="w-3.5 h-3.5 text-sky-400" />
            <span>Email</span>
          </a>
        ) : null}

        {/* Phone Button */}
        {effectivePhone ? (
          <a
            href={`tel:${effectivePhone.replace(/[^\d+]/g, '')}`}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition"
            title={`Call ${effectivePhone}`}
          >
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            <span className="max-w-[110px] truncate">{formatDisplayPhone(effectivePhone)}</span>
          </a>
        ) : null}

        {/* WhatsApp Button */}
        {effectiveWhatsApp ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundManager.playStepSuccess()}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm hover:shadow-emerald-500/20"
            title={`Direct WhatsApp Chat: +${cleanWaNumber}`}
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            <span>WhatsApp</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-600 text-xs flex items-center gap-1 cursor-not-allowed"
            title="WhatsApp number not publicly listed"
          >
            <MessageSquare className="w-3 h-3" />
            <span>No WA</span>
          </button>
        )}
      </div>
    );
  }

  // Expanded Variant with full details and copy controls
  return (
    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-amber-400" />
          <span>Direct Organization Contacts</span>
        </span>
        {cleanWaNumber && (
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            WhatsApp Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* 1. Email Button */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
          <a
            href={`mailto:${effectiveEmail}?subject=${encodeURIComponent(`Inquiry for ${name}`)}`}
            onClick={(e) => {
              if (onOpenEmailComposer) {
                e.preventDefault();
                onOpenEmailComposer();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold truncate flex-1"
            title={`Send email to ${effectiveEmail}`}
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{effectiveEmail || 'No Email Listed'}</span>
          </a>
          {effectiveEmail && (
            <button
              onClick={(e) => handleCopy(e, effectiveEmail, 'email')}
              className="p-1 text-slate-500 hover:text-slate-300"
              title="Copy email"
            >
              {copiedType === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* 2. Phone Button */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
          <a
            href={`tel:${effectivePhone ? effectivePhone.replace(/[^\d+]/g, '') : ''}`}
            className="flex items-center gap-1.5 text-xs text-slate-200 hover:text-white font-semibold truncate flex-1"
            title={`Call ${effectivePhone}`}
          >
            <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{effectivePhone || 'No Phone Listed'}</span>
          </a>
          {effectivePhone && (
            <button
              onClick={(e) => handleCopy(e, effectivePhone, 'phone')}
              className="p-1 text-slate-500 hover:text-slate-300"
              title="Copy phone number"
            >
              {copiedType === 'phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* 3. WhatsApp Direct Button */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundManager.playStepSuccess()}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold truncate flex-1"
            title={`Open WhatsApp chat with ${effectiveWhatsApp}`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400 fill-current shrink-0" />
            <span className="truncate">WhatsApp (+{cleanWaNumber})</span>
            <ExternalLink className="w-3 h-3 shrink-0 ml-0.5" />
          </a>
          {effectiveWhatsApp && (
            <button
              onClick={(e) => handleCopy(e, cleanWaNumber, 'wa')}
              className="p-1 text-emerald-500 hover:text-emerald-300"
              title="Copy WhatsApp number"
            >
              {copiedType === 'wa' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
