import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
import { soundManager } from '../utils/audioCues';

interface VoiceCommandButtonProps {
  onCommand: (query: string) => void;
  disabled?: boolean;
}

export const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  onCommand,
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [hasSupport, setHasSupport] = useState(true);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setHasSupport(false);
        return;
      }

      const reco = new SpeechRecognition();
      reco.continuous = false;
      reco.interimResults = false;
      reco.lang = 'en-US';

      reco.onstart = () => {
        setIsListening(true);
        soundManager.playScanStart();
      };

      reco.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          soundManager.playTargetLocated();
          onCommand(transcript);
        }
      };

      reco.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      reco.onend = () => {
        setIsListening(false);
      };

      setRecognition(reco);
    }
  }, [onCommand]);

  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.warn(err);
      }
    }
  };

  if (!hasSupport) {
    return null;
  }

  return (
    <button
      onClick={toggleListening}
      disabled={disabled}
      title="Ask Screen by Voice (Press 'V' or click to speak)"
      className={`relative px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
        isListening
          ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
      } disabled:opacity-50`}
    >
      {isListening ? (
        <>
          <Mic className="w-4 h-4 animate-bounce" />
          <span>Listening... (Speak query)</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 text-amber-400" />
          <span>Ask Screen by Voice</span>
        </>
      )}
    </button>
  );
};
