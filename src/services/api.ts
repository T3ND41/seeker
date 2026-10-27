import {
  ScreenAnalysis,
  ScreenQAResult,
  LeadGenerationResult,
  WebSource,
  RfqEmailRequest,
  RfqEmailResponse,
  AvailableModelInfo,
  ModelChoice,
} from '../types';

let currentAudioElement: HTMLAudioElement | null = null;

export const SUPPORTED_MODELS: AvailableModelInfo[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    category: 'Flash',
    description: 'Next-generation multimodal model. Fast, highly capable across text, sourcing, and visual reasoning.',
    speed: '⚡⚡ Fast',
    contextWindow: '1M tokens',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    features: ['Multimodal', 'Text & Code', 'Fast Streaming', 'Vision'],
    recommendedFor: 'Recommended for Sourcing, RFQs, and General Tasks',
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    category: 'Flash',
    description: 'Battle-tested workhorse model with native Google Search and Google Maps grounding.',
    speed: '⚡⚡ Fast',
    contextWindow: '1M tokens',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    features: ['Google Search Grounding', 'Google Maps Grounding', 'High Reliability'],
    recommendedFor: 'Live Google Maps & Web Search Grounding',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    category: 'Lite / Ultra-Fast',
    description: 'Ultra-low latency model engineered for near-instant responses and rapid UI guidance.',
    speed: '⚡⚡⚡ Ultra Fast',
    contextWindow: '1M tokens',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    features: ['Lowest Latency', 'Instant Summaries', 'High Throughput'],
    recommendedFor: 'Tasks that should happen fast & real-time accessibility',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    category: 'Flash',
    description: 'Always points to the latest stable production Gemini Flash release.',
    speed: '⚡⚡ Fast',
    contextWindow: '1M tokens',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    features: ['Auto-Updating', 'Latest Improvements', 'Multimodal'],
    recommendedFor: 'Continuous upgrades to the newest Flash release',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    category: 'Pro / Reasoning',
    description: 'High-intelligence reasoning engine for complex negotiation, contract analysis, and multi-step logic.',
    speed: '🧠 Deep Reasoning',
    contextWindow: '2M tokens',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    features: ['Advanced Reasoning', 'Contract Nuances', 'Large Context'],
    recommendedFor: 'Complex contract clauses, multi-round negotiation & strategic analysis',
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    category: 'Pro / Reasoning',
    description: 'Advanced flagship reasoning model for math, heavy procurement logic, and deep analysis.',
    speed: '🧠 Deep Reasoning',
    contextWindow: '2M tokens',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    features: ['Flagship Reasoning', 'STEM & Logic', 'Strategic Procurement'],
    recommendedFor: 'Complex commercial trade economics & enterprise tender analysis',
  },
];

export async function getAvailableModelsApi(): Promise<AvailableModelInfo[]> {
  try {
    const res = await fetch('/api/available-models');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback to static list
  }
  return SUPPORTED_MODELS;
}

export async function sendChatMessageApi(params: {
  messages: { role: string; content: string }[];
  groundingMode?: 'search' | 'maps' | 'none';
  useSearchGrounding?: boolean;
  screenImage?: string | null;
  model?: ModelChoice;
  role?: string;
  customSystemInstruction?: string;
}): Promise<{
  text: string;
  sources: WebSource[];
  searchQueries: string[];
  groundingType?: string;
  modelUsed?: string;
}> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...params,
      groundingMode: params.groundingMode || (params.useSearchGrounding !== false ? 'search' : 'none'),
      model: params.model || (params.groundingMode === 'none' ? 'gemini-3.8-flash' : 'gemini-3.5-flash'),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Chat failed with status ${response.status}`);
  }

  return response.json();
}

export interface SmartSearchExpansionResult {
  rawQuery: string;
  itemOrService: string;
  industry: string;
  targetPersona: string;
  targetType: 'suppliers' | 'customers' | 'both';
  origin: {
    country: string;
    province: string;
    city: string;
    address: string;
  };
  destination: {
    country: string;
    province: string;
    city: string;
    address: string;
  };
  deepKeywords: string[];
  searchQueries: string[];
  explanation: string;
  modelUsed?: string;
}

export async function smartSearchExpandApi(
  query: string,
  currentContext?: any,
  model?: string
): Promise<SmartSearchExpansionResult> {
  const response = await fetch('/api/smart-search-expansion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, currentContext, model }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Smart search expansion failed with status ${response.status}`);
  }

  return response.json();
}

