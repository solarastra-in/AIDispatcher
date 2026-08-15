import { UserRole, ModelTier, UserPersona } from '../types';

export interface PersonaPolicy {
  role: UserRole;
  name: string;
  defaultAllowedTiers: ModelTier[];
  canBYOK: boolean;
  canPersistLedger: boolean;
  canViewOwnUsage: boolean;
  canViewTeamUsage: boolean;
  canManageTeam: boolean;
  canViewPlatformAdmin: boolean;
  canManageCatalog: boolean;
  canSetPlatformCredentials: boolean;
  rateLimitPerDay?: number;
}

export const PERSONA_POLICIES: Record<UserRole, PersonaPolicy> = {
  guest: {
    role: 'guest',
    name: 'Guest (Anonymous)',
    defaultAllowedTiers: ['low', 'mid'],
    canBYOK: false,
    canPersistLedger: false, // Ephemeral session only
    canViewOwnUsage: false,
    canViewTeamUsage: false,
    canManageTeam: false,
    canViewPlatformAdmin: false,
    canManageCatalog: false,
    canSetPlatformCredentials: false,
    rateLimitPerDay: 20,
  },
  user: {
    role: 'user',
    name: 'Individual User',
    defaultAllowedTiers: ['low', 'mid', 'high', 'frontier', 'deep_reasoning'],
    canBYOK: true,
    canPersistLedger: true,
    canViewOwnUsage: true,
    canViewTeamUsage: false,
    canManageTeam: false,
    canViewPlatformAdmin: false,
    canManageCatalog: false,
    canSetPlatformCredentials: false,
  },
  team_member: {
    role: 'team_member',
    name: 'Team Member',
    defaultAllowedTiers: ['low', 'mid', 'high', 'frontier'],
    canBYOK: false,
    canPersistLedger: true,
    canViewOwnUsage: true,
    canViewTeamUsage: false,
    canManageTeam: false,
    canViewPlatformAdmin: false,
    canManageCatalog: false,
    canSetPlatformCredentials: false,
  },
  team_admin: {
    role: 'team_admin',
    name: 'Team Admin',
    defaultAllowedTiers: ['low', 'mid', 'high', 'frontier', 'deep_reasoning'],
    canBYOK: false,
    canPersistLedger: true,
    canViewOwnUsage: true,
    canViewTeamUsage: true, // Scoped to own team only
    canManageTeam: true,
    canViewPlatformAdmin: false,
    canManageCatalog: false,
    canSetPlatformCredentials: false,
  },
  platform_admin: {
    role: 'platform_admin',
    name: 'Platform Admin (WhyOr Operator)',
    defaultAllowedTiers: ['low', 'mid', 'high', 'frontier', 'deep_reasoning'],
    canBYOK: true,
    canPersistLedger: true,
    canViewOwnUsage: true,
    canViewTeamUsage: true,
    canManageTeam: true,
    canViewPlatformAdmin: true,
    canManageCatalog: true,
    canSetPlatformCredentials: true,
  }
};

const TIER_ORDER: Record<ModelTier, number> = {
  low: 1,
  mid: 2,
  high: 3,
  frontier: 4,
  deep_reasoning: 5,
};

/**
 * Resolve allowed tiers for caller:
 * Intersects persona default tiers with team default tier cap,
 * further intersected with individual member tier cap.
 */
export function allowedTiersFor(
  persona: UserPersona,
  teamDefaultTierCap?: ModelTier,
  memberTierCap?: ModelTier
): ModelTier[] {
  const policy = PERSONA_POLICIES[persona.role];
  let allowed = [...policy.defaultAllowedTiers];

  // Intersect with team default tier cap
  if (teamDefaultTierCap) {
    const maxTeamRank = TIER_ORDER[teamDefaultTierCap];
    allowed = allowed.filter(t => TIER_ORDER[t] <= maxTeamRank);
  }

  // Intersect with individual member tier cap
  if (memberTierCap) {
    const maxMemberRank = TIER_ORDER[memberTierCap];
    allowed = allowed.filter(t => TIER_ORDER[t] <= maxMemberRank);
  }

  return allowed;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetType: 'model' | 'provider' | 'user' | 'payment' | 'team' | 'policy';
  targetId: string;
  details: Record<string, any>;
  timestamp: string;
}

export class AuditLogger {
  private logs: AuditLogItem[] = [];

  public logAction(
    actor: UserPersona,
    action: string,
    targetType: AuditLogItem['targetType'],
    targetId: string,
    details: Record<string, any>
  ): AuditLogItem {
    const item: AuditLogItem = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(item);
    return item;
  }

  public getLogs(): AuditLogItem[] {
    return [...this.logs];
  }
}

export const auditLogger = new AuditLogger();
