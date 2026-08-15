import { TaskArchetypeId } from './taskTaxonomy';
import { QualityModelTracker } from './qualityModel';

export type FeedbackSignalType = 
  | 'EXPLICIT_THUMBS'
  | 'EXPLICIT_REGENERATE'
  | 'IMPLICIT_SCHEMA_FAIL'
  | 'IMPLICIT_MANUAL_ESCALATION'
  | 'IMPLICIT_IMMEDIATE_RETRY'
  | 'IMPLICIT_CONTINUED_NORMALLY';

export interface FeedbackSignalConfig {
  type: FeedbackSignalType;
  name: string;
  weight: number;
  isPositiveDefault: boolean;
  description: string;
}

export const FEEDBACK_SIGNALS: Record<FeedbackSignalType, FeedbackSignalConfig> = {
  EXPLICIT_THUMBS: {
    type: 'EXPLICIT_THUMBS',
    name: 'Explicit User Rating (Thumbs Up/Down)',
    weight: 1.0,
    isPositiveDefault: true,
    description: 'Direct user feedback rating — highest reliability signal.',
  },
  EXPLICIT_REGENERATE: {
    type: 'EXPLICIT_REGENERATE',
    name: 'Explicit Regenerate Request',
    weight: 0.8,
    isPositiveDefault: false,
    description: 'User requested a complete regeneration of the output.',
  },
  IMPLICIT_SCHEMA_FAIL: {
    type: 'IMPLICIT_SCHEMA_FAIL',
    name: 'Schema / Output Validation Failure',
    weight: 0.6,
    isPositiveDefault: false,
    description: 'Structured output failed JSON schema validation or AST linting.',
  },
  IMPLICIT_MANUAL_ESCALATION: {
    type: 'IMPLICIT_MANUAL_ESCALATION',
    name: 'Manual Tier Escalation',
    weight: 0.5,
    isPositiveDefault: false,
    description: 'Caller manually re-routed to a higher tier immediately after completion.',
  },
  IMPLICIT_IMMEDIATE_RETRY: {
    type: 'IMPLICIT_IMMEDIATE_RETRY',
    name: 'Immediate Fast Retry',
    weight: 0.4,
    isPositiveDefault: false,
    description: 'Caller resubmitted prompt within 5 seconds with minimal modifications.',
  },
  IMPLICIT_CONTINUED_NORMALLY: {
    type: 'IMPLICIT_CONTINUED_NORMALLY',
    name: 'Conversation Continued Normally',
    weight: 0.15,
    isPositiveDefault: true,
    description: 'Session proceeded to next step without complaints — abundant low-weight positive signal.',
  }
};

export interface FeedbackEvent {
  id: string;
  dispatchId: string;
  timestamp: string;
  archetypeId: TaskArchetypeId;
  providerId: string;
  modelId: string;
  signalType: FeedbackSignalType;
  isSuccess: boolean;
  weight: number;
  callerRole: string;
  notes?: string;
}

export class FeedbackEngine {
  private feedbackHistory: FeedbackEvent[] = [];
  private listeners: Array<() => void> = [];

  constructor(private qualityTracker: QualityModelTracker) {}

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public applyFeedback(
    dispatchId: string,
    archetypeId: TaskArchetypeId,
    providerId: string,
    modelId: string,
    signalType: FeedbackSignalType,
    isSuccess?: boolean,
    callerRole = 'user',
    notes?: string
  ): FeedbackEvent {
    const config = FEEDBACK_SIGNALS[signalType];
    const success = isSuccess !== undefined ? isSuccess : config.isPositiveDefault;
    const weight = config.weight;

    // 1. Record outcome in Bayesian quality tracker to update posterior
    this.qualityTracker.recordOutcome(
      archetypeId,
      providerId,
      modelId,
      success,
      weight
    );

    // 2. Log feedback event
    const event: FeedbackEvent = {
      id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      dispatchId,
      timestamp: new Date().toISOString(),
      archetypeId,
      providerId,
      modelId,
      signalType,
      isSuccess: success,
      weight,
      callerRole,
      notes,
    };

    this.feedbackHistory.unshift(event);
    if (this.feedbackHistory.length > 500) {
      this.feedbackHistory.pop();
    }

    this.notify();
    return event;
  }

  public getHistory(): FeedbackEvent[] {
    return this.feedbackHistory;
  }
}
