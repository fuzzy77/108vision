/**
 * @aia/shared — Shared types, constants, and utilities for the AIA Platform.
 */
export declare const MODEL_TIERS: {
    readonly FAST_CHEAP: "fast-cheap";
    readonly BALANCED: "balanced";
    readonly POWERFUL: "powerful";
    readonly EMBEDDING: "embedding";
};
export type ModelTier = (typeof MODEL_TIERS)[keyof typeof MODEL_TIERS];
export declare const USER_ROLES: {
    readonly PLATFORM_ADMIN: "platform_admin";
    readonly TENANT_ADMIN: "tenant_admin";
    readonly TENANT_OPERATOR: "tenant_operator";
    readonly CLIENT_USER: "client_user";
};
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export declare const TENANT_STATUS: {
    readonly ACTIVE: "active";
    readonly SUSPENDED: "suspended";
    readonly TRIAL: "trial";
    readonly CANCELLED: "cancelled";
};
export type TenantStatus = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];
export declare const CHANNELS: {
    readonly WEB: "web";
    readonly API: "api";
    readonly WHATSAPP: "whatsapp";
    readonly WIDGET: "widget";
};
export type Channel = (typeof CHANNELS)[keyof typeof CHANNELS];
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
export interface ApiError {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}
export declare class AppError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: Record<string, unknown> | undefined;
    constructor(code: string, message: string, statusCode?: number, details?: Record<string, unknown> | undefined);
    toJSON(): ApiError;
}
export declare const PRINCIPLE_IDS: readonly ["ownership_markers", "ask_before_proceed", "explain_reasoning", "declare_uncertainty", "checkpoint_irreversible", "no_decide_for_user", "act_only_when_needed", "evaluate_risk_benefit", "persistent_memory", "context_awareness", "token_efficiency"];
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
export type Result<T, E = AppError> = {
    success: true;
    data: T;
} | {
    success: false;
    error: E;
};
export declare function success<T>(data: T): Result<T, never>;
export declare function failure<E>(error: E): Result<never, E>;
//# sourceMappingURL=index.d.ts.map