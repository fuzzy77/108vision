import type { ModelTier, PlanType, TenantStatus, AgentCategory } from '@/lib/constants';

export interface Tenant {
  id: string;
  name: string;
  sector: string;
  plan: PlanType;
  status: TenantStatus | 'cancelled';
  contactName: string;
  contactEmail: string;
  agentsCount: number;
  documentsCount: number;
  conversationsThisMonth: number;
  monthlyCost: number;
  monthlyRevenue: number;
  lastActivity: string;
  createdAt: string;
  config: TenantConfig;
}

export interface TenantConfig {
  allowedModels: ModelTier[];
  maxTokensPerMonth: number;
  customDomain?: string;
  webhookUrl?: string;
  budgetAlert?: number;
}

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  systemPrompt: string;
  modelPreference: ModelTier;
  temperature: number;
  category: AgentCategory;
  knowledgeCollections: string[];
  tools: string[];
  isActive: boolean;
  conversationsCount: number;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  tenantId: string;
  collectionId: string;
  collectionName: string;
  fileName: string;
  fileSize: number;
  status: 'processing' | 'ready' | 'error';
  chunksCount: number;
  uploadedAt: string;
  processedAt: string | null;
  errorMessage?: string;
}

export interface KnowledgeCollection {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  documentsCount: number;
  totalChunks: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  agentId: string;
  agentName: string;
  userId?: string;
  userName?: string;
  messagesCount: number;
  tokensUsed: number;
  cost: number;
  startedAt: string;
  lastMessageAt: string;
  status: 'active' | 'closed';
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokensUsed: number;
  model?: string;
  createdAt: string;
}

export interface UsageSummary {
  totalTokens: number;
  totalCost: number;
  totalConversations: number;
  totalMessages: number;
  byModel: { model: string; tokens: number; cost: number }[];
  byDay: { date: string; tokens: number; cost: number; conversations: number }[];
  byTenant: { tenantId: string; tenantName: string; tokens: number; cost: number; revenue: number }[];
}

export interface DashboardStats {
  activeTenants: number;
  conversationsThisMonth: number;
  llmCostThisMonth: number;
  revenueThisMonth: number;
  tenantsTrend: number;
  conversationsTrend: number;
  costTrend: number;
  revenueTrend: number;
}

export interface ActivityEvent {
  id: string;
  tenantId: string;
  tenantName: string;
  type: 'conversation_started' | 'document_uploaded' | 'agent_modified' | 'tenant_created' | 'agent_created' | 'alert_triggered';
  description: string;
  timestamp: string;
}

export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  systemPrompt: string;
  modelPreference: ModelTier;
  temperature: number;
  tools: string[];
  installCount: number;
  createdBy: string;
  createdAt: string;
  icon: string;
}

export interface OnboardingData {
  company: {
    name: string;
    sector: string;
    size: string;
    contactName: string;
    contactEmail: string;
  };
  useCases: string[];
  agents: Partial<Agent>[];
  documents: File[];
  crawlUrls: string[];
  users: { email: string; role: string }[];
}

export interface TenantUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatarUrl?: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Integrations Types ---

export type EmailProvider = 'imap' | 'microsoft365' | 'google';
export type EmailAccountStatus = 'active' | 'error' | 'disconnected';

export interface EmailAccount {
  id: string;
  tenantId: string;
  provider: EmailProvider;
  email: string;
  status: EmailAccountStatus;
  lastSync: string | null;
  unreadCount: number;
  config: EmailAccountConfig;
  createdAt: string;
}

export interface EmailAccountConfig {
  imapHost?: string;
  imapPort?: number;
  imapSecurity?: 'ssl' | 'tls' | 'none';
  smtpHost?: string;
  smtpPort?: number;
  smtpSecurity?: 'ssl' | 'tls' | 'none';
  username?: string;
  oauthConnected?: boolean;
}

export interface AddEmailAccountPayload {
  tenantId: string;
  provider: EmailProvider;
  email: string;
  config: EmailAccountConfig;
  password?: string;
}

export interface TestEmailConnectionPayload {
  provider: EmailProvider;
  email: string;
  config: EmailAccountConfig;
  password?: string;
}

export interface TestEmailConnectionResult {
  success: boolean;
  message: string;
}

// --- Browser Automation Types ---

export type CrawlJobStatus = 'running' | 'completed' | 'failed';

export interface CrawlJob {
  id: string;
  tenantId: string;
  url: string;
  maxPages: number;
  pagesCrawled: number;
  status: CrawlJobStatus;
  addedToKb: boolean;
  duration: number | null;
  startedAt: string;
  completedAt: string | null;
  errorMessage?: string;
}

// --- Local Agent Types ---

export type LocalAgentConnectionStatus = 'connected' | 'disconnected';

export interface LocalAgentStatus {
  tenantId: string;
  status: LocalAgentConnectionStatus;
  lastHeartbeat: string | null;
  version: string | null;
  allowedDirectories: string[];
  capabilities: LocalAgentCapability[];
}

export interface LocalAgentCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface LocalAgentAction {
  id: string;
  tenantId: string;
  action: string;
  riskLevel: ActionRiskLevel;
  status: 'success' | 'failed' | 'rejected';
  timestamp: string;
  details?: string;
}

// --- Action Queue Types ---

export type ActionRiskLevel = 'read_only' | 'low_risk' | 'high_risk';
export type ActionRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ActionRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  userId?: string;
  userName?: string;
  agentId: string;
  agentName: string;
  actionType: string;
  description: string;
  riskLevel: ActionRiskLevel;
  parameters: Record<string, unknown>;
  status: ActionRequestStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy?: string;
}

export interface ActionFilters {
  tenantId?: string;
  riskLevel?: ActionRiskLevel;
  actionType?: string;
  status?: ActionRequestStatus;
  page?: number;
  pageSize?: number;
}
