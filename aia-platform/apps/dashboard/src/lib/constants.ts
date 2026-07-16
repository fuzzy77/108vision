export const MODEL_TIERS: Record<string, { label: string; description: string; color: string }> = {
  'fast-cheap': { label: 'Veloce', description: 'DeepSeek V3 — rapido ed economico', color: 'emerald' },
  balanced: { label: 'Bilanciato', description: 'DeepSeek Reasoner — ragionamento', color: 'blue' },
  powerful: { label: 'Potente', description: 'Qwen Max — massima qualita', color: 'purple' },
  coding: { label: 'Coding', description: 'DeepSeek V3 — ottimizzato per codice', color: 'indigo' },
  vision: { label: 'Vision', description: 'Qwen VL — analisi immagini', color: 'amber' },
};

export type ModelTier = string;

export const PLAN_TYPES = {
  starter: { label: 'Starter', color: 'slate', maxAgents: 2, maxDocs: 50, maxConversations: 500 },
  professional: { label: 'Professional', color: 'blue', maxAgents: 5, maxDocs: 200, maxConversations: 2000 },
  enterprise: { label: 'Enterprise', color: 'purple', maxAgents: 20, maxDocs: 1000, maxConversations: 10000 },
} as const;

export type PlanType = keyof typeof PLAN_TYPES;

export const AGENT_CATEGORIES = [
  { id: 'general', label: 'Generale', color: 'slate' },
  { id: 'sales', label: 'Vendite', color: 'emerald' },
  { id: 'support', label: 'Supporto', color: 'blue' },
  { id: 'operations', label: 'Operazioni', color: 'amber' },
  { id: 'legal', label: 'Legale', color: 'purple' },
  { id: 'hr', label: 'Risorse Umane', color: 'pink' },
] as const;

export type AgentCategory = (typeof AGENT_CATEGORIES)[number]['id'];

export const TENANT_SECTORS = [
  'E-commerce',
  'Ristorazione',
  'Studi professionali',
  'Manifattura',
  'Servizi',
  'Retail',
  'Turismo',
  'Immobiliare',
  'Sanita',
  'Formazione',
  'Altro',
] as const;

export const USE_CASES = [
  { id: 'customer_support', label: 'Assistenza clienti', icon: 'headphones' },
  { id: 'document_analysis', label: 'Analisi documenti', icon: 'file-search' },
  { id: 'email_management', label: 'Gestione email', icon: 'mail' },
  { id: 'lead_generation', label: 'Generazione lead', icon: 'target' },
  { id: 'internal_qa', label: 'Q&A interno', icon: 'help-circle' },
  { id: 'content_creation', label: 'Creazione contenuti', icon: 'pen-tool' },
  { id: 'data_extraction', label: 'Estrazione dati', icon: 'database' },
  { id: 'scheduling', label: 'Pianificazione appuntamenti', icon: 'calendar' },
] as const;

export const STATUS_COLORS = {
  active: 'emerald',
  inactive: 'slate',
  trial: 'amber',
  suspended: 'red',
  cancelled: 'red',
} as const;

export type TenantStatus = keyof typeof STATUS_COLORS;
