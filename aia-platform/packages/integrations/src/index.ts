/**
 * @aia/integrations — External service integrations for the AIA Platform.
 *
 * Provides email (IMAP + Microsoft Graph), action risk management,
 * and encryption utilities.
 */

// Types
export type {
  EmailAccount,
  ImapConfig,
  MicrosoftConfig,
  EmailMessage,
  EmailSearchOptions,
  EmailDraft,
  EmailAttachment,
  EmailFolder,
  EmailAddress,
  EmailProvider,
  IntegrationConfig,
} from './types.js';

// Email providers
export { ImapProvider } from './email/imap.provider.js';
export { MicrosoftProvider } from './email/microsoft.provider.js';

// Email service (unified)
export { emailService, getProvider } from './email/email.service.js';

// Action risk system
export {
  type RiskLevel,
  type ActionRequest,
  type TenantActionConfig,
  ACTION_RISK_MAP,
  DEFAULT_TENANT_ACTION_CONFIG,
  classifyAction,
  shouldAutoApprove,
  isActionBlocked,
  createActionRequest,
  resolveAction,
  getApprovalReason,
} from './actions/risk.js';

// Crypto utilities
export {
  encrypt,
  decrypt,
  getEncryptionKey,
  encryptConfig,
  decryptConfig,
} from './utils/crypto.js';
