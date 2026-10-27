import React from 'react';
import { X, Sliders, Volume2, Eye, Type, Sparkles } from 'lucide-react';
import { AccessibilitySettings } from '../types';
import { soundManager } from '../utils/audioCues';

interface AccessibilitySettingsModalProps {
  isOpen: boolean;
  settings: AccessibilitySettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
}

export const AccessibilitySettingsModal: React.FC<AccessibilitySettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400/10 text-amber-400 rounded-xl border border-amber-400/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Accessibility Preferences</h2>
              <p className="text-xs text-slate-400">Personalize contrast, typography, and audio cues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Contrast Theme */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Contrast &amp; Color Scheme</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'dark', label: 'Dark Slate' },
              { id: 'high-contrast', label: 'Max Contrast' },
              { id: 'yellow-on-black', label: 'Yellow on Black' },
              { id: 'light', label: 'Crisp Light' },
            ].map((theme) => (
              <button
                key={theme.id}
                onClick={() => onUpdateSettings({ theme: theme.id as any })}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  settings.theme === theme.id
                    ? 'border-amber-400 bg-amber-400/20 text-amber-300 ring-2 ring-amber-400/40'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Screen Filter Overlays */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Screen Viewport Filter
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'none', label: 'Normal' },
              { id: 'high-contrast', label: 'High Contrast' },
              { id: 'invert', label: 'Inverted' },
              { id: 'grayscale', label: 'Grayscale' },
              { id: 'night-amber', label: 'Night Amber' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => onUpdateSettings({ visualFilter: filter.id as any })}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                  settings.visualFilter === filter.id
                    ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Size & Dyslexia Font */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Type className="w-4 h-4 text-amber-400" />
            <span>Typography</span>
          </label>
          <div className="flex gap-2">
            {[
              { id: 'normal', label: 'Standard Text' },
              { id: 'large', label: 'Large Text (120%)' },
              { id: 'huge', label: 'Extra Large (140%)' },
            ].map((size) => (
              <button
                key={size.id}
                onClick={() => onUpdateSettings({ fontSize: size.id as any })}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  settings.fontSize === size.id
                    ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.dyslexicFont}
              onChange={(e) => onUpdateSettings({ dyslexicFont: e.target.checked })}
              className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400"
            />
            <span className="text-xs font-medium text-slate-200">
              Enable Atkinson Hyperlegible high-readability font
            </span>
          </label>
        </div>

        {/* Audio Earcons & Cues */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Acoustic Feedback (Earcons)</span>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.soundCuesEnabled}
              onChange={(e) => {
                onUpdateSettings({ soundCuesEnabled: e.target.checked });
                soundManager.setEnabled(e.target.checked);
                if (e.target.checked) soundManager.playScanComplete();
              }}
              className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400"
            />
            <span className="text-xs font-medium text-slate-200">
              Play acoustic sound cues on scan, element focus, and task completion
            </span>
          </label>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Auto-Scan Interval:</span>
            <select
              value={settings.autoScanInterval}
              onChange={(e) => onUpdateSettings({ autoScanInterval: parseInt(e.target.value, 10) })}
              className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-100"
            >
              <option value={0}>Manual Only (Press Space or Click)</option>
              <option value={5}>Every 5 Seconds (Continuous)</option>
              <option value={10}>Every 10 Seconds</option>
              <option value={15}>Every 15 Seconds</option>
            </select>
          </div>
        </div>

        {/* Gemini AI Model Selection */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Default Gemini AI Model</span>
            </span>
            <span className="text-[10px] text-purple-300 font-mono bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/20">
              {settings.preferredModel || 'gemini-3.8-flash'}
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', tag: 'Recommended' },
              { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', tag: 'Grounding' },
              { id: 'gemini-3.1-flash-lite', label: '3.1 Flash Lite', tag: 'Ultra-Fast' },
              { id: 'gemini-flash-latest', label: 'Flash Latest', tag: 'Auto-Update' },
              { id: 'gemini-3.1-pro-preview', label: '3.1 Pro Preview', tag: 'Reasoning' },
              { id: 'gemini-4-argon', label: 'Gemini 4 Argon', tag: 'Flagship STEM' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => onUpdateSettings({ preferredModel: m.id })}
                className={`py-2 px-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                  (settings.preferredModel || 'gemini-3.8-flash') === m.id
                    ? 'border-purple-400 bg-purple-500/20 text-purple-200 ring-2 ring-purple-400/30'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-bold text-white">{m.label}</span>
                <span className="text-[10px] text-purple-400/90 font-medium">{m.tag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
