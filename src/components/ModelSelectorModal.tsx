import React, { useState } from 'react';
import {
  X,
  Cpu,
  Zap,
  Sparkles,
  Check,
  Search,
  ExternalLink,
  ShieldCheck,
  Sliders,
  ChevronRight,
  Info,
} from 'lucide-react';
import { AvailableModelInfo, ModelChoice } from '../types';
import { SUPPORTED_MODELS } from '../services/api';

interface ModelSelectorModalProps {
  isOpen: boolean;
  currentModel: string;
  onSelectModel: (modelId: string) => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  currentModel,
  onSelectModel,
  onClose,
  title = 'Select Gemini AI Model',
  description = 'Choose the AI model engine powering deep search, sourcing extraction, email generation, and commercial intelligence.',
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [customModelInput, setCustomModelInput] = useState<string>(
    SUPPORTED_MODELS.some((m) => m.id === currentModel) ? '' : currentModel
  );
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const filteredModels = SUPPORTED_MODELS.filter((m) => {
    const q = searchFilter.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  });

  const handleApplyCustom = () => {
    const trimmed = customModelInput.trim();
    if (trimmed) {
      onSelectModel(trimmed);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-400/20 font-black">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  Active: {currentModel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch & Search */}
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('preset')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'preset'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Models ({SUPPORTED_MODELS.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'custom'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom Model ID</span>
            </button>
          </div>

          {activeTab === 'preset' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter models..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {activeTab === 'preset' ? (
            <div className="space-y-3">
              {filteredModels.map((m) => {
                const isSelected = currentModel === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m.id);
                      onClose();
                    }}
                    className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/30'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                            {m.name}
                          </span>
                          <code className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                            {m.id}
                          </code>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.badgeColor}`}
                          >
                            {m.category}
                          </span>
                          {m.id === 'gemini-3.8-flash' && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ★ Recommended
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1 font-medium">
                            <span>Speed:</span>
                            <span className="text-slate-200 font-semibold">{m.speed}</span>
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400 flex items-center gap-1 font-medium">
                            <span>Window:</span>
                            <span className="text-slate-200 font-semibold">{m.contextWindow}</span>
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-amber-400/90 font-medium">
                            {m.recommendedFor}
                          </span>
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {m.features.map((feat) => (
                            <span
                              key={feat}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-900/80 text-slate-400 border border-slate-800"
                            >
                              {feat}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 pt-1">
                        {isSelected ? (
                          <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-400/20">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full border border-slate-700 group-hover:border-amber-400/60 flex items-center justify-center text-slate-500 group-hover:text-amber-300 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredModels.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No models matching "{searchFilter}". Try switching to the "Custom Model ID" tab.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Info className="w-4 h-4" />
                  <span>Use Any Custom or Experimental Gemini Model</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter any official model name or specialized preview tag (e.g.,{' '}
                  <code className="text-amber-300 font-mono">gemini-3.8-flash</code>,{' '}
                  <code className="text-amber-300 font-mono">gemini-3.5-flash</code>,{' '}
                  <code className="text-amber-300 font-mono">gemini-3.1-pro-preview</code>,{' '}
                  <code className="text-amber-300 font-mono">gemini-4-argon</code>, or your fine-tuned/enterprise model checkpoint).
                </p>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-200">Custom Model Identifier:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customModelInput}
                      onChange={(e) => setCustomModelInput(e.target.value)}
                      placeholder="e.g. gemini-3.8-flash or gemini-3.1-pro-preview"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      onClick={handleApplyCustom}
                      disabled={!customModelInput.trim()}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-[11px] text-slate-400">
                    Quick suggestions to try:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'gemini-3.8-flash',
                      'gemini-3.5-flash',
                      'gemini-3.1-flash-lite',
                      'gemini-flash-latest',
                      'gemini-3.1-pro-preview',
                      'gemini-4-argon',
                    ].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setCustomModelInput(m)}
                        className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Automatic cascade fallback ensures zero downtime</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
