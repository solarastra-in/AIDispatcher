export type ModelTier = 'low' | 'mid' | 'high' | 'frontier' | 'deep_reasoning';

export type AIProvider = 
  | 'google' 
  | 'openai' 
  | 'anthropic' 
  | 'mistral' 
  | 'deepseek' 
  | 'groq' 
  | 'meta' 
  | 'cohere'
  | 'xai'
  | 'perplexity'
  | 'qwen'
  | 'tools'
  | 'custom';

export type UserRole = 'guest' | 'user' | 'team_member' | 'team_admin' | 'platform_admin';

export interface ModelCapability {
  code: boolean;
  vision: boolean;
  reasoning: boolean;
  functionCalling: boolean;
  jsonOutput: boolean;
  longContext: boolean;
  onlineSearch?: boolean;
  toolExecution?: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  providerDisplayName: string;
  tier: ModelTier;
  tierLabel: string;
  inputPricePerM: number; // USD per 1M tokens
  outputPricePerM: number; // USD per 1M tokens
  contextWindowTokens: number;
  capabilities: ModelCapability;
  latencyAvgMs: number;
  qualityBenchmarkScore: number; // 0 - 100
  status: 'active' | 'degraded' | 'maintenance' | 'deprecated';
  description: string;
  recommendedFor: string[];
  isCustomBYOK?: boolean;
  isSpecializedTool?: boolean;
}

export interface TokenReductionDetail {
  techniqueId: string;
  name: string;
  description: string;
  tokensBefore: number;
  tokensAfter: number;
  tokensSaved: number;
  percentSaved: number;
  applied: boolean;
  notes: string;
}

export interface TokenReductionSummary {
  rawInputTokens: number;
  optimizedInputTokens: number;
  rawEstimatedOutputTokens: number;
  optimizedOutputTokens: number;
  totalTokensBefore: number;
  totalTokensAfter: number;
  totalTokensSaved: number;
  reductionPercentage: number;
  techniques: TokenReductionDetail[];
  compactContextPayload?: string;
}

export interface CandidateEvaluation {
  modelId: string;
  modelName: string;
  provider: AIProvider;
  tier: ModelTier;
  qualityScore: number;
  estimatedCostUsd: number;
  isEligible: boolean;
  disqualificationReason?: string;
  costEfficiencyRatio: number; // Quality / (Cost * 1000 + 1)
  isCheapestEligible: boolean;
}

export interface ComplexityClassification {
  taskCategory: 
    | 'simple_extraction' 
    | 'routine_draft' 
    | 'code_generation' 
    | 'multi_step_reasoning' 
    | 'deep_synthesis' 
    | 'translation_edit'
    | 'web_search_grounded'
    | 'math_proof'
    | 'tool_orchestration';
  complexityScore: number; // 1 to 10
  reasoningDepth: 'minimal' | 'moderate' | 'high' | 'exhaustive';
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  requiredCapabilities: (keyof ModelCapability)[];
  recommendedTier: ModelTier;
  routingReason: string;
  stage1Score: number; // heuristic score
  stage2Score?: number; // semantic model score
  confidencePercent: number;
  candidateEvaluations?: CandidateEvaluation[];
  tokenReduction?: TokenReductionSummary;
}

export interface ContextLedgerEntry {
  id: string;
  sessionId: string;
  sequenceNumber: number;
  timestamp: string;
  previousHash: string;
  hash: string;
  promptSnippet: string;
  routedModelId: string;
  routedModelName: string;
  entitiesExtracted: Record<string, string | number | boolean>;
  decisionsMade: string[];
  tokensProcessed: number;
  tokensSaved: number;
  verified: boolean;
  appliedTechniques?: string[];
  contextSizeReductionPct?: number;
}

export interface FailedAttemptInfo {
  modelId: string;
  modelName: string;
  provider: AIProvider;
  tier: ModelTier;
  error: string;
  thompsonScore: number;
  expectedQuality: number;
  timestamp: string;
}

export interface AutoRetryInfo {
  triggered: boolean;
  retryAttempts: number;
  maxRetriesAllowed: number;
  originalModel: AIModel;
  failedAttempts: FailedAttemptInfo[];
  selectedNextBestModel: AIModel;
  fallbackReason: string;
  thompsonSamplingRank: number;
  totalCandidatePoolSize: number;
}

export interface DispatchRequest {
  prompt: string;
  sessionId?: string;
  enforceTier?: ModelTier;
  enforceModelId?: string;
  userRole?: UserRole;
  teamId?: string;
  contextLedgerIds?: string[];
  byokKey?: string;
  enableAllOptimizations?: boolean;
  enableSmartAutoRetry?: boolean;
  simulateFailure?: boolean;
  simulateFailureModelId?: string;
  maxAutoRetries?: number;
}

export interface DispatchResponse {
  dispatchId: string;
  sessionId: string;
  classification: ComplexityClassification;
  chosenModel: AIModel;
  baselineFrontierModel: AIModel;
  outputContent: string;
  metrics: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    rawTokensWithoutOptimization?: number;
    costUsd: number;
    baselineCostUsd: number;
    costSavingsUsd: number;
    savingsPercentage: number;
    tokensSaved: number;
    latencyMs: number;
  };
  ledgerEntry: ContextLedgerEntry;
  tokenReductionSummary?: TokenReductionSummary;
  candidateEvaluations?: CandidateEvaluation[];
  executionStatus: 'success' | 'fallback_used' | 'error';
  errorMessage?: string;
  autoRetryInfo?: AutoRetryInfo;
}

