import { AIModel, UserPersona, ModelTier, AIProvider } from '../types';
import { softClassifier } from './embeddingClassifier';
import { QualityModelTracker } from './qualityModel';
import { ThompsonDecisionEngine } from './decisionEngine';
import { FeedbackEngine, FeedbackSignalType } from './feedbackEngine';
import { ContextLedgerEngine, StructuredLedgerItem } from './ledgerEngine';
import { allowedTiersFor, PERSONA_POLICIES, auditLogger } from './rbacEngine';
import { adapterRegistry } from './adapters';
import { INITIAL_AI_MODELS, PERSONA_PROFILES, INITIAL_TEAM_ACCOUNT, INITIAL_PAYMENTS } from '../data/mockData';

export interface ApiEndpointDefinition {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  personasAllowed: string[];
  description: string;
  sampleRequestBody?: Record<string, any>;
}

export const API_ENDPOINTS: ApiEndpointDefinition[] = [
  {
    method: 'POST',
    path: '/v1/dispatch',
    personasAllowed: ['Guest', 'User', 'Team Member', 'Team Admin', 'Platform Admin'],
    description: 'Shared routing endpoint — classifies task, samples quality via Thompson sampling, optimizes tokens, dispatches to cheapest effective model, updates ledger, and logs usage.',
    sampleRequestBody: {
      prompt: "Break down why this deal underperformed relative to projections and recommend next steps.",
      conversation_turns: 0,
      capability_hints: ["reasoning"],
      project_id: "m_and_a_due_diligence",
      quality_threshold: 0.75
    }
  },
  {
    method: 'POST',
    path: '/v1/feedback',
    personasAllowed: ['User', 'Team Member', 'Team Admin', 'Platform Admin'],
    description: 'Submit explicit (thumbs up/down) or implicit outcome signal against a dispatch_id to close the Bayesian quality learning loop.',
    sampleRequestBody: {
      dispatch_id: "disp_7a9f2bc1",
      signal_type: "EXPLICIT_THUMBS",
      is_success: true,
      notes: "Accurate model selection and concise breakdown."
    }
  },
  {
    method: 'GET',
    path: '/v1/team/{team_id}/usage',
    personasAllowed: ['Team Admin', 'Platform Admin'],
    description: 'Per-member token usage, cost breakdown, and tier distribution for caller\'s team workspace.'
  },
  {
    method: 'POST',
    path: '/v1/team/{team_id}/members/invite',
    personasAllowed: ['Team Admin', 'Platform Admin'],
    description: 'Invite new team member with specific role and optional tier cap override.',
    sampleRequestBody: {
      email: "alex.kumar@example.com",
      role: "member",
      tier_cap: "high",
      monthly_token_quota: 5000000
    }
  },
  {
    method: 'PATCH',
    path: '/v1/team/{team_id}/policy',
    personasAllowed: ['Team Admin', 'Platform Admin'],
    description: 'Update team provider allowlist and default tier cap.',
    sampleRequestBody: {
      allowed_providers: ["anthropic", "google", "openai", "deepseek", "groq"],
      default_tier_cap: "frontier",
      monthly_budget_usd: 5000
    }
  },
  {
    method: 'GET',
    path: '/v1/admin/users',
    personasAllowed: ['Platform Admin'],
    description: 'List and search all platform users, personas, and spend tiers.'
  },
  {
    method: 'POST',
    path: '/v1/admin/users/{user_id}/deactivate',
    personasAllowed: ['Platform Admin'],
    description: 'Deactivate a user account and revoke API tokens (logs to audit table).',
    sampleRequestBody: {
      reason: "Suspicious API abuse detected"
    }
  },
  {
    method: 'GET',
    path: '/v1/admin/payments',
    personasAllowed: ['Platform Admin'],
    description: 'List all subscription payments, Stripe invoices, and revenue reconciliations platform-wide.'
  },
  {
    method: 'POST',
    path: '/v1/admin/payments/{payment_id}/refund',
    personasAllowed: ['Platform Admin'],
    description: 'Issue partial or full refund for a payment invoice (logs to audit table).',
    sampleRequestBody: {
      amount_usd: 49.00,
      reason: "Customer plan downgrade credit"
    }
  },
  {
    method: 'GET',
    path: '/v1/admin/usage/rollup',
    personasAllowed: ['Platform Admin'],
    description: 'Platform-wide aggregated token throughput, gross cost vs. routed savings, and latency percentiles.'
  },
  {
    method: 'POST',
    path: '/v1/admin/catalog/models',
    personasAllowed: ['Platform Admin'],
    description: 'Add a new AI model or tool to the live catalog without restarting the router.',
    sampleRequestBody: {
      id: "mistral-large-3",
      name: "Mistral Large 3",
      provider: "mistral",
      tier: "frontier",
      input_price_per_m: 2.00,
      output_price_per_m: 6.00,
      context_window_tokens: 128000,
      quality_score: 92
    }
  },
  {
    method: 'POST',
    path: '/v1/admin/catalog/models/{id}/disable',
    personasAllowed: ['Platform Admin'],
    description: 'Disable a model from the active routing matrix during maintenance.',
    sampleRequestBody: {
      reason: "Provider upstream maintenance"
    }
  },
  {
    method: 'POST',
    path: '/v1/admin/catalog/providers/credentials',
    personasAllowed: ['Platform Admin'],
    description: 'Set or update platform-wide provider API keys stored in encrypted vault.',
    sampleRequestBody: {
      provider: "anthropic",
      api_key_masked: "sk-ant-api03-xxxx...984a",
      vault_status: "configured"
    }
  },
  {
    method: 'GET',
    path: '/v1/health',
    personasAllowed: ['Guest', 'User', 'Team Member', 'Team Admin', 'Platform Admin'],
    description: 'System liveness, catalog health, quality model status, and uptime check.'
  }
];