export async function generateLeadsApi(params: {
  country: string;
  province?: string;
  area?: string;
  industry: string;
  targetPersona?: string;
  objective?: string;
  targetType?: 'suppliers' | 'customers' | 'both';
  customKeywords?: string;
  groundingMode?: 'maps' | 'search';
  sourcingOrigin?: string;
  deliveryDestination?: string;
  model?: string;
}): Promise<LeadGenerationResult> {
  const response = await fetch('/api/generate-leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...params,
      targetType: params.targetType || 'both',
      groundingMode: params.groundingMode || 'maps',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Lead generation failed with status ${response.status}`);
  }

  return response.json();
}

export async function generateRfqEmailApi(params: RfqEmailRequest): Promise<RfqEmailResponse> {
  const response = await fetch('/api/generate-rfq-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `RFQ email generation failed with status ${response.status}`);
  }

  return response.json();
}

export async function negotiateApi(params: {
  supplierName: string;
  supplierLocation?: string;
  productName: string;
  productSpecs?: string;
  roundNumber: number;
  roundType: string;
  chosenStrategy: string;
  confirmedOrderQuantity: number;
  initialPrice: number;
  currentPrice: number;
  targetPrice: number;
  currency?: string;
  stagedTiers?: { quantity: number; unitPrice: number }[];
  competingQuotes?: { supplierName: string; unitPrice: number; terms?: string }[];
  bundleProducts?: { name: string; quantity: number }[];
  lastSupplierMessage?: string;
  senderSignature?: string;
  userControlLevel?: string;
  paymentTerms?: string;
  destination?: string;
  model?: string;
}): Promise<{
  strategicRationale: string;
  recommendedCounterPrice: number;
  draftedOutreachMessage: string;
  whatsappSummary: string;
  modelUsed?: string;
  concessionsToRequest: string[];
  nextBestAction: string;
  riskAssessment: {
    relationshipRisk: 'Low' | 'Medium' | 'High';
    probabilityOfPriceReduction: number;
    recommendedStopTrigger: string;
  };
  landedCostImpact?: {
    projectedSavingsAmount: number;
    projectedSavingsPercent: number;
    estimatedFreightConcession: number;
    estimatedValueAddConcessions: number;
  };
}> {
  const response = await fetch('/api/negotiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Negotiation analysis failed with status ${response.status}`);
  }

  return response.json();
}

export async function analyzeQuantityTiersApi(tiers: { quantity: number; unitPrice: number }[]): Promise<{
  tiers: {
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discountFromMoqPercent: number;
    marginalSavingsPercent: number;
  }[];
  pricingCurveSlope: 'Aggressive Discounts' | 'Standard Curve' | 'Flat / Resistant';
  maxDiscountPercent: number;
  moqUnitPrice: number;
  recommendedSweetSpot: number;
}> {
  const response = await fetch('/api/analyze-quantity-tiers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tiers }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Tier analysis failed with status ${response.status}`);
  }

  return response.json();
}


export async function analyzeScreenApi(params: {
  image: string;
  mode?: string;
  activeGoal?: string;
  currentStepContext?: string;
  model?: string;
}): Promise<ScreenAnalysis & { modelUsed?: string }> {
  const response = await fetch('/api/analyze-screen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Screen analysis failed with status ${response.status}`);
  }

  const data = await response.json();
  return {
    ...data,
    timestamp: Date.now(),
  };
}

export async function askScreenQuestionApi(params: {
  image: string;
  question: string;
  model?: string;
}): Promise<ScreenQAResult & { modelUsed?: string }> {
  const response = await fetch('/api/screen-qa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Question answering failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Text to Speech using Gemini 3.8 Flash Lite TTS or native browser speech
 */
export async function speakText(
  text: string,
  options: {
    engine: 'gemini' | 'browser';
    voice?: 'Kore' | 'Puck' | 'Zephyr';
    speed?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): Promise<void> {
  stopSpeaking();

  if (!text || !text.trim()) return;

  if (options.engine === 'gemini') {
    try {
      options.onStart?.();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: options.voice || 'Kore',
        }),
      });

      if (!res.ok) {
        throw new Error('Gemini TTS server error, falling back to browser speech');
      }

      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        currentAudioElement = audio;
        audio.playbackRate = options.speed || 1.0;

        audio.onended = () => {
          currentAudioElement = null;
          options.onEnd?.();
        };
        audio.onerror = (e) => {
          currentAudioElement = null;
          console.warn('Audio playback error, fallback to browser speech', e);
          fallbackBrowserSpeak(text, options);
        };

        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('Failed Gemini TTS, using browser speech synthesis fallback', e);
      fallbackBrowserSpeak(text, options);
      return;
    }
  }

  // Native browser speech synthesis
  fallbackBrowserSpeak(text, options);
}

function fallbackBrowserSpeak(
  text: string,
  options: {
    speed?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    options.onError?.('Speech synthesis not available');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.speed || 1.0;
  utterance.pitch = 1.0;

  // Prefer natural English voices
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onstart = () => options.onStart?.();
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = (e) => {
    // Only report error if not cancelled
    if (e.error !== 'canceled') {
      options.onError?.(e);
    }
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch {}
    currentAudioElement = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
