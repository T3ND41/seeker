export interface Landmark {
  id: string;
  label: string;
  role: string;
  locationDescription: string;
}

export interface InteractiveElement {
  id: string;
  label: string;
  role: 'button' | 'input' | 'link' | 'checkbox' | 'select' | 'tab' | 'alert' | string;
  boundingBox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-1000 normalized space
  description: string;
  suggestedAction: string;
  isPrimaryAction?: boolean;
}

export interface TaskGuidance {
  instruction: string;
  targetCoordinates?: [number, number, number, number];
  completedSteps: string[];
  remainingSteps: string[];
  isTaskComplete: boolean;
  blockerOrAlert?: string;
}

export interface AccessibilityIssue {
  severity: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  recommendation: string;
}

export interface SimplifiedItem {
  type: 'heading' | 'paragraph' | 'action' | 'input' | 'warning';
  text: string;
  actionTarget?: string;
}

export interface ScreenAnalysis {
  summary: string;
  screenType: string;
  orientation: string;
  landmarks: Landmark[];
  interactiveElements: InteractiveElement[];
  taskGuidance: TaskGuidance;
  accessibilityIssues: AccessibilityIssue[];
  simplifiedContent: SimplifiedItem[];
  timestamp: number;
}

export interface ScreenQAResult {
  answer: string;
  targetCoordinates?: [number, number, number, number];
  suggestedAction?: string;
}

export type VisualFilter = 'none' | 'high-contrast' | 'invert' | 'grayscale' | 'night-amber';

export interface AccessibilitySettings {
  theme: 'dark' | 'high-contrast' | 'yellow-on-black' | 'light';
  fontSize: 'normal' | 'large' | 'huge';
  dyslexicFont: boolean;
  speechSpeed: number; // 0.8 to 1.5
  voiceEngine: 'gemini' | 'browser';
  geminiVoice: 'Kore' | 'Puck' | 'Zephyr';
  soundCuesEnabled: boolean;
  earconVolume: number; // 0 to 1
  autoScanInterval: number; // in seconds: 0 = manual only, 5, 10, 15
  magnifierZoom: number; // 1.5 to 3
  visualFilter: VisualFilter;
  highlightTarget: boolean;
  showBoundingBoxes: boolean;
  reduceMotion: boolean;
  preferredModel?: string;
}

export type ModelChoice =
  | 'gemini-3.8-flash'
  | 'gemini-3.5-flash'
  | 'gemini-3.1-flash-lite'
  | 'gemini-flash-latest'
  | 'gemini-3.1-pro-preview'
  | 'gemini-4-argon'
  | string;

export interface AvailableModelInfo {
  id: string;
  name: string;
  category: 'Flash' | 'Pro / Reasoning' | 'Lite / Ultra-Fast' | 'Custom';
  description: string;
  speed: '⚡⚡⚡ Ultra Fast' | '⚡⚡ Fast' | '🧠 Deep Reasoning';
  contextWindow: string;
  badgeColor: string;
  features: string[];
  recommendedFor: string;
}

export type ScreenSourceType = 'display' | 'camera' | 'upload' | 'sample';

export interface SamplePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultGoal: string;
  dataUrl: string;
}

export interface WebSource {
  title: string;
  url: string;
  type?: 'web' | 'maps';
  address?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  sources?: WebSource[];
  searchQueries?: string[];
  attachedScreen?: boolean;
  groundingType?: 'search' | 'maps' | 'none';
  modelUsed?: string;
  roleId?: string;
}

export interface LeadItem {
  id: string;
  name: string;
  category: string;
  entityType?: 'supplier' | 'customer';
  location: {
    country: string;
    province: string;
    area: string;
  };
  address?: string;
  mapsUrl?: string;
  website?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  googleBusinessProfileUrl?: string;
  description: string;
  contactChannels: string[];
  valueProp: string;
  fitScore: 'High' | 'Medium' | 'Warm';
  suggestedOutreach: string;
  retentionAngle?: string;
  status: 'New' | 'Contacted' | 'In Discussion' | 'Retained';
  supplierDetails?: {
    supplyCapacity?: string;
    moq?: string;
    productCatalog?: string[];
    tradeTerms?: string;
  };
  customerDetails?: {
    buyingIntent?: string;
    decisionMakerRole?: string;
    churnRisk?: 'Low' | 'Medium' | 'High';
  };
  sources?: WebSource[];
  dateAdded?: number;
  initialQuotePrice?: number;
  currentQuotePrice?: number;
  leadTimeDays?: number;
}