export interface ApiResponse<T = any> {
  status: number;
  data: T;
  headers: Record<string, string>;
  latencyMs: number;
  timestamp: string;
}

export class WhyOrApiService {
  public qualityTracker: QualityModelTracker;
  public decisionEngine: ThompsonDecisionEngine;
  public feedbackEngine: FeedbackEngine;
  public ledgerEngine: ContextLedgerEngine;

  private models: AIModel[] = [...INITIAL_AI_MODELS];
  private users = [...PERSONA_PROFILES];
  private teams = [INITIAL_TEAM_ACCOUNT];
  private payments = [...INITIAL_PAYMENTS];
  private guestDailyCount = 4; // Simulated guest usage

  constructor() {
    this.qualityTracker = new QualityModelTracker(this.models);
    this.decisionEngine = new ThompsonDecisionEngine(this.qualityTracker);
    this.feedbackEngine = new FeedbackEngine(this.qualityTracker);
    this.ledgerEngine = new ContextLedgerEngine();
  }

  public async executeEndpoint(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    caller: UserPersona,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    const start = performance.now();

    // 1. Health check
    if (path === '/v1/health') {
      return {
        status: 200,
        data: {
          status: 'healthy',
          version: '0.1.0-pre-production',
          domain: 'ai.whyor.in',
          classifier_mode: 'V2_Centroid_Softmax',
          router_engine: 'Thompson_Sampling_Beta_Bernoulli',
          catalog_models_active: this.models.filter(m => m.status === 'active').length,
          context_ledger_chain_valid: (await this.ledgerEngine.verifyChain()).isValid,
          uptime_seconds: 1845920,
          timestamp: new Date().toISOString()
        },
        headers: { 'content-type': 'application/json', 'x-whyor-cluster': 'us-west2-a' },
        latencyMs: Math.round(performance.now() - start + 8),
        timestamp: new Date().toISOString()
      };
    }

    // 2. Dispatch
    if (path === '/v1/dispatch' && method === 'POST') {
      const prompt = body?.prompt || '';
      const qualityThreshold = body?.quality_threshold || (caller.role === 'guest' ? 0.60 : 0.75);
      const projectId = body?.project_id;
      const scopeId = caller.role === 'guest' ? `guest:${headers?.['x-guest-session'] || 'sess_1'}` : (caller.teamId ? `team:${caller.teamId}${projectId ? `:${projectId}` : ''}` : `user:${caller.id}`);

      // Check guest rate limit
      if (caller.role === 'guest') {
        const limit = PERSONA_POLICIES.guest.rateLimitPerDay || 20;
        if (this.guestDailyCount >= limit) {
          return {
            status: 429,
            data: { error: 'Rate limit exceeded', message: `Guest daily quota (${limit}/day) reached. Upgrade to a User account for unlimited routing.` },
            headers: { 'retry-after': '3600' },
            latencyMs: 12,
            timestamp: new Date().toISOString()
          };
        }
        this.guestDailyCount++;
      }

      // Step 1: Soft Probabilistic Classification
      const taskDistribution = softClassifier.classify(prompt);

      // Step 2: Resolve Allowed Tiers
      const allowedTiers = allowedTiersFor(caller, 'frontier');

      // Step 3: Thompson Sampling Model Selection
      const decision = this.decisionEngine.selectModel(
        this.models,
        taskDistribution,
        allowedTiers,
        qualityThreshold,
        Math.ceil(prompt.length / 3.8),
        350
      );

      // Step 4: Execute via Adapter
      const adapter = adapterRegistry.getAdapter(decision.chosenModel.provider);
      const completion = await adapter.complete({
        prompt,
        model: decision.chosenModel,
        rehydratedLedger: this.ledgerEngine.rehydrate(scopeId)
      });

      // Step 5: Append to Context Ledger if persistence allowed
      let ledgerPersisted = false;
      let ledgerItem: StructuredLedgerItem | undefined;
      const canPersist = PERSONA_POLICIES[caller.role].canPersistLedger;

      if (canPersist) {
        ledgerItem = await this.ledgerEngine.appendEntry(
          scopeId,
          'decision',
          'routed_task',
          JSON.stringify({
            archetype: decision.primaryArchetype,
            model: decision.chosenModel.id,
            tokens: completion.totalTokens,
            sampledQuality: decision.sampledQuality
          }),
          {
            modelId: decision.chosenModel.id,
            taskArchetype: decision.primaryArchetype,
            promptSnippet: prompt.slice(0, 60)
          }
        );
        ledgerPersisted = true;
      }

      const dispatchId = `disp_${Math.random().toString(36).slice(2, 10)}`;

      return {
        status: 200,
        data: {
          dispatch_id: dispatchId,
          text: completion.text,
          provider: decision.chosenModel.provider,
          model: decision.chosenModel.id,
          task_archetype: decision.primaryArchetype,
          archetype_probabilities: decision.taskProbabilities,
          expected_quality: decision.expectedQuality,
          sampled_quality: decision.sampledQuality,
          quality_confidence: decision.confidence,
          explored: decision.explored,
          actual_cost_usd: completion.costUsd,
          latency_ms: completion.latencyMs,
          ledger_persisted: ledgerPersisted,
          ledger_item_id: ledgerItem?.id,
          routing_reason: decision.routingReason
        },
        headers: {
          'content-type': 'application/json',
          'x-dispatch-id': dispatchId,
          'x-model-routed': decision.chosenModel.id
        },
        latencyMs: Math.round(performance.now() - start),
        timestamp: new Date().toISOString()
      };
    }

    // 3. Feedback
    if (path === '/v1/feedback' && method === 'POST') {
      const dispatchId = body?.dispatch_id || 'disp_unknown';
      const signalType: FeedbackSignalType = body?.signal_type || 'EXPLICIT_THUMBS';
      const isSuccess = body?.is_success !== undefined ? Boolean(body.is_success) : true;
      const notes = body?.notes;

      const event = this.feedbackEngine.applyFeedback(
        dispatchId,
        'multi_step_reasoning',
        'anthropic',
        'claude-3-7-sonnet',
        signalType,
        isSuccess,
        caller.role,
        notes
      );

      return {
        status: 200,
        data: {
          status: 'feedback_recorded',
          event_id: event.id,
          dispatch_id: dispatchId,
          signal_type: signalType,
          weight_applied: event.weight,
          posterior_updated: true,
          message: 'Bayesian Beta(α, β) posterior successfully updated.'
        },
        headers: { 'content-type': 'application/json' },
        latencyMs: Math.round(performance.now() - start + 14),
        timestamp: new Date().toISOString()
      };
    }

    // 4. Team Usage
    if (path.includes('/v1/team/') && path.endsWith('/usage')) {
      if (!PERSONA_POLICIES[caller.role].canViewTeamUsage) {
        return {
          status: 403,
          data: { error: 'Forbidden', message: 'Caller role lacks permission to view team-wide usage metrics.' },
          headers: {},
          latencyMs: 10,
          timestamp: new Date().toISOString()
        };
      }
      return {
        status: 200,
        data: {
          team_id: caller.teamId || 'team_quantum_ai',
          billing_cycle: '2026-08',
          monthly_spend_usd: 1240.50,
          budget_cap_usd: 4000.00,
          total_tokens_routed: 48920000,
          tier_breakdown: { low: 45, mid: 32, high: 18, frontier: 5 },
          members: [
            { id: 'usr_102', email: 'alex.kumar@quantum.ai', spend_usd: 480.20, tokens: 18200000, tier_cap: 'frontier' },
            { id: 'usr_103', email: 'sarah.lin@quantum.ai', spend_usd: 320.10, tokens: 14100000, tier_cap: 'high' },
            { id: 'usr_104', email: 'david.ross@quantum.ai', spend_usd: 440.20, tokens: 16620000, tier_cap: 'frontier' }
          ]
        },
        headers: { 'content-type': 'application/json' },
        latencyMs: 22,
        timestamp: new Date().toISOString()
      };
    }

    // 5. Admin Endpoints Check
    if (path.startsWith('/v1/admin')) {
      if (!PERSONA_POLICIES[caller.role].canViewPlatformAdmin) {
        return {
          status: 403,
          data: { error: 'Forbidden', message: 'Platform Admin permissions required.' },
          headers: {},
          latencyMs: 12,
          timestamp: new Date().toISOString()
        };
      }

      if (path === '/v1/admin/users') {
        return {
          status: 200,
          data: { users: this.users, total: this.users.length },
          headers: { 'content-type': 'application/json' },
          latencyMs: 18,
          timestamp: new Date().toISOString()
        };
      }

      if (path.includes('/v1/admin/users/') && path.endsWith('/deactivate')) {
        const userId = path.split('/')[4];
        auditLogger.logAction(caller, 'USER_DEACTIVATE', 'user', userId, { reason: body?.reason });
        return {
          status: 200,
          data: { status: 'user_deactivated', user_id: userId, audit_logged: true },
          headers: { 'content-type': 'application/json' },
          latencyMs: 30,
          timestamp: new Date().toISOString()
        };
      }

      if (path === '/v1/admin/payments') {
        return {
          status: 200,
          data: { payments: this.payments, total: this.payments.length },
          headers: { 'content-type': 'application/json' },
          latencyMs: 20,
          timestamp: new Date().toISOString()
        };
      }

      if (path.includes('/v1/admin/payments/') && path.endsWith('/refund')) {
        const paymentId = path.split('/')[4];
        auditLogger.logAction(caller, 'PAYMENT_REFUND', 'payment', paymentId, { amount_usd: body?.amount_usd, reason: body?.reason });
        return {
          status: 200,
          data: { status: 'refund_processed', payment_id: paymentId, amount_usd: body?.amount_usd, audit_logged: true },
          headers: { 'content-type': 'application/json' },
          latencyMs: 35,
          timestamp: new Date().toISOString()
        };
      }

      if (path === '/v1/admin/usage/rollup') {
        return {
          status: 200,
          data: {
            total_dispatches: 184520,
            active_models: this.models.filter(m => m.status === 'active').length,
            total_tokens_routed: 842000000,
            total_tokens_saved: 545000000,
            total_cost_saved_usd: 124890.50,
            avg_latency_ms: 218,
            top_routed_tier: 'mid'
          },
          headers: { 'content-type': 'application/json' },
          latencyMs: 25,
          timestamp: new Date().toISOString()
        };
      }

      if (path === '/v1/admin/catalog/models' && method === 'POST') {
        const newModel: AIModel = {
          id: body?.id || `custom-${Date.now()}`,
          name: body?.name || 'Custom Model',
          provider: body?.provider || 'custom',
          providerDisplayName: body?.provider || 'Custom Provider',
          tier: body?.tier || 'mid',
          tierLabel: `${body?.tier || 'Mid'} Tier`,
          inputPricePerM: body?.input_price_per_m || 0.5,
          outputPricePerM: body?.output_price_per_m || 1.5,
          contextWindowTokens: body?.context_window_tokens || 128000,
          capabilities: { code: true, vision: false, reasoning: true, functionCalling: true, jsonOutput: true, longContext: true },
          latencyAvgMs: 240,
          qualityBenchmarkScore: body?.quality_score || 88,
          status: 'active',
          description: 'Dynamically registered catalog model.',
          recommendedFor: ['Routine Tasks', 'Code']
        };
        this.models.push(newModel);
        this.qualityTracker.seedTierPriors([newModel]);
        auditLogger.logAction(caller, 'CATALOG_ADD_MODEL', 'model', newModel.id, { model: newModel });
        return {
          status: 201,
          data: { status: 'model_added_to_catalog', model: newModel, audit_logged: true },
          headers: { 'content-type': 'application/json' },
          latencyMs: 40,
          timestamp: new Date().toISOString()
        };
      }

      if (path.includes('/v1/admin/catalog/models/') && path.endsWith('/disable')) {
        const modelId = path.split('/')[5];
        const m = this.models.find(mod => mod.id === modelId);
        if (m) m.status = 'maintenance';
        auditLogger.logAction(caller, 'CATALOG_DISABLE_MODEL', 'model', modelId, { reason: body?.reason });
        return {
          status: 200,
          data: { status: 'model_disabled', model_id: modelId, audit_logged: true },
          headers: { 'content-type': 'application/json' },
          latencyMs: 30,
          timestamp: new Date().toISOString()
        };
      }

      if (path === '/v1/admin/catalog/providers/credentials' && method === 'POST') {
        auditLogger.logAction(caller, 'SET_PROVIDER_CREDENTIALS', 'provider', body?.provider, { masked: body?.api_key_masked });
        return {
          status: 200,
          data: { status: 'credentials_vaulted', provider: body?.provider, encrypted: true, audit_logged: true },
          headers: { 'content-type': 'application/json' },
          latencyMs: 45,
          timestamp: new Date().toISOString()
        };
      }
    }

    // Default fallback
    return {
      status: 200,
      data: { status: 'ok', endpoint: path, method, caller_role: caller.role },
      headers: { 'content-type': 'application/json' },
      latencyMs: 15,
      timestamp: new Date().toISOString()
    };
  }
}

export const apiService = new WhyOrApiService();
