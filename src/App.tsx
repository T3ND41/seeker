/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ScreenAnalysis,
  AccessibilitySettings,
  ScreenSourceType,
  InteractiveElement,
} from './types';
import { SAMPLE_PRESETS, rasterizeSvgToPng } from './utils/sampleScreens';
import { soundManager } from './utils/audioCues';
import {
  analyzeScreenApi,
  askScreenQuestionApi,
  speakText,
  stopSpeaking,
} from './services/api';
import { ScreenViewer } from './components/ScreenViewer';
import { TaskGuidancePanel } from './components/TaskGuidancePanel';
import { TaskProgressBar } from './components/TaskProgressBar';
import { ScreenReaderControl } from './components/ScreenReaderControl';
import { SimplifiedReader } from './components/SimplifiedReader';
import { VoiceCommandButton } from './components/VoiceCommandButton';
import { ChatSearchPanel } from './components/ChatSearchPanel';
import { LeadGenRetentionHub } from './components/LeadGenRetentionHub';
import { AccessibilitySettingsModal } from './components/AccessibilitySettingsModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import {
  Monitor,
  Camera,
  Upload,
  FileImage,
  RefreshCw,
  Sliders,
  Keyboard,
  Sparkles,
  Compass,
  FileText,
  Volume2,
  AlertCircle,
  Eye,
  MessageSquare,
  TrendingUp,
  Globe,
  Building2,
} from 'lucide-react';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  theme: 'dark',
  fontSize: 'normal',
  dyslexicFont: false,
  speechSpeed: 1.0,
  voiceEngine: 'gemini',
  geminiVoice: 'Kore',
  soundCuesEnabled: true,
  earconVolume: 0.5,
  autoScanInterval: 0,
  magnifierZoom: 2,
  visualFilter: 'none',
  highlightTarget: true,
  showBoundingBoxes: true,
  reduceMotion: false,
};

const INITIAL_CHECKOUT_ANALYSIS: ScreenAnalysis = {
  timestamp: Date.now(),
  summary: 'ShopEasy checkout screen. Attention banner indicates CVV code is required to complete the $149.50 payment.',
  screenType: 'E-Commerce Checkout Form',
  orientation: 'Top navigation, 3-step checkout progress stepper, payment form on left, order summary on right.',
  landmarks: [
    { id: 'lm-1', label: 'ShopEasy Header', role: 'navigation', locationDescription: 'Top header navigation bar' },
    { id: 'lm-2', label: 'Payment Method Form', role: 'form', locationDescription: 'Center-left card section' },
    { id: 'lm-3', label: 'Order Summary', role: 'complementary', locationDescription: 'Right sidebar with pricing breakdown' },
  ],
  interactiveElements: [
    {
      id: 'el-cvv',
      label: 'CVV (Required)',
      role: 'input',
      boundingBox: [408, 440, 454, 770],
      description: 'Required 3-digit card security code input field',
      suggestedAction: 'Focus and enter card security code',
      isPrimaryAction: true,
    },
    {
      id: 'el-pay',
      label: 'Pay $149.50 & Complete Order',
      role: 'button',
      boundingBox: [620, 80, 672, 770],
      description: 'Primary submit button to authorize $149.50 charge',
      suggestedAction: 'Click to finalize order',
      isPrimaryAction: false,
    },
  ],
  taskGuidance: {
    instruction: 'Enter your 3-digit Card CVV code into the required security field.',
    targetCoordinates: [408, 440, 454, 770],
    completedSteps: ['1. Shipping Address confirmed'],
    remainingSteps: ['2. Enter Card CVV code', '3. Submit $149.50 order'],
    isTaskComplete: false,
    blockerOrAlert: 'Attention: Please re-enter your Card CVV security code to continue.',
  },
  accessibilityIssues: [
    {
      severity: 'warning',
      title: 'Required CVV Field Needs Input',
      description: 'Form cannot be submitted until CVV security code is provided.',
      recommendation: 'Highlight CVV input box with high-contrast indicator.',
    },
  ],
  simplifiedContent: [
    { type: 'heading', text: 'ShopEasy Checkout' },
    { type: 'warning', text: 'CVV code required to continue.' },
    { type: 'action', text: 'CVV Input Field (Required)' },
    { type: 'action', text: 'Pay $149.50 Button' },
  ],
};

export default function App() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('screensense_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Top level mode: default to finding suppliers and customers (leads)
  const [mainMode, setMainMode] = useState<'screen' | 'chat' | 'leads'>('leads');

  const [activeSource, setActiveSource] = useState<ScreenSourceType>('sample');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('checkout');
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(SAMPLE_PRESETS[0].dataUrl);

  const [activeGoal, setActiveGoal] = useState<string>(SAMPLE_PRESETS[0].defaultGoal);
  const [analysis, setAnalysis] = useState<ScreenAnalysis | null>(INITIAL_CHECKOUT_ANALYSIS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'tasks' | 'narration' | 'simplified'>('tasks');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync settings to localStorage
  const updateSettings = (partial: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem('screensense_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Capture frame from current video element or return current image
  const captureCurrentFrame = useCallback((): string | null => {
    if (videoRef.current && (activeSource === 'display' || activeSource === 'camera')) {
      const video = videoRef.current;
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setCurrentImageSrc(dataUrl);
          return dataUrl;
        }
      }
    }
    return currentImageSrc;
  }, [activeSource, currentImageSrc]);

  // Main screen analysis trigger
  const runScreenAnalysis = useCallback(
    async (overrideImage?: string) => {
      const rawImage = overrideImage || captureCurrentFrame();

      if (!rawImage) {
        setErrorMsg('Please select or capture a screen first');
        return;
      }

      setIsAnalyzing(true);
      setErrorMsg(null);
      soundManager.playScanStart();

      try {
        const imageToAnalyze = await rasterizeSvgToPng(rawImage);

        const result = await analyzeScreenApi({
          image: imageToAnalyze,
          activeGoal,
          currentStepContext: analysis?.taskGuidance?.instruction || '',
        });

        setAnalysis(result);
        soundManager.playScanComplete();

        // If blocker or alert was detected, play warning cue
        if (result.taskGuidance?.blockerOrAlert) {
          soundManager.playAlert();
        } else if (result.taskGuidance?.isTaskComplete) {
          soundManager.playStepSuccess();
        }

        // Auto-narrate overview if summary is available
        const announcement = result.taskGuidance?.instruction
          ? `Next action: ${result.taskGuidance.instruction}. ${result.summary}`
          : result.summary;

        setSpokenTranscript(announcement);
      } catch (err: any) {
        console.error('Analysis error:', err);
        setErrorMsg(err.message || 'Failed to analyze screen');
        soundManager.playAlert();
      } finally {
        setIsAnalyzing(false);
      }
    },
    [captureCurrentFrame, activeGoal, analysis]
  );

  // Initial scan on load with clean rasterization
  useEffect(() => {
    if (SAMPLE_PRESETS[0]?.dataUrl) {
      rasterizeSvgToPng(SAMPLE_PRESETS[0].dataUrl).then((png) => {
        setCurrentImageSrc(png);
        runScreenAnalysis(png);
      }).catch(() => {
        runScreenAnalysis(SAMPLE_PRESETS[0].dataUrl);
      });
    }
  }, []);

  // Auto-scan timer management
  useEffect(() => {
    if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }

    if (settings.autoScanInterval > 0 && !isAnalyzing) {
      autoScanTimerRef.current = setInterval(() => {
        runScreenAnalysis();
      }, settings.autoScanInterval * 1000);
    }

    return () => {
      if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
    };
  }, [settings.autoScanInterval, runScreenAnalysis, isAnalyzing]);

  // Text-to-speech speaker
  const handleSpeak = (text: string) => {
    setSpokenTranscript(text);
    speakText(text, {
      engine: settings.voiceEngine,
      voice: settings.geminiVoice,
      speed: settings.speechSpeed,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  // Stop active video stream
  const stopCurrentStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start live screen capture
  const handleStartDisplayCapture = async () => {
    try {
      stopCurrentStream();
      soundManager.playScanStart();

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setActiveSource('display');
      setErrorMsg(null);

      // Listen for stream ended (e.g. user clicked browser "Stop sharing")
      stream.getVideoTracks()[0].onended = () => {
        setActiveSource('sample');
        setCurrentImageSrc(SAMPLE_PRESETS[0].dataUrl);
      };

      // Allow 500ms for video frame to render then trigger scan
      setTimeout(() => {
        runScreenAnalysis();
      }, 600);
    } catch (err: any) {
      console.warn('Display capture cancelled or unavailable:', err);
      setErrorMsg('Screen share request was cancelled or unsupported by browser.');
    }
  };

  // Start webcam capture
  const handleStartCameraCapture = async () => {
    try {
      stopCurrentStream();
      soundManager.playScanStart();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setActiveSource('camera');
      setErrorMsg(null);

      setTimeout(() => {
        runScreenAnalysis();
      }, 600);
    } catch (err: any) {
      console.warn('Camera capture cancelled or unavailable:', err);
      setErrorMsg('Camera access was denied or unavailable.');
    }
  };

  // Sample preset selection
  const handleSelectPreset = async (presetId: string) => {
    stopCurrentStream();
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPresetId(preset.id);
      setActiveSource('sample');
      setActiveGoal(preset.defaultGoal);
      try {
        const pngImage = await rasterizeSvgToPng(preset.dataUrl);
        setCurrentImageSrc(pngImage);
        runScreenAnalysis(pngImage);
      } catch {
        setCurrentImageSrc(preset.dataUrl);
        runScreenAnalysis(preset.dataUrl);
      }
    }
  };

  // Screenshot upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCurrentStream();
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setActiveSource('upload');
          setCurrentImageSrc(result);
          runScreenAnalysis(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Voice Question & Command processing
  const handleVoiceCommand = async (query: string) => {
    const rawImage = captureCurrentFrame();
    if (!rawImage) return;

    soundManager.playScanStart();
    setIsAnalyzing(true);

    try {
      const image = await rasterizeSvgToPng(rawImage);
      const qaResult = await askScreenQuestionApi({
        image,
        question: query,
      });

      soundManager.playTargetLocated();
      handleSpeak(qaResult.answer);

      // If coordinates were found, update analysis target temporarily
      if (qaResult.targetCoordinates && analysis) {
        setAnalysis({
          ...analysis,
          taskGuidance: {
            ...analysis.taskGuidance,
            targetCoordinates: qaResult.targetCoordinates,
            instruction: qaResult.suggestedAction || qaResult.answer,
          },
        });
      }
    } catch (err: any) {
      console.error('QA error:', err);
      handleSpeak("I couldn't identify that on screen. Please try asking again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleStep = useCallback((stepText: string, currentlyCompleted: boolean) => {
    setAnalysis((prev) => {
      if (!prev || !prev.taskGuidance) return prev;
      const currentGuidance = prev.taskGuidance;
      let newCompleted = [...(currentGuidance.completedSteps || [])];
      let newRemaining = [...(currentGuidance.remainingSteps || [])];

      if (currentlyCompleted) {
        // Move from completed back to remaining
        newCompleted = newCompleted.filter((s) => s !== stepText);
        if (!newRemaining.includes(stepText)) {
          newRemaining.unshift(stepText);
        }
      } else {
        // Move from remaining to completed
        newRemaining = newRemaining.filter((s) => s !== stepText);
        if (!newCompleted.includes(stepText)) {
          newCompleted.push(stepText);
        }
        soundManager.playScanComplete();
      }

      const isTaskComplete = newRemaining.length === 0 && newCompleted.length > 0;
      return {
        ...prev,
        taskGuidance: {
          ...currentGuidance,
          completedSteps: newCompleted,
          remainingSteps: newRemaining,
          isTaskComplete,
        },
      };
    });
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        runScreenAnalysis();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (analysis?.summary) handleSpeak(analysis.summary);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (analysis?.taskGuidance?.instruction) {
          handleSpeak(`Next step: ${analysis.taskGuidance.instruction}`);
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleStopSpeaking();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        updateSettings({ magnifierZoom: settings.magnifierZoom === 2 ? 3 : 2 });
      } else if (e.key === '1') {
        handleSelectPreset('checkout');
      } else if (e.key === '2') {
        handleSelectPreset('security');
      } else if (e.key === '3') {
        handleSelectPreset('flights');
      } else if (e.key === '?') {
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [analysis, settings, runScreenAnalysis]);

  // Dynamic theme class
  const themeClass =
    settings.theme === 'yellow-on-black'
      ? 'theme-yellow-on-black'
      : settings.theme === 'high-contrast'
      ? 'theme-high-contrast'
      : settings.theme === 'light'
      ? 'bg-slate-100 text-slate-900'
      : 'bg-slate-950 text-slate-100';

  const fontClass =
    settings.fontSize === 'huge'
      ? 'font-size-huge'
      : settings.fontSize === 'large'
      ? 'font-size-large'
      : '';

  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-150 ${themeClass} ${fontClass} ${
        settings.dyslexicFont ? 'font-serif' : ''
      }`}
    >
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Accessible Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
            <Eye className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight flex items-center gap-2">
              <span>ScreenSense AI</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30">
                Assistive Vision &amp; Sourcing
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Screen reader, live internet search, lead generation &amp; retention by country/area
            </p>
          </div>
        </div>

        {/* Central Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            onClick={() => setMainMode('leads')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              mainMode === 'leads'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Suppliers &amp; Leads (RFQ)</span>
          </button>

          <button
            onClick={() => setMainMode('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              mainMode === 'chat'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Web Chat &amp; Search</span>
          </button>

          <button
            onClick={() => setMainMode('screen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              mainMode === 'screen'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Screen Assistant</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voice query button */}
          <VoiceCommandButton onCommand={handleVoiceCommand} disabled={isAnalyzing} />

          {/* Accessibility Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Accessibility Settings"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            onClick={() => setIsShortcutsOpen(true)}
            title="Keyboard Shortcuts (?)"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Screen Source & Quick Toolbar (shown when in screen mode) */}
      {mainMode === 'screen' && (
        <nav aria-label="Screen input sources and scan controls" className="bg-slate-950/80 border-b border-slate-800/80 px-4 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Source Switchers */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={handleStartDisplayCapture}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                activeSource === 'display'
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Live Screen Share</span>
            </button>

            <button
              onClick={handleStartCameraCapture}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                activeSource === 'camera'
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Mode</span>
            </button>

            {/* Preset Buttons */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
              {SAMPLE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    activeSource === 'sample' && selectedPresetId === p.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Upload Button */}
            <label className="cursor-pointer px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-400 flex items-center gap-1 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Primary Scan Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => runScreenAnalysis()}
              disabled={isAnalyzing}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Scanning Screen...' : 'Scan Screen (Space)'}</span>
            </button>
          </div>
        </nav>
      )}

      {/* Alert Error Banner */}
      {errorMsg && (
        <div className="bg-rose-500/20 border-b border-rose-500/40 px-6 py-2 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="underline hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 p-4 lg:p-6 max-w-[1700px] w-full mx-auto">
        {/* Mode 1: Screen Assistant */}
        {mainMode === 'screen' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[650px] lg:h-[calc(100vh-180px)] min-h-[480px]">
            {/* Left Column: Screen Viewport & Visual HUD (7 cols) */}
            <div className="lg:col-span-7 flex flex-col h-full min-h-[380px]">
              <ScreenViewer
                imageSrc={currentImageSrc}
                videoRef={videoRef}
                isLiveScreenShare={activeSource === 'display' || activeSource === 'camera'}
                interactiveElements={analysis?.interactiveElements || []}
                targetCoordinates={analysis?.taskGuidance?.targetCoordinates}
                targetInstruction={analysis?.taskGuidance?.instruction}
                visualFilter={settings.visualFilter}
                showBoundingBoxes={settings.showBoundingBoxes}
                highlightTarget={settings.highlightTarget}
                magnifierZoom={settings.magnifierZoom}
                onElementSelect={(el) => {
                  handleSpeak(`${el.role}: ${el.label}. ${el.description}. Suggested: ${el.suggestedAction}`);
                }}
              />
            </div>

            {/* Right Column: Assistance Panels (5 cols) */}
            <div className="lg:col-span-5 flex flex-col h-full min-h-[380px]">
              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-3">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'tasks'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>Task Navigator</span>
                </button>

                <button
                  onClick={() => setActiveTab('narration')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'narration'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Screen Reader</span>
                </button>

                <button
                  onClick={() => setActiveTab('simplified')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'simplified'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Simplified View</span>
                </button>
              </div>

              {/* Visual Progress Bar Component below the Task Navigator tab */}
              <TaskProgressBar
                taskGuidance={analysis?.taskGuidance || null}
                activeGoal={activeGoal}
                className="mb-3"
                onStepClick={(stepIndex, stepText) => {
                  handleSpeak(`Step ${stepIndex}: ${stepText}`);
                }}
              />

              {/* Active Tab Panel */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'tasks' && (
                  <TaskGuidancePanel
                    activeGoal={activeGoal}
                    taskGuidance={analysis?.taskGuidance || null}
                    isLoading={isAnalyzing}
                    onSetGoal={(goal) => {
                      setActiveGoal(goal);
                      runScreenAnalysis();
                    }}
                    onVerifyStep={() => runScreenAnalysis()}
                    onToggleStep={handleToggleStep}
                    onReadInstruction={(text) => handleSpeak(`Next step: ${text}`)}
                    onHighlightTarget={() => {
                      soundManager.playTargetLocated();
                      updateSettings({ highlightTarget: true });
                    }}
                  />
                )}

                {activeTab === 'narration' && (
                  <ScreenReaderControl
                    isSpeaking={isSpeaking}
                    transcript={spokenTranscript}
                    summary={analysis?.summary || ''}
                    settings={settings}
                    onSpeak={handleSpeak}
                    onStop={handleStopSpeaking}
                    onUpdateSettings={updateSettings}
                  />
                )}

                {activeTab === 'simplified' && (
                  <SimplifiedReader
                    simplifiedContent={analysis?.simplifiedContent || []}
                    landmarks={analysis?.landmarks || []}
                    accessibilityIssues={analysis?.accessibilityIssues || []}
                    onSpeak={handleSpeak}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: Web Chat & Live Internet Search */}
        {mainMode === 'chat' && (
          <div className="h-[750px] lg:h-[calc(100vh-140px)]">
            <ChatSearchPanel
              currentScreenSrc={currentImageSrc}
              onSpeak={handleSpeak}
            />
          </div>
        )}

        {/* Mode 3: Lead Generation & Customer Retention Hub */}
        {mainMode === 'leads' && (
          <div className="h-[750px] lg:h-[calc(100vh-140px)]">
            <LeadGenRetentionHub onSpeak={handleSpeak} />
          </div>
        )}
      </main>

      {/* Modals */}
      <AccessibilitySettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={updateSettings}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