export interface RetentionStrategy {
  title: string;
  description: string;
  localizedContext: string;
  actionSteps: string[];
  channel: string;
  impact: string;
}

export interface LeadGenerationResult {
  leads: LeadItem[];
  suppliers?: LeadItem[];
  customers?: LeadItem[];
  retentionPlaybook: RetentionStrategy[];
  marketOverview: string;
  searchSources: WebSource[];
  searchQueries: string[];
  modelUsed?: string;
  groundingType?: string;
}

export interface EmailOption {
  id: string;
  title: string;
  angle: string;
  tag: string;
  subject: string;
  body: string;
  whatsappSummary: string;
}

export interface RfqEmailRequest {
  supplierName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierWhatsapp?: string;
  productName: string;
  productDescription?: string;
  quantity: string | number;
  colour?: string;
  specifications: string[];
  requestedQuoteDetails: string[];
  deliveryDestination?: string;
  sourcingOrigin?: string;
  customNotes?: string;
  senderSignature?: string;
  emailType?: 'rfq' | 'customer_pitch';
  model?: string;
}

export interface RfqEmailResponse {
  subject: string;
  body: string;
  whatsappSummary?: string;
  emails?: EmailOption[];
  modelUsed?: string;
}

// -------------------------------------------------------------
// COMMERCIAL INTELLIGENCE & NEGOTIATION ENGINE DATA STRUCTURES
// -------------------------------------------------------------

export type PipelineStage =
  | 'Discovered'
  | 'Researching'
  | 'Verified'
  | 'Qualified'
  | 'Contact Ready'
  | 'Contacted'
  | 'Replied'
  | 'Interested'
  | 'Quotation Requested'
  | 'Opportunity'
  | 'Negotiating'
  | 'Won'
  | 'Lost'
  | 'Dormant'
  | 'Follow-up Scheduled';

export type LeadScore = 'Hot Lead' | 'Strong Lead' | 'Possible Lead' | 'Low Priority';

export type ResponseSentiment =
  | 'Highly Interested'
  | 'Interested'
  | 'Needs Clarification'
  | 'Quotation Promised'
  | 'Waiting for Stock'
  | 'Not Currently Available'
  | 'Declined'
  | 'No Interest'
  | 'Wrong Department'
  | 'Referral Provided'
  | 'Follow-up Later';

export type NegotiationRoundType =
  | 'ROUND_1_INFORMATION'
  | 'ROUND_2_COMMERCIAL_PRESSURE'
  | 'ROUND_3_VOLUME_LEVERAGE'
  | 'ROUND_4_COMPETITIVE_POSITIONING'
  | 'ROUND_5_VALUE_NEGOTIATION'
  | 'ROUND_6_FINAL_OFFER';

export interface ContactPerson {
  id: string;
  name: string;
  role: string; // e.g. "Sales Manager", "Procurement Contact", "Commercial Director"
  email?: string;
  phone?: string;
  whatsapp?: string;
  linkedin?: string;
}

export interface QuantityTier {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountFromMoqPercent: number;
  marginalSavingsPercent: number;
}

export interface NegotiationConcession {
  id: string;
  type: 'Price Reduction' | 'Free Shipping' | 'Reduced Freight' | 'Extended Warranty' | 'Free Samples' | 'Spare Units' | 'Payment Terms' | 'Free Branding' | 'Packaging Optimization';
  description: string;
  estimatedValue: number;
  roundObtained: number;
  date: number;
}

