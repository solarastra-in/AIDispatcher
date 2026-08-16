import { EmailTemplateConfig } from './firebase';

export const DEFAULT_EMAIL_TEMPLATES: Record<string, EmailTemplateConfig> = {
  quota_alert: {
    id: 'quota_alert',
    name: 'Monthly Token Quota & Budget Alert',
    category: 'billing',
    description: 'Triggered when a company or team reaches 80% or 100% of their monthly token or dollar budget cap.',
    subject: '⚠️ [WhyOr Quota Alert] {{company_name}} Monthly Token Budget at {{threshold_percentage}}%',
    variables: [
      '{{recipient_name}}',
      '{{recipient_email}}',
      '{{company_name}}',
      '{{threshold_percentage}}',
      '{{current_spend}}',
      '{{budget_limit}}',
      '{{tokens_used}}',
      '{{fallback_route}}',
      '{{timestamp}}',
      '{{custom_message}}',
      '{{action_url}}',
    ],
    htmlBody: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #334155; overflow: hidden; padding: 28px;">
  <!-- Header -->
  <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px;">
    <div style="font-size: 20px; font-weight: 800; color: #818cf8; letter-spacing: -0.5px;">⚡ WhyOr Dispatch AI</div>
    <span style="background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 11px; padding: 4px 10px; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">
      Threshold Warning ({{threshold_percentage}}%)
    </span>
  </div>

  <!-- Body Content -->
  <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
    <p style="margin-top: 0;">Attention <strong>{{recipient_name}}</strong>,</p>
    <p>Your team at <strong>{{company_name}}</strong> has reached <strong style="color: #fbbf24;">{{threshold_percentage}}%</strong> of your monthly allocated model budget.</p>
    
    <!-- Spend Metrics Card -->
    <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Organization:</span>
        <span style="font-weight: 600; color: #f8fafc; font-size: 12px; font-family: monospace;">{{company_name}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Current Billed Spend:</span>
        <span style="font-weight: 700; color: #fbbf24; font-size: 13px; font-family: monospace;">{{current_spend}} / {{budget_limit}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Tokens Consumed:</span>
        <span style="font-weight: 600; color: #38bdf8; font-size: 12px; font-family: monospace;">{{tokens_used}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0;">
        <span style="color: #94a3b8; font-size: 12px;">Autonomous Fallback:</span>
        <span style="font-weight: 600; color: #34d399; font-size: 12px; font-family: monospace;">{{fallback_route}}</span>
      </div>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      {{custom_message}}
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="{{action_url}}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 10px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
        Review Team Token Governance &rarr;
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top: 28px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
    WhyOr Dispatch AI Enterprise • SuperAdmin Governance: solarastra.in@gmail.com • Generated at {{timestamp}}
  </div>
</div>`,
    textBody: `[WhyOr Quota Alert] {{company_name}} Monthly Token Budget at {{threshold_percentage}}%

Attention {{recipient_name}},

Your team at {{company_name}} has reached {{threshold_percentage}}% of your monthly allocated model budget.

Spend Summary:
- Current Billed Spend: {{current_spend}} / {{budget_limit}}
- Tokens Consumed: {{tokens_used}}
- Autonomous Fallback: {{fallback_route}}

{{custom_message}}

Review governance settings: {{action_url}}

--
WhyOr Dispatch AI Enterprise • SuperAdmin: solarastra.in@gmail.com • {{timestamp}}`,
  },

  billing_invoice: {
    id: 'billing_invoice',
    name: 'Monthly Billing & Subscription Invoice Summary',
    category: 'billing',
    description: 'Monthly summary notification detailing total dispatched tokens, flat-rate subscription savings, and billed amounts.',
    subject: '📄 [WhyOr Billing] Monthly Invoice & Flat-Rate Subscription Summary - {{billing_period}}',
    variables: [
      '{{recipient_name}}',
      '{{recipient_email}}',
      '{{company_name}}',
      '{{billing_period}}',
      '{{invoice_id}}',
      '{{total_amount}}',
      '{{flat_rate_savings}}',
      '{{dispatched_requests}}',
      '{{subscription_tier}}',
      '{{timestamp}}',
      '{{custom_message}}',
      '{{action_url}}',
    ],
    htmlBody: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #334155; overflow: hidden; padding: 28px;">
  <!-- Header -->
  <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px;">
    <div style="font-size: 20px; font-weight: 800; color: #818cf8; letter-spacing: -0.5px;">⚡ WhyOr Dispatch AI</div>
    <span style="background-color: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); font-size: 11px; padding: 4px 10px; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">
      Paid & Verified
    </span>
  </div>

  <!-- Body Content -->
  <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
    <p style="margin-top: 0;">Hello <strong>{{recipient_name}}</strong>,</p>
    <p>Your enterprise billing receipt and subscription summary for <strong>{{billing_period}}</strong> is ready for review.</p>

    <!-- Invoice Details Table -->
    <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Invoice Reference:</span>
        <span style="font-weight: 600; color: #f8fafc; font-size: 12px; font-family: monospace;">{{invoice_id}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Active Plan:</span>
        <span style="font-weight: 700; color: #a855f7; font-size: 12px; font-family: monospace;">{{subscription_tier}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Dispatched Prompt Requests:</span>
        <span style="font-weight: 600; color: #38bdf8; font-size: 12px; font-family: monospace;">{{dispatched_requests}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Flat-Rate Zero-Markup Savings:</span>
        <span style="font-weight: 700; color: #34d399; font-size: 13px; font-family: monospace;">+{{flat_rate_savings}} saved</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; margin-top: 4px;">
        <span style="color: #f8fafc; font-weight: 700; font-size: 14px;">Total Billed Amount:</span>
        <span style="font-weight: 800; color: #818cf8; font-size: 16px; font-family: monospace;">{{total_amount}}</span>
      </div>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      {{custom_message}}
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="{{action_url}}" style="display: inline-block; background: linear-block(135deg, #6366f1, #4f46e5); background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 10px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
        Download Full PDF Statement &rarr;
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top: 28px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
    WhyOr Dispatch AI Enterprise • SuperAdmin: solarastra.in@gmail.com • Generated at {{timestamp}}
  </div>
</div>`,
    textBody: `[WhyOr Billing] Monthly Invoice & Flat-Rate Subscription Summary - {{billing_period}}

Hello {{recipient_name}},

Your enterprise billing receipt for {{company_name}} ({{billing_period}}) is available:

- Invoice ID: {{invoice_id}}
- Subscription Tier: {{subscription_tier}}
- Dispatched Requests: {{dispatched_requests}}
- Flat-Rate Zero-Markup Savings: {{flat_rate_savings}}
- Total Billed: {{total_amount}}

{{custom_message}}

View statement: {{action_url}}

--
WhyOr Dispatch AI Enterprise • SuperAdmin: solarastra.in@gmail.com • {{timestamp}}`,
  },

  failover_alert: {
    id: 'failover_alert',
    name: 'Autonomous Routing Failover Incident Alert',
    category: 'system',
    description: 'Real-time alert sent when an AI provider returns rate-limit, outage 5xx, or context errors and WhyOr auto-fails over to another model or gateway.',
    subject: '🚨 [WhyOr Dispatch] Autonomous Routing Failover: {{failed_provider}} ➔ {{fallback_provider}}',
    variables: [
      '{{recipient_name}}',
      '{{company_name}}',
      '{{failed_provider}}',
      '{{fallback_provider}}',
      '{{reason}}',
      '{{latency_ms}}',
      '{{affected_requests}}',
      '{{timestamp}}',
      '{{custom_message}}',
      '{{action_url}}',
    ],
    htmlBody: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #334155; overflow: hidden; padding: 28px;">
  <!-- Header -->
  <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px;">
    <div style="font-size: 20px; font-weight: 800; color: #f43f5e; letter-spacing: -0.5px;">🚨 WhyOr Dispatch AI</div>
    <span style="background-color: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); font-size: 11px; padding: 4px 10px; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">
      Auto-Failover Active
    </span>
  </div>

  <!-- Body Content -->
  <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
    <p style="margin-top: 0;">Attention SuperAdmin / Enterprise Engineer,</p>
    <p>The autonomous dispatch engine detected upstream unresponsiveness from <strong style="color: #f43f5e;">{{failed_provider}}</strong> and automatically rerouted traffic to <strong style="color: #34d399;">{{fallback_provider}}</strong> without user disruption.</p>

    <!-- Incident Diagram Box -->
    <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Triggering Failure:</span>
        <span style="font-weight: 700; color: #f43f5e; font-size: 12px; font-family: monospace;">{{failed_provider}} ({{reason}})</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Failover Destination:</span>
        <span style="font-weight: 700; color: #34d399; font-size: 12px; font-family: monospace;">{{fallback_provider}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Reroute Latency:</span>
        <span style="font-weight: 600; color: #38bdf8; font-size: 12px; font-family: monospace;">{{latency_ms}}ms</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0;">
        <span style="color: #94a3b8; font-size: 12px;">Impacted In-Flight Prompts:</span>
        <span style="font-weight: 600; color: #f8fafc; font-size: 12px; font-family: monospace;">{{affected_requests}} (100% Recovered)</span>
      </div>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      {{custom_message}}
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="{{action_url}}" style="display: inline-block; background-color: #e11d48; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 10px; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4);">
        Inspect Dispatch Ledger &rarr;
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top: 28px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
    WhyOr Dispatch AI Enterprise • SuperAdmin: solarastra.in@gmail.com • Event Logged: {{timestamp}}
  </div>
</div>`,
    textBody: `[WhyOr Dispatch] Autonomous Routing Failover Triggered

Failed Provider: {{failed_provider}} (Reason: {{reason}})
Fallback Route: {{fallback_provider}}
Failover Latency: {{latency_ms}}ms
Impacted In-Flight Prompts: {{affected_requests}} (100% Recovered)

{{custom_message}}

Inspect telemetry logs: {{action_url}}

--
WhyOr Dispatch AI Enterprise • SuperAdmin: solarastra.in@gmail.com • {{timestamp}}`,
  },

  security_audit: {
    id: 'security_audit',
    name: 'Company Security Vault & Key Rotation Audit',
    category: 'security',
    description: 'Notification triggered when API credentials, SMTP config, or team authorization policies are created or updated.',
    subject: '🔒 [WhyOr Security] Security Vault Update Audit: {{event_type}}',
    variables: [
      '{{recipient_name}}',
      '{{event_type}}',
      '{{actor_email}}',
      '{{ip_address}}',
      '{{modified_provider}}',
      '{{timestamp}}',
      '{{custom_message}}',
      '{{action_url}}',
    ],
    htmlBody: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #334155; overflow: hidden; padding: 28px;">
  <!-- Header -->
  <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px;">
    <div style="font-size: 20px; font-weight: 800; color: #38bdf8; letter-spacing: -0.5px;">🔒 WhyOr Security Vault</div>
    <span style="background-color: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 11px; padding: 4px 10px; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">
      Audit Trail
    </span>
  </div>

  <!-- Body Content -->
  <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
    <p style="margin-top: 0;">Enterprise Security Notice,</p>
    <p>A credential update or governance configuration modification was recorded in the <strong>WhyOr Enterprise Vault</strong>.</p>

    <!-- Audit Details Box -->
    <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Action Type:</span>
        <span style="font-weight: 700; color: #38bdf8; font-size: 12px; font-family: monospace;">{{event_type}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Actor Email:</span>
        <span style="font-weight: 600; color: #f8fafc; font-size: 12px; font-family: monospace;">{{actor_email}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Provider / Scope:</span>
        <span style="font-weight: 600; color: #a855f7; font-size: 12px; font-family: monospace;">{{modified_provider}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0;">
        <span style="color: #94a3b8; font-size: 12px;">Dispatched Timestamp:</span>
        <span style="font-weight: 600; color: #94a3b8; font-size: 12px; font-family: monospace;">{{timestamp}}</span>
      </div>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      {{custom_message}}
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="{{action_url}}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 10px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);">
        View Enterprise Audit Ledger &rarr;
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top: 28px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
    WhyOr Dispatch AI Enterprise • SuperAdmin: solarastra.in@gmail.com • {{timestamp}}
  </div>
</div>`,
    textBody: `[WhyOr Security] Security Vault Update Audit: {{event_type}}

Action: {{event_type}}
Actor: {{actor_email}}
Provider/Scope: {{modified_provider}}
Timestamp: {{timestamp}}

{{custom_message}}

Review audit ledger: {{action_url}}

--
WhyOr Dispatch AI Enterprise • SuperAdmin: solarastra.in@gmail.com`,
  },

  onboarding_invite: {
    id: 'onboarding_invite',
    name: 'Team Member Onboarding & Model Access Grant',
    category: 'onboarding',
    description: 'Welcome email sent to newly invited developers or team members with allocated model quotas.',
    subject: '✨ [WhyOr Dispatch] Welcome to {{company_name}} AI Gateway - Access Credentials & Quota',
    variables: [
      '{{recipient_name}}',
      '{{recipient_email}}',
      '{{company_name}}',
      '{{role}}',
      '{{allocated_tokens}}',
      '{{authorized_models}}',
      '{{login_url}}',
      '{{timestamp}}',
      '{{custom_message}}',
    ],
    htmlBody: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #334155; overflow: hidden; padding: 28px;">
  <!-- Header -->
  <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px;">
    <div style="font-size: 20px; font-weight: 800; color: #818cf8; letter-spacing: -0.5px;">⚡ WhyOr Dispatch AI</div>
    <span style="background-color: rgba(99, 102, 241, 0.15); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.3); font-size: 11px; padding: 4px 10px; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">
      Access Invitation
    </span>
  </div>

  <!-- Body Content -->
  <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
    <p style="margin-top: 0;">Hello <strong>{{recipient_name}}</strong>,</p>
    <p>You have been granted access to the <strong>WhyOr Dispatch AI Enterprise Gateway</strong> for <strong>{{company_name}}</strong> by SuperAdmin <strong>solarastra.in@gmail.com</strong>.</p>

    <!-- Access Credentials Box -->
    <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Assigned Role:</span>
        <span style="font-weight: 700; color: #a855f7; font-size: 12px; font-family: monospace;">{{role}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Monthly Token Allocation:</span>
        <span style="font-weight: 700; color: #34d399; font-size: 12px; font-family: monospace;">{{allocated_tokens}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Authorized Models:</span>
        <span style="font-weight: 600; color: #38bdf8; font-size: 12px; font-family: monospace;">{{authorized_models}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0;">
        <span style="color: #94a3b8; font-size: 12px;">Routing Priority:</span>
        <span style="font-weight: 600; color: #f8fafc; font-size: 12px; font-family: monospace;">Zero-Markup Flat Rate Subscriptions</span>
      </div>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      {{custom_message}}
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="{{login_url}}" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 10px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
        Sign In with Google SSO &rarr;
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top: 28px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
    WhyOr Dispatch AI Enterprise • SuperAdmin: solarastra.in@gmail.com • {{timestamp}}
  </div>
</div>`,
    textBody: `[WhyOr Dispatch] Welcome to {{company_name}} AI Gateway

Hello {{recipient_name}},

You have been granted access to WhyOr Dispatch AI Enterprise:
- Role: {{role}}
- Allocated Tokens: {{allocated_tokens}}
- Authorized Models: {{authorized_models}}

{{custom_message}}

Sign in: {{login_url}}

--
WhyOr Dispatch AI Enterprise • SuperAdmin: solarastra.in@gmail.com`,
  },

  test_verification: {
    id: 'test_verification',
    name: 'SuperAdmin SMTP Handshake Trial Verification',
    category: 'verification',
    description: 'Immediate trial verification email dispatched during SMTP configuration setup to confirm credentials and socket transport.',
    subject: '✅ [WhyOr Dispatch AI] Live SMTP Test Verification - {{timestamp}}',
    variables: [
      '{{recipient_email}}',
      '{{smtp_host}}',
      '{{smtp_port}}',
      '{{sender_identity}}',
      '{{auth_user}}',
      '{{sent_by}}',
      '{{timestamp}}',
      '{{custom_message}}',
    ],
    htmlBody: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #334155; overflow: hidden; padding: 28px;">
  <!-- Header -->
  <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px;">
    <div style="font-size: 20px; font-weight: 800; color: #818cf8; letter-spacing: -0.5px;">⚡ WhyOr Dispatch AI</div>
    <span style="background-color: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); font-size: 11px; padding: 4px 10px; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">
      SMTP Validated
    </span>
  </div>

  <!-- Body Content -->
  <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
    <p style="margin-top: 0;">Hello <strong>{{recipient_email}}</strong>,</p>
    <p>{{custom_message}}</p>

    <!-- Server Verification Box -->
    <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">SMTP Host:</span>
        <span style="font-weight: 700; color: #f8fafc; font-size: 12px; font-family: monospace;">{{smtp_host}}:{{smtp_port}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Sender Identity:</span>
        <span style="font-weight: 600; color: #38bdf8; font-size: 12px; font-family: monospace;">{{sender_identity}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #334155;">
        <span style="color: #94a3b8; font-size: 12px;">Authenticated User:</span>
        <span style="font-weight: 600; color: #a855f7; font-size: 12px; font-family: monospace;">{{auth_user}}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0;">
        <span style="color: #94a3b8; font-size: 12px;">Dispatched By:</span>
        <span style="font-weight: 600; color: #f8fafc; font-size: 12px; font-family: monospace;">{{sent_by}}</span>
      </div>
    </div>

    <div style="background-color: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #34d399;">
      ✅ <strong>Transport Confirmed:</strong> Handshake, TLS/SSL socket, and SMTP credentials successfully authenticated.
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top: 28px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
    WhyOr Dispatch AI Enterprise • SuperAdmin: solarastra.in@gmail.com • Timestamp: {{timestamp}}
  </div>
</div>`,
    textBody: `[WhyOr Dispatch AI] Live SMTP Test Verification

Recipient: {{recipient_email}}
SMTP Host: {{smtp_host}}:{{smtp_port}}
Sender: {{sender_identity}}
Auth User: {{auth_user}}
Dispatched By: {{sent_by}}
Timestamp: {{timestamp}}

{{custom_message}}

--
WhyOr Dispatch AI Enterprise • SuperAdmin: solarastra.in@gmail.com`,
  },
};

// Sample data for real-time live preview interpolation
export const SAMPLE_TEMPLATE_VARIABLES: Record<string, string> = {
  '{{recipient_name}}': 'SolarAstra Admin',
  '{{recipient_email}}': 'solarastra.in@gmail.com',
  '{{company_name}}': 'SolarAstra Technologies',
  '{{threshold_percentage}}': '85',
  '{{current_spend}}': '$8,500.00',
  '{{budget_limit}}': '$10,000.00',
  '{{tokens_used}}': '42,500,000 tokens',
  '{{fallback_route}}': 'Flat-Rate Subscription Gateway ($0.00/tok markup)',
  '{{billing_period}}': 'August 2026',
  '{{invoice_id}}': 'INV-2026-08-WHYOR-892',
  '{{total_amount}}': '$250.00 / month',
  '{{flat_rate_savings}}': '$1,842.50',
  '{{dispatched_requests}}': '184,920 calls',
  '{{subscription_tier}}': 'Enterprise Zero-Markup Tier (Unlimited Claude 3.7 & GPT-4.5)',
  '{{failed_provider}}': 'Anthropic Direct API (529 Overloaded)',
  '{{fallback_provider}}': 'Gemini 2.5 Pro (Subscription Gateway)',
  '{{reason}}': 'Upstream 529 Capacity Overload',
  '{{latency_ms}}': '142',
  '{{affected_requests}}': '12 requests',
  '{{event_type}}': 'SuperAdmin API Key Rotation & Policy Update',
  '{{actor_email}}': 'solarastra.in@gmail.com',
  '{{ip_address}}': '192.168.1.1',
  '{{modified_provider}}': 'OpenAI & Anthropic Enterprise Vault',
  '{{role}}': 'Enterprise AI Architect',
  '{{allocated_tokens}}': '10,000,000 tokens / month',
  '{{authorized_models}}': 'Gemini 2.5 Pro, Claude 3.7 Sonnet, GPT-4.5',
  '{{login_url}}': 'https://ais-dev-gcdyq3rgswqtgkxcjbfmqt-4552824319.us-west2.run.app',
  '{{action_url}}': 'https://ais-dev-gcdyq3rgswqtgkxcjbfmqt-4552824319.us-west2.run.app',
  '{{smtp_host}}': 'smtp.gmail.com',
  '{{smtp_port}}': '587',
  '{{sender_identity}}': 'WhyOr Dispatch AI Enterprise <solarastra.in@gmail.com>',
  '{{auth_user}}': 'solarastra.in@gmail.com',
  '{{sent_by}}': 'SuperAdmin (solarastra.in@gmail.com)',
  '{{timestamp}}': new Date().toISOString(),
  '{{custom_message}}': 'Automatic notification dispatched via WhyOr Dispatch AI verified SMTP mail gateway.',
};

export function interpolateTemplate(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(key, value || '');
  }
  return result;
}