export interface AttachedPromptFile {
  id: string;
  name: string;
  size: number;
  type: string;
  modality: 'vision' | 'document' | 'audio' | 'video' | 'code' | 'other';
  base64?: string;
  textPreview?: string;
  uploadedAt: string;
}

export interface ExcludedModelReason {
  modelId: string;
  modelName: string;
  provider: string;
  tier: ModelTier;
  category: 'modality_unsupported' | 'admin_policy_enforced' | 'unconfigured_key' | 'budget_exhausted' | 'tier_restricted';
  reason: string;
}

export interface UserPersona {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title: string;
  companyName?: string;
  teamId?: string;
  monthlyBudgetUsd: number;
  currentSpendUsd: number;
  monthlyTokenQuota?: number;
  tokensUsedThisMonth: number;
  allowedTiers: ModelTier[];
  allowedModels?: string[]; // Specific model whitelist if enforced by admin
  canSelectModel?: boolean; // Privilege to manually select AI model
  canSelectEngine?: boolean; // Privilege to manually select AI engine
  isCompanyAdmin?: boolean; // Whether the user is an admin of their company
  canBYOK: boolean;
  canManageTeam: boolean;
  canManagePlatform: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'admin' | 'viewer';
  tierCap: ModelTier;
  monthlyTokenQuota: number;
  monthlyTokensUsed: number;
  monthlyBudgetUsd?: number;
  currentSpendUsd?: number;
  canSelectModel?: boolean;
  canSelectEngine?: boolean;
  canBYOK?: boolean;
  allowedModels?: string[];
  joinedAt: string;
  status: 'active' | 'invited' | 'suspended';
}

export interface TeamAccount {
  id: string;
  companyId?: string;
  name: string;
  tierPlan: 'Growth' | 'Enterprise' | 'Scale';
  adminEmail: string;
  companyAdminEmail?: string;
  ssoDomain?: string;
  ssoEnabled?: boolean;
  allowedProviders: AIProvider[];
  allowedModels?: string[];
  defaultTierCap: ModelTier;
  monthlyBudgetUsd: number;
  currentMonthSpendUsd: number;
  monthlyTokenQuota?: number;
  totalTokensProcessed: number;
  members: TeamMember[];
}

export interface PaymentInvoice {
  id: string;
  invoiceNumber: string;
  accountName: string;
  role: string;
  date: string;
  amountUsd: number;
  planName: string;
  status: 'paid' | 'pending' | 'processing';
  tokensCovered: number;
  savingsGeneratedUsd: number;
  paymentMethod: string;
}

export interface PlatformMetrics {
  totalDispatches: number;
  activeModelsCount: number;
  totalTokensRouted: number;
  totalTokensSaved: number;
  totalCostSavedUsd: number;
  averageLatencyMs: number;
  uptimePercent: number;
  topRoutedTier: ModelTier;
}

export interface MarketComparisonItem {
  feature: string;
  whyOrDispatch: string;
  openRouter: string;
  portkey: string;
  martianRouteLLM: string;
  whyOrAdvantage: string;
}

export type AuthMethodType = 'api_key' | 'local_proxy' | 'both' | 'subscription_oauth' | 'subscription_email' | 'cli_daemon' | 'unified_gateway';

export interface CompanyProviderCredential {
  provider: AIProvider;
  providerDisplayName: string;
  authMethod?: AuthMethodType;
  apiKey: string;
  maskedKey: string;
  hasKey?: boolean;
  
  // Subscription & OAuth fields
  subscriptionTier?: string;
  subscriptionEmail?: string;
  oauthProvider?: 'google' | 'github' | 'email_magic' | 'direct_session';
  oauthConnectedAt?: string;
  sessionTokenMasked?: string;
  hasSubscription?: boolean;
  monthlyFlatRateCostUsd?: number;
  
  // Local Proxy & CLI Bridge fields
  proxyStatus?: 'running' | 'idle' | 'stopped' | 'error';
  localProxyPort?: number;
  localProxyUrl?: string;
  cliBridgeStatus?: 'active' | 'ready' | 'stopped';
  cliCommand?: string;
  
  baseUrl?: string;
  organizationId?: string;
  projectId?: string;
  status: 'connected' | 'unconfigured' | 'verifying' | 'invalid' | 'rate_limited';
  lastVerifiedAt?: string;
  latencyMs?: number;
  detectedModels?: string[];
  monthlySpendLimitUsd?: number;
  currentSpendUsd?: number;
  notes?: string;
}

export interface UnifiedSubscriptionGatewayConfig {
  status: 'active' | 'standby' | 'stopped';
  gatewayPort: number;
  gatewayBindUrl: string;
  activeSubscriptions: {
    provider: AIProvider;
    name: string;
    tier: string;
    authMethod: AuthMethodType;
    accountEmail: string;
  }[];
  totalRoutedRequests: number;
  totalTokensProcessed: number;
  flatMonthlySpendUsd: number;
  estimatedApiCostAvoidedUsd: number;
  lastHeartbeat: string;
}

export interface TerminalSessionCommandResult {
  command: string;
  stdout: string;
  stderr?: string;
  exitCode: number;
  durationMs: number;
  sessionTier: string;
  timestamp: string;
}

export interface CompanyOnboardingProfile {
  companyName: string;
  orgId: string;
  primaryContactEmail: string;
  byokMode: 'direct_keys_only' | 'hybrid_fallback' | 'platform_pool' | 'subscription_priority';
  preferredAuthMode?: 'subscription_first' | 'api_key_first';
  gatewayConfig?: UnifiedSubscriptionGatewayConfig;
  credentials: Record<string, CompanyProviderCredential>;
  lastUpdated: string;
}


