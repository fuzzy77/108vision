/**
 * Action Risk System.
 *
 * Classifies AI agent actions into risk levels and manages approval workflows.
 *
 * Risk levels:
 * - read_only: Never requires approval (viewing data)
 * - low_risk:  Configurable per tenant (marking read, moving)
 * - high_risk: Always requires explicit user approval (sending, deleting)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RiskLevel = 'read_only' | 'low_risk' | 'high_risk';

export interface ActionRequest {
  id: string;
  tenantId: string;
  userId: string;
  agentId: string;
  action: string;
  riskLevel: RiskLevel;
  description: string;
  parameters: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'executed';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface TenantActionConfig {
  autoApproveLowRisk: boolean;
  autoApproveTimeout: number; // seconds before auto-rejecting pending requests
  notifyOnHighRisk: boolean;
  allowedActions?: string[]; // whitelist of allowed actions; empty = all allowed
  blockedActions?: string[]; // blacklist of blocked actions
}

// ---------------------------------------------------------------------------
// Risk Classification Map
// ---------------------------------------------------------------------------

export const ACTION_RISK_MAP: Record<string, RiskLevel> = {
  // Email actions
  'email.read': 'read_only',
  'email.search': 'read_only',
  'email.list_folders': 'read_only',
  'email.get_message': 'read_only',
  'email.get_thread': 'read_only',
  'email.mark_read': 'low_risk',
  'email.move': 'low_risk',
  'email.draft': 'low_risk',
  'email.send': 'high_risk',
  'email.reply': 'high_risk',
  'email.delete': 'high_risk',

  // File actions (future)
  'file.read': 'read_only',
  'file.list': 'read_only',
  'file.write': 'high_risk',
  'file.delete': 'high_risk',

  // Browser actions (future)
  'browser.navigate': 'read_only',
  'browser.screenshot': 'read_only',
  'browser.click': 'low_risk',
  'browser.fill_form': 'high_risk',
  'browser.submit': 'high_risk',

  // Calendar actions (future)
  'calendar.read': 'read_only',
  'calendar.create_event': 'high_risk',
  'calendar.update_event': 'high_risk',
  'calendar.delete_event': 'high_risk',
};

// ---------------------------------------------------------------------------
// Default tenant configuration
// ---------------------------------------------------------------------------

export const DEFAULT_TENANT_ACTION_CONFIG: TenantActionConfig = {
  autoApproveLowRisk: true,
  autoApproveTimeout: 300, // 5 minutes
  notifyOnHighRisk: true,
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Classify an action into a risk level.
 * Unknown actions default to high_risk for safety.
 */
export function classifyAction(action: string): RiskLevel {
  return ACTION_RISK_MAP[action] ?? 'high_risk';
}

/**
 * Determine if an action should be auto-approved based on risk level
 * and tenant configuration.
 *
 * Logic:
 * - read_only: always auto-approved
 * - low_risk: auto-approved if tenant config allows
 * - high_risk: never auto-approved
 */
export function shouldAutoApprove(riskLevel: RiskLevel, tenantConfig: TenantActionConfig): boolean {
  switch (riskLevel) {
    case 'read_only':
      return true;
    case 'low_risk':
      return tenantConfig.autoApproveLowRisk;
    case 'high_risk':
      return false;
  }
}

/**
 * Check if an action is blocked by tenant configuration.
 */
export function isActionBlocked(action: string, tenantConfig: TenantActionConfig): boolean {
  // Check explicit blocklist
  if (tenantConfig.blockedActions && tenantConfig.blockedActions.includes(action)) {
    return true;
  }

  // Check allowlist (if set, only listed actions are allowed)
  if (tenantConfig.allowedActions && tenantConfig.allowedActions.length > 0) {
    return !tenantConfig.allowedActions.includes(action);
  }

  return false;
}

/**
 * Create an action request object (in-memory; persistence handled by the gateway).
 */
export function createActionRequest(params: {
  id: string;
  tenantId: string;
  userId: string;
  agentId: string;
  action: string;
  description: string;
  parameters: Record<string, unknown>;
}): ActionRequest {
  const riskLevel = classifyAction(params.action);

  return {
    id: params.id,
    tenantId: params.tenantId,
    userId: params.userId,
    agentId: params.agentId,
    action: params.action,
    riskLevel,
    description: params.description,
    parameters: params.parameters,
    status: 'pending',
    createdAt: new Date(),
  };
}

/**
 * Resolve an action request (approve or reject).
 */
export function resolveAction(
  request: ActionRequest,
  decision: 'approved' | 'rejected',
  resolvedBy: string,
): ActionRequest {
  return {
    ...request,
    status: decision,
    resolvedAt: new Date(),
    resolvedBy,
  };
}

/**
 * Get a human-readable description of why an action requires approval.
 */
export function getApprovalReason(action: string, riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'high_risk':
      return `Action "${action}" can modify external data or send communications. User approval is required before execution.`;
    case 'low_risk':
      return `Action "${action}" makes minor changes. Approval may be required based on your settings.`;
    case 'read_only':
      return `Action "${action}" only reads data and does not require approval.`;
  }
}
