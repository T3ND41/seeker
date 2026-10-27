import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, WebSource } from '../types';
import { sendChatMessageApi } from '../services/api';
import { rasterizeSvgToPng } from '../utils/sampleScreens';
import {
  Send,
  Globe,
  MapPin,
  Monitor,
  Volume2,
  Copy,
  Check,
  Sparkles,
  Search,
  ExternalLink,
  Trash2,
  Cpu,
  Bot,
  Zap,
  Briefcase,
  Scale,
  Users,
  Eye,
  Settings,
  ChevronDown,
  Info,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { soundManager } from '../utils/audioCues';

import { ModelSelectorModal } from './ModelSelectorModal';
import { SUPPORTED_MODELS } from '../services/api';

export type ChatbotRole = 'procurement' | 'negotiator' | 'sdr' | 'accessibility' | 'general';
export type ModelChoice =
  | 'gemini-3.8-flash'
  | 'gemini-3.5-flash'
  | 'gemini-3.1-flash-lite'
  | 'gemini-flash-latest'
  | 'gemini-3.1-pro-preview'
  | 'gemini-4-argon'
  | string;
export type GroundingModeChoice = 'search' | 'maps' | 'none';

interface RoleOption {
  id: ChatbotRole;
  label: string;
  icon: string;
  badge: string;
  description: string;
  defaultPrompt: string;
}

export const CHATBOT_ROLES: RoleOption[] = [
  {
    id: 'procurement',
    label: 'Procurement & Sourcing Lead',
    icon: '🏭',
    badge: 'Sourcing Expert',
    description: 'Finds verified suppliers, evaluates factory capacities, checks MOQs, and structures RFQs.',
    defaultPrompt:
      'You are an elite B2B Procurement and Sourcing Specialist. Your role is to help the user identify credible manufacturers and wholesale suppliers, evaluate supply capacities, check MOQs, structure Requests for Quotation (RFQs), verify international trade credentials, and optimize supply chain delivery.',
  },
  {
    id: 'negotiator',
    label: 'Commercial Negotiator',
    icon: '⚖️',
    badge: 'Contract Analyst',
    description: 'Master of staged quantities, price floor discovery, freight terms, and non-price concessions.',
    defaultPrompt:
      'You are a master Commercial Negotiator and Deal Analyst. Your role is to guide the user in discovering supplier price floors, staging quantity requests to map price curves, requesting non-price concessions (free freight, extended warranties, spare units), and calculating true landed costs.',
  },
  {
    id: 'sdr',
    label: 'Sales Lead Gen & SDR',
    icon: '🎯',
    badge: 'Lead Acquisition',
    description: 'Identifies commercial buyer accounts, pinpoints decision-maker roles, and crafts outreach pitches.',
    defaultPrompt:
      'You are a top-performing B2B Sales Development Representative and Account Executive. Your role is to help the user identify high-probability buyer accounts, uncover decision-maker roles, craft compelling outreach pitches, and build customer retention playbooks.',
  },
  {
    id: 'accessibility',
    label: 'Screen Vision Navigator',
    icon: '👁️',
    badge: 'Accessibility AI',
    description: 'Inspects screens, explains complex UIs, detects form fields, and guides visual navigation.',
    defaultPrompt:
      'You are ScreenSense AI, a specialized visual and screen accessibility navigator. Your role is to clearly describe user interfaces, identify spatial landmarks and interactable elements, and provide step-by-step guidance for users with visual or cognitive challenges.',
  },
  {
    id: 'general',
    label: 'General AI Assistant',
    icon: '🤖',
    badge: 'Versatile AI',
    description: 'Broad intelligence for versatile research, writing, inquiries, and logical problem solving.',
    defaultPrompt:
      'You are a versatile, intelligent AI assistant powered by Gemini. You provide thorough, accurate, and actionable answers backed by logical reasoning and up-to-date grounded facts.',
  },
];

interface ModelOption {
  id: string;
  label: string;
  tag: string;
  description: string;
  badgeColor: string;
  recommendedFor: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    label: 'Gemini 3.8 Flash',
    tag: '★ Recommended',
    description: 'Next-gen multimodal Flash model with balanced speed, intelligence, and large context.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    recommendedFor: 'Recommended for Sourcing & General Tasks',
  },
  {
    id: 'gemini-3.5-flash',
    label: 'Gemini 3.5 Flash',
    tag: '🌐 Grounding Workhorse',
    description: 'High reliability model optimized for live Google Search and Google Maps tools.',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    recommendedFor: 'Live Google Maps & Web Search Grounding',
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash Lite',
    tag: '⚡ Ultra Fast',
    description: 'Ultra-low latency model for instant responses and real-time screen navigation.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    recommendedFor: 'Tasks that should happen fast',
  },
  {
    id: 'gemini-flash-latest',
    label: 'Gemini Flash Latest',
    tag: '🚀 Auto-Updating',
    description: 'Always points to Google’s latest production Gemini Flash checkpoint.',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    recommendedFor: 'Latest stable capabilities',
  },
  {
    id: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro Preview',
    tag: '🧠 Complex Reasoning',
    description: 'Advanced reasoning engine for complex negotiation, contract analysis, and deep logic.',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    recommendedFor: 'Complex contract clauses & multi-round negotiation',
  },
  {
    id: 'gemini-4-argon',
    label: 'Gemini 4 Argon',
    tag: '🔬 Flagship STEM',
    description: 'Flagship reasoning model for heavy math, commercial economic modeling, and tender analysis.',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    recommendedFor: 'Advanced commercial calculations & tender analysis',
  },
];

interface ChatSearchPanelProps {
  currentScreenSrc: string | null;
  onSpeak: (text: string) => void;
  onSelectLeadSearch?: (location: { country: string; province: string; area: string; industry: string }) => void;
}

export const ChatSearchPanel: React.FC<ChatSearchPanelProps> = ({
  currentScreenSrc,
  onSpeak,
  onSelectLeadSearch,
}) => {
  // Selected Chatbot Role & Custom System Instruction
  const [selectedRole, setSelectedRole] = useState<ChatbotRole>('procurement');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  // Model Selection
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');

  // Grounding Mode: search (Google Search), maps (Google Maps), none
  const [groundingMode, setGroundingMode] = useState<GroundingModeChoice>('search');

  // Screen Context attachment
  const [attachScreen, setAttachScreen] = useState(false);

  // Conversation history (Multi-turn)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome',
        role: 'model',
        content: `👋 Hello! I am your multi-turn Gemini AI assistant.

I can operate across specialized roles and integrate real-time grounding:
• 🌐 **Google Search Data (gemini-3.5-flash)**: Retrieves live web facts, corporate news, and verified source citations.
• 📍 **Google Maps Data (gemini-3.5-flash)**: Uncovers physical business addresses, supplier locations, and geographic coordinates.
• 🧠 **Model Selection**: Switch between **gemini-3.1-pro-preview** (complex tasks), **gemini-3.5-flash** (general & grounding), and **gemini-3.1-flash-lite** (fast tasks).
• 🎭 **Role Specialization**: Configure my role as Procurement Specialist, Commercial Negotiator, Sales SDR, or Vision Navigator.

How can I assist you with your procurement, sourcing, or research requirements today?`,
        timestamp: Date.now(),
        modelUsed: 'gemini-3.5-flash',
        roleId: 'procurement',
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeRoleConfig = CHATBOT_ROLES.find((r) => r.id === selectedRole) || CHATBOT_ROLES[0];
  const activeModelConfig = MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[1];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // When grounding mode is changed to search or maps, ensure gemini-3.5-flash is selected as per prompt requirement
  const handleSetGroundingMode = (mode: GroundingModeChoice) => {
    setGroundingMode(mode);
    if (mode === 'search' || mode === 'maps') {
      setSelectedModel('gemini-3.5-flash');
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
      attachedScreen: attachScreen && Boolean(currentScreenSrc),
      groundingType: groundingMode,
      roleId: selectedRole,
      modelUsed: selectedModel,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    soundManager.playScanStart();

    try {
      let screenImageToSend: string | null = null;
      if (attachScreen && currentScreenSrc) {
        screenImageToSend = await rasterizeSvgToPng(currentScreenSrc);
      }

      // Model resolution: If using search or maps grounding, enforce gemini-3.5-flash
      const effectiveModel: ModelChoice =
        groundingMode === 'search' || groundingMode === 'maps'
          ? 'gemini-3.5-flash'
          : selectedModel;

      const response = await sendChatMessageApi({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        groundingMode,
        screenImage: screenImageToSend,
        model: effectiveModel,
        role: selectedRole,
        customSystemInstruction: customInstruction.trim() || undefined,
      });

      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: response.text,
        timestamp: Date.now(),
        sources: response.sources,
        searchQueries: response.searchQueries,
        groundingType: groundingMode,
        modelUsed: response.modelUsed || effectiveModel,
        roleId: selectedRole,
      };

      setMessages((prev) => [...prev, modelMsg]);
      soundManager.playScanComplete();
    } catch (err: any) {
      console.error('Chat error:', err);
      soundManager.playAlert();
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: `⚠️ Error executing request: ${err.message || 'Unable to communicate with Gemini.'}. Please verify network connection or try again.`,
          timestamp: Date.now(),
          modelUsed: selectedModel,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'model',
        content: `Conversation refreshed. Active role: **${activeRoleConfig.label}** (${activeRoleConfig.icon}). Model: **${selectedModel}**. How can I help?`,
        timestamp: Date.now(),
        modelUsed: selectedModel,
        roleId: selectedRole,
      },
    ]);
  };

  const getSuggestedQuestions = () => {
    if (groundingMode === 'maps') {
      return [
        'Find heavy mining equipment suppliers near Lusaka, Zambia with addresses',
        'Locate solar panel and inverter distributors in Johannesburg, Gauteng',
        'Find commercial safety barrier manufacturers in Durban, South Africa',
      ];
    }
    if (selectedRole === 'procurement') {
      return [
        'What are the typical MOQ and volume discounts for 1.8m mining barrier cones?',
        'How should I structure an RFQ for heavy industrial safety delineators?',
        'What are standard delivery terms and Incoterms for shipping goods to Zambia?',
      ];
    }
    if (selectedRole === 'negotiator') {
      return [
        'Explain how to execute staged quantity disclosure across 50, 100, 250, and 1,000 units',
        'Draft a commercial negotiation response requesting free freight and 30-day payment terms',
        'What non-price concessions should I request when a supplier holds a firm unit price?',
      ];
    }
    if (selectedRole === 'sdr') {
      return [
        'Identify key mining operators in Zambia that purchase exclusion zone barrier cones',
        'Draft a concise B2B cold email proposal for safety and procurement directors',
        'What customer retention tactics work best for industrial equipment clients?',
      ];
    }
    return [
      'Search recent trends in B2B procurement automation and supplier intelligence',
      'What are the main Incoterms differences between EXW, FOB, and DDP?',
      'How to benchmark competing supplier quotations without breaching confidentiality?',
    ];
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Top Header & Mode Controls */}
      <div className="p-3.5 sm:p-4 bg-slate-950/95 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Title & Active Role Badge */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-lg">
              {activeRoleConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-100">
                  Gemini Multi-Turn Chatbot
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <span>{activeRoleConfig.icon}</span>
                  <span>{activeRoleConfig.label}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {activeRoleConfig.description}
              </p>
            </div>
          </div>

          {/* Top Actions: System Instruction & Clear Chat */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPromptModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="View or customize system instruction for the chatbot role"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Role Instructions</span>
            </button>

            <button
              onClick={clearChat}
              title="Clear Conversation Thread"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configuration Bar: Chatbot Roles, Models, Grounding Mode */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          {/* 1. Chatbot Role Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Bot className="w-3 h-3 text-amber-400" />
              <span>Chatbot Role / Persona:</span>
            </span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ChatbotRole)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              {CHATBOT_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.icon} {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Model Selection: expanded to all Gemini models and custom models */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-purple-400" />
                <span>Gemini Model Engine:</span>
              </span>
              <button
                type="button"
                onClick={() => setIsModelModalOpen(true)}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-0.5"
              >
                <span>Browse All</span>
              </button>
            </div>
            <div className="flex gap-1.5 items-center">
              <select
                value={selectedModel}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsModelModalOpen(true);
                  } else {
                    setSelectedModel(e.target.value);
                  }
                }}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-400"
              >
                <option value="gemini-3.8-flash">★ gemini-3.8-flash (Recommended)</option>
                <option value="gemini-3.5-flash">🌐 gemini-3.5-flash (Grounding)</option>
                <option value="gemini-3.1-flash-lite">⚡ gemini-3.1-flash-lite (Ultra Fast)</option>
                <option value="gemini-flash-latest">🚀 gemini-flash-latest (Auto-Update)</option>
                <option value="gemini-3.1-pro-preview">🧠 gemini-3.1-pro-preview (Reasoning)</option>
                <option value="gemini-4-argon">🔬 gemini-4-argon (Flagship STEM)</option>
                {![
                  'gemini-3.8-flash',
                  'gemini-3.5-flash',
                  'gemini-3.1-flash-lite',
                  'gemini-flash-latest',
                  'gemini-3.1-pro-preview',
                  'gemini-4-argon',
                ].includes(selectedModel) && (
                  <option value={selectedModel}>⚙️ {selectedModel} (Custom)</option>
                )}
                <option value="__custom__">➕ Custom Model ID...</option>
              </select>
              <button
                type="button"
                onClick={() => setIsModelModalOpen(true)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
                title="Open Model Selection Hub"
              >
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
              </button>
            </div>
          </div>

          {/* 3. Live Grounding Tools: Google Search, Google Maps, None */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-sky-400" />
              <span>Live Grounding Tool:</span>
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => handleSetGroundingMode('search')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition ${
                  groundingMode === 'search'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Google Search Grounding (gemini-3.5-flash with googleSearch tool)"
              >
                <Globe className="w-3 h-3" />
                <span>Search</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetGroundingMode('maps')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition ${
                  groundingMode === 'maps'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Google Maps Grounding (gemini-3.5-flash with googleMaps tool)"
              >
                <MapPin className="w-3 h-3" />
                <span>Maps</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetGroundingMode('none')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition ${
                  groundingMode === 'none'
                    ? 'bg-slate-700 text-slate-200 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Direct Model reasoning without external search tools"
              >
                <Zap className="w-3 h-3" />
                <span>Direct</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div
                className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed max-w-[92%] sm:max-w-[85%] ${
                  isUser
                    ? 'bg-amber-400 text-slate-950 font-medium rounded-br-sm shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-100 rounded-bl-sm shadow-lg'
                }`}
              >
                {/* Header metadata tag for Model messages */}
                {!isUser && (
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800/80 flex-wrap text-[10px]">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <span>🤖</span>
                      <span>Gemini Assistant</span>
                    </span>

                    {msg.modelUsed && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                        {msg.modelUsed}
                      </span>
                    )}

                    {msg.groundingType === 'search' && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" />
                        <span>Google Search Grounded</span>
                      </span>
                    )}

                    {msg.groundingType === 'maps' && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>Google Maps Grounded</span>
                      </span>
                    )}
                  </div>
                )}

                {/* User metadata tag: attached screen badge */}
                {isUser && msg.attachedScreen && (
                  <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded bg-slate-900/30 text-[11px] font-bold text-slate-900">
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Included Active Screen Context</span>
                  </div>
                )}

                {/* Message Body Content */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Conducted Search Queries */}
                {!isUser && msg.searchQueries && msg.searchQueries.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-semibold block mb-1.5 flex items-center gap-1">
                      <Search className="w-3 h-3 text-blue-400" />
                      <span>{msg.groundingType === 'maps' ? 'Maps Queries Conducted:' : 'Web Searches Conducted:'}</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.searchQueries.map((q, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[11px] border border-slate-800"
                        >
                          &quot;{q}&quot;
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verified Grounded Sources (Web or Google Maps Places) */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-semibold block mb-1.5 flex items-center gap-1">
                      {msg.groundingType === 'maps' ? (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          <span>Google Maps Places ({msg.sources.length}):</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Verified Web Sources ({msg.sources.length}):</span>
                        </>
                      )}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {msg.sources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-blue-400 hover:text-blue-300 text-xs transition-colors group"
                        >
                          <div className="truncate max-w-[220px]">
                            <div className="text-slate-200 group-hover:text-blue-300 font-medium truncate">
                              {s.title || s.url}
                            </div>
                            {s.address && (
                              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                {s.address}
                              </div>
                            )}
                          </div>
                          <ExternalLink className="w-3 h-3 shrink-0 ml-1 opacity-70 group-hover:opacity-100" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Action Footer */}
                {!isUser && (
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-slate-400 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSpeak(msg.content)}
                        className="flex items-center gap-1 text-[11px] hover:text-amber-300 transition-colors"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1 text-[11px] hover:text-amber-300 transition-colors"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-bl-sm p-4 flex items-center gap-3 text-xs text-slate-300 shadow-lg">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-ping ${
                    groundingMode === 'maps'
                      ? 'bg-rose-400'
                      : groundingMode === 'search'
                      ? 'bg-blue-400'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="font-semibold text-slate-200">
                  {groundingMode === 'maps'
                    ? 'Consulting Google Maps data (gemini-3.5-flash)...'
                    : groundingMode === 'search'
                    ? 'Consulting Google Search data (gemini-3.5-flash)...'
                    : `Generating response with ${selectedModel}...`}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions Pill Strip */}
      {messages.length <= 3 && (
        <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800/70">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-400 font-medium">
              Suggested for {activeRoleConfig.label}:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {getSuggestedQuestions().map((s, idx) => (
              <button
                key={idx}
                onClick={() => setInput(s)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls & Input Form */}
      <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs flex-wrap gap-2">
          {/* Active Status Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
              {groundingMode === 'maps' ? (
                <>
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Google Maps Grounding (gemini-3.5-flash)</span>
                </>
              ) : groundingMode === 'search' ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Google Search Grounding (gemini-3.5-flash)</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Direct Intelligence ({selectedModel})</span>
                </>
              )}
            </span>

            {/* Attach Screen Toggle */}
            {currentScreenSrc && (
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={attachScreen}
                  onChange={(e) => setAttachScreen(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
                />
                <span className="font-medium flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5 text-amber-400" />
                  <span>Attach Active Screen Context</span>
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              groundingMode === 'maps'
                ? 'Search places, supplier addresses, or coordinates with Google Maps...'
                : groundingMode === 'search'
                ? 'Search real-time web facts, companies, trade terms with Google Search...'
                : `Ask ${activeRoleConfig.label} anything...`
            }
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>

      {/* Role System Instructions Modal */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Chatbot Role &amp; System Instruction
                </h3>
              </div>
              <button
                onClick={() => setIsPromptModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Active Role Preset:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CHATBOT_ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRole(r.id);
                        setCustomInstruction('');
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                        selectedRole === r.id
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      <span className="text-base">{r.icon}</span>
                      <span className="font-bold text-[11px] leading-tight">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Custom System Instruction (Overrides Default):
                </label>
                <textarea
                  rows={4}
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder={activeRoleConfig.defaultPrompt}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Leave blank to use the active role&apos;s standard system instruction.
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setCustomInstruction('');
                  setIsPromptModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Reset to Default
              </button>
              <button
                type="button"
                onClick={() => setIsPromptModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Model Selector Modal */}
      <ModelSelectorModal
        isOpen={isModelModalOpen}
        currentModel={selectedModel}
        onSelectModel={setSelectedModel}
        onClose={() => setIsModelModalOpen(false)}
        title="Select Chatbot AI Model Engine"
        description="Choose which Gemini model powers your multi-turn chat, procurement analysis, and strategic intelligence."
      />
    </div>
  );
};
