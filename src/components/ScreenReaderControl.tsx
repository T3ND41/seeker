import React from 'react';
import { Volume2, VolumeX, Play, Square, Settings2, Sparkles, FastForward } from 'lucide-react';
import { AccessibilitySettings } from '../types';

interface ScreenReaderControlProps {
  isSpeaking: boolean;
  transcript: string;
  summary: string;
  settings: AccessibilitySettings;
  onSpeak: (text: string) => void;
  onStop: () => void;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
}

export const ScreenReaderControl: React.FC<ScreenReaderControlProps> = ({
  isSpeaking,
  transcript,
  summary,
  settings,
  onSpeak,
  onStop,
  onUpdateSettings,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Screen Narration</h2>
            <p className="text-xs text-slate-400">
              {settings.voiceEngine === 'gemini'
                ? `Gemini 3.8 Natural Voice (${settings.geminiVoice})`
                : 'Native Browser Speech'}
            </p>
          </div>
        </div>

        {/* Play / Stop Button */}
        {isSpeaking ? (
          <button
            onClick={onStop}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg animate-pulse"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Stop Speaking</span>
          </button>
        ) : (
          <button
            onClick={() => onSpeak(summary || 'No screen summary available yet. Please scan a screen.')}
            disabled={!summary}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow-md"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Read Screen</span>
          </button>
        )}
      </div>

      {/* Spoken Transcript Area */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
          Screen Reader Transcript
        </span>
        <p className="text-sm text-slate-200 leading-relaxed font-sans min-h-[48px]">
          {transcript || summary || 'Screen overview will appear here once analyzed.'}
        </p>
      </div>

      {/* Voice Engine & Speed Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Voice Mode Toggle */}
        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300">Voice Engine:</span>
          <div className="flex gap-1">
            <button
              onClick={() => onUpdateSettings({ voiceEngine: 'gemini' })}
              className={`px-2 py-1 text-xs rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                settings.voiceEngine === 'gemini'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Gemini AI</span>
            </button>
            <button
              onClick={() => onUpdateSettings({ voiceEngine: 'browser' })}
              className={`px-2 py-1 text-xs rounded-lg font-semibold transition-colors ${
                settings.voiceEngine === 'browser'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Browser
            </button>
          </div>
        </div>

        {/* Speed Selection */}
        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300">Speaking Speed:</span>
          <div className="flex gap-1">
            {[0.8, 1.0, 1.25].map((speed) => (
              <button
                key={speed}
                onClick={() => onUpdateSettings({ speechSpeed: speed })}
                className={`px-2 py-1 text-xs rounded-lg font-semibold transition-colors ${
                  settings.speechSpeed === speed
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