export interface NegotiationRoundRecord {
  id: string;
  roundNumber: number;
  roundType: NegotiationRoundType;
  strategyUsed: string;
  timestamp: number;
  initialPriceAtRound: number;
  negotiatedPriceAtRound: number;
  concessions: string[];
  savingsAmount: number;
  savingsCategory: 'Unit Price' | 'Volume' | 'Freight' | 'Bundle' | 'Payment Terms' | 'Warranty/Spares';
  outreachMessage: string;
  supplierReplySummary?: string;
  sentiment?: ResponseSentiment;
  nextRecommendedAction: string;
  stopRuleTriggered?: boolean;
  stopRuleReason?: string;
}

export interface SupplierBehaviourProfile {
  initialMarkUpPercent: number; // e.g. typically starts 8-12% above final
  volumeDiscountWillingness: 'High' | 'Moderate' | 'Rigid';
  freightDiscountWillingness: 'High' | 'Moderate' | 'Rare';
  paymentTermsFlexibility: 'Flexible' | 'Moderate' | 'Strict Upfront';
  averageResponseTimeHours: number;
  reliabilityScore: number; // 0-100
  notableHabits: string[];
}

export interface LandedCostBreakdown {
  unitPrice: number;
  quantity: number;
  productSubtotal: number;
  freightCost: number;
  insuranceCost: number;
  customsDuty: number;
  paymentTermCashDiscount: number;
  valueConcessionsDeduction: number;
  netLandedCost: number;
  effectiveCostPerUnit: number;
}

export interface CrmEntity {
  id: string;
  entityType: 'supplier' | 'customer';
  name: string;
  category: string;
  industry: string;
  location: {
    country: string;
    province: string;
    area: string;
    address?: string;
  };
  website?: string;
  mapsUrl?: string;
  description: string;
  contactPersons: ContactPerson[];
  pipelineStage: PipelineStage;
  leadScore: LeadScore;
  verificationScore: number; // 0-100
  productsOrNeeds: string[];
  tags: string[];
  notes: string;
  
  // Commercial Negotiation Data
  currency: string;
  initialQuotePrice?: number;
  currentQuotePrice?: number;
  targetPrice?: number;
  moq?: string;
  leadTimeDays?: number;
  paymentTerms?: string;
  freightIncoterms?: string; // EXW, FOB, CIF, DDP
  warrantyDetails?: string;

  // Staged Quantity Tier Data
  quantityTiers?: QuantityTier[];

  // Concessions & Savings Ledger
  concessionsObtained: NegotiationConcession[];
  totalSavingsAchieved: number;
  savingsPercentage: number;
  negotiationRounds: NegotiationRoundRecord[];
  
  // Supplier Specific Profile
  behaviourProfile?: SupplierBehaviourProfile;
  isResellerOpportunity?: boolean;
  resellerOpportunityDetails?: string;

  // Follow-up Intelligence
  nextFollowUpDate?: string;
  followUpReason?: string;
  lastContactedDate?: number;
  responseSentiment?: ResponseSentiment;

  createdAt: number;
  updatedAt: number;
}

export interface ResaleOpportunity {
  id: string;
  supplierId: string;
  supplierName: string;
  customerId: string;
  customerName: string;
  productName: string;
  supplierCostPerUnit: number;
  estimatedLandedCostPerUnit: number;
  estimatedSellingPricePerUnit: number;
  estimatedQuantity: number;
  grossMarginPercent: number;
  projectedProfit: number;
  status: 'Identified' | 'Reviewing' | 'Actionable' | 'Completed';
}

export interface NegotiationStrategyPlan {
  supplierId: string;
  supplierName: string;
  productName: string;
  currentRound: number;
  targetPriceRange: { min: number; max: number };
  chosenStrategy: string;
  strategicRationale: string;
  draftedOutreachMessage: string;
  whatsappSummary: string;
  concessionsToRequest: string[];
  riskAssessment: {
    relationshipRisk: 'Low' | 'Medium' | 'High';
    probabilityOfPriceReduction: number;
    recommendedStopTrigger: string;
  };
  landedCostComparison?: LandedCostBreakdown;
}

