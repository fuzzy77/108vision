/**
 * @aia/shared — Shared types, constants, and utilities for the AIA Platform.
 */
// --- Constants ---
export const MODEL_TIERS = {
    FAST_CHEAP: 'fast-cheap',
    BALANCED: 'balanced',
    POWERFUL: 'powerful',
    EMBEDDING: 'embedding',
};
export const USER_ROLES = {
    PLATFORM_ADMIN: 'platform_admin',
    TENANT_ADMIN: 'tenant_admin',
    TENANT_OPERATOR: 'tenant_operator',
    CLIENT_USER: 'client_user',
};
export const TENANT_STATUS = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    TRIAL: 'trial',
    CANCELLED: 'cancelled',
};
export const CHANNELS = {
    WEB: 'web',
    API: 'api',
    WHATSAPP: 'whatsapp',
    WIDGET: 'widget',
};
export class AppError extends Error {
    code;
    statusCode;
    details;
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
    }
    toJSON() {
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
];
export function success(data) {
    return { success: true, data };
}
export function failure(error) {
    return { success: false, error };
}
//# sourceMappingURL=index.js.map