import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Scan / Re-analyze current screen' },
    { key: 'R', desc: 'Read screen summary and orientation aloud' },
    { key: 'N', desc: 'Read active next step instruction' },
    { key: 'S', desc: 'Stop audio narration immediately' },
    { key: 'V', desc: 'Activate Voice Input / Ask question about screen' },
    { key: 'M', desc: 'Toggle Magnifier Loupe zoom' },
    { key: 'T', desc: 'Highlight active task target on screen' },
    { key: '1, 2, 3', desc: 'Switch test screen presets' },
    { key: '?', desc: 'Toggle this keyboard shortcuts dialog' },
    { key: 'Esc', desc: 'Close dialogs or cancel voice input' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-400">Complete keyboard navigation support</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs"
            >
              <span className="text-slate-300 font-medium">{sc.desc}</span>
              <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-amber-300 font-mono font-bold shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
