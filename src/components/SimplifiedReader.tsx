import React from 'react';
import { SimplifiedItem, Landmark, AccessibilityIssue } from '../types';
import { FileText, MapPin, AlertCircle, ArrowUpRight, Volume2 } from 'lucide-react';
import { soundManager } from '../utils/audioCues';

interface SimplifiedReaderProps {
  simplifiedContent: SimplifiedItem[];
  landmarks: Landmark[];
  accessibilityIssues: AccessibilityIssue[];
  onSpeak: (text: string) => void;
}

export const SimplifiedReader: React.FC<SimplifiedReaderProps> = ({
  simplifiedContent,
  landmarks,
  accessibilityIssues,
  onSpeak,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Simplified Reading View</h2>
            <p className="text-xs text-slate-400">Distraction-free, high-legibility breakdown</p>
          </div>
        </div>

        <button
          onClick={() => {
            const allText = simplifiedContent.map((c) => c.text).join('. ');
            onSpeak(allText || 'No simplified text available.');
            soundManager.playScanStart();
          }}
          disabled={!simplifiedContent || simplifiedContent.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700 disabled:opacity-50"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Read All</span>
        </button>
      </div>

      {/* Landmarks Section */}
      {landmarks.length > 0 && (
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Page Landmarks ({landmarks.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {landmarks.map((l) => (
              <div
                key={l.id}
                className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-start gap-2.5"
              >
                <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-slate-200">{l.label}</div>
                  <div className="text-slate-400 mt-0.5">{l.locationDescription}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accessibility Audit Alerts */}
      {accessibilityIssues.length > 0 && (
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2">
            Accessibility Notes ({accessibilityIssues.length})
          </span>
          <div className="space-y-2">
            {accessibilityIssues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  issue.severity === 'error'
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                    : issue.severity === 'warning'
                    ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                    : 'bg-blue-950/20 border-blue-800/40 text-blue-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-slate-200">{issue.title}</strong>
                  <p className="mt-0.5 text-slate-300">{issue.description}</p>
                  <p className="mt-1 text-[11px] font-medium opacity-85">
                    💡 Tip: {issue.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clean Simplified Content Cards */}
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Structured Content
        </span>
        {simplifiedContent.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            Scan a screen to extract simplified readable text.
          </div>
        ) : (
          <div className="space-y-2.5">
            {simplifiedContent.map((item, idx) => {
              if (item.type === 'heading') {
                return (
                  <div
                    key={idx}
                    onClick={() => onSpeak(item.text)}
                    className="p-3 bg-purple-950/30 border-l-4 border-purple-400 rounded-r-xl cursor-pointer hover:bg-purple-900/30 transition-colors"
                  >
                    <h3 className="text-sm font-bold text-purple-200 flex items-center justify-between">
                      <span>{item.text}</span>
                      <Volume2 className="w-3.5 h-3.5 text-purple-400 opacity-60" />
                    </h3>
                  </div>
                );
              }

              if (item.type === 'action') {
                return (
                  <div
                    key={idx}
                    onClick={() => onSpeak(`Action: ${item.text}`)}
                    className="p-3 bg-blue-950/30 border-l-4 border-blue-400 rounded-r-xl flex items-center justify-between cursor-pointer hover:bg-blue-900/30 transition-colors"
                  >
                    <span className="text-xs font-bold text-blue-200">{item.text}</span>
                    <ArrowUpRight className="w-4 h-4 text-blue-400" />
                  </div>
                );
              }

              if (item.type === 'warning') {
                return (
                  <div
                    key={idx}
                    onClick={() => onSpeak(`Warning: ${item.text}`)}
                    className="p-3 bg-rose-950/30 border-l-4 border-rose-400 rounded-r-xl cursor-pointer hover:bg-rose-900/30 transition-colors"
                  >
                    <span className="text-xs font-semibold text-rose-200">{item.text}</span>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  onClick={() => onSpeak(item.text)}
                  className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <p className="text-xs text-slate-200 leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
