/**
 * @aia/shared — Shared types, constants, and utilities for the AIA Platform.
 */

// --- Constants ---

export const MODEL_TIERS = {
  FAST_CHEAP: 'fast-cheap',
  BALANCED: 'balanced',
  POWERFUL: 'powerful',
  EMBEDDING: 'embedding',
} as const;

export type ModelTier = (typeof MODEL_TIERS)[keyof typeof MODEL_TIERS];

export const USER_ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  TENANT_ADMIN: 'tenant_admin',
  TENANT_OPERATOR: 'tenant_operator',
  CLIENT_USER: 'client_user',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const TENANT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TRIAL: 'trial',
  CANCELLED: 'cancelled',
} as const;

export type TenantStatus = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];

export const CHANNELS = {
  WEB: 'web',
  API: 'api',
  WHATSAPP: 'whatsapp',
  WIDGET: 'widget',
} as const;

export type Channel = (typeof CHANNELS)[keyof typeof CHANNELS];

// --- Types ---

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  config: Record<string, unknown>;
  planId: string | null;
  status: TenantStatus;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  name: string | null;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  maxConversationsMonth: number;
  maxKbDocuments: number;
  maxKbSizeMb: number;
  allowedModels: ModelTier[];
  priceEurMonth: number;
  features: Record<string, unknown>;
  isActive: boolean;
}

export interface Conversation {
  id: string;
  tenantId: string;
  userId: string | null;
  title: string | null;
  channel: Channel;
  status: 'active' | 'closed' | 'archived';
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelUsed: string | null;
  tokensUsed: number;
  feedbackScore: -1 | 0 | 1 | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// --- Error Types ---

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON(): ApiError {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

// --- AI Governance Principles ---

export const PRINCIPLE_IDS = [
  'ownership_markers',
  'ask_before_proceed',
  'explain_reasoning',
  'declare_uncertainty',
  'checkpoint_irreversible',
  'no_decide_for_user',
  'act_only_when_needed',
  'evaluate_risk_benefit',
  'persistent_memory',
  'context_awareness',
  'token_efficiency',
] as const;

export type PrincipleId = (typeof PRINCIPLE_IDS)[number];

export interface PrincipleDefinition {
  id: PrincipleId;
  label: string;
  description: string;
  riskWarning: string;
  defaultEnabled: boolean;
}

export type PrincipleOverrides = Partial<Record<PrincipleId, boolean>>;

export interface AgentConfig {
  principlesOverrides?: PrincipleOverrides;
  [key: string]: unknown;
}

// --- Utility Types ---

export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}
