import type { AgentConfig } from '../config.js';

export type CommandParamType = 'string' | 'number' | 'boolean';

export interface CommandParamDef {
  name: string;
  type: CommandParamType;
  default?: string | number | boolean;
  required?: boolean;
  description?: string;
}

export interface CommandContextSource {
  source: 'integration';
  name: string;
  action: string;
  limit?: string | number;
  query?: string;
  condition?: string;
}

export interface CommandOutputDef {
  format?: 'markdown' | 'text' | 'json';
  max_tokens?: number;
  model?: string;
}

export interface CommandHooksDef {
  before?: string | null;
  after?: string | null;
}

export interface CommandDefinition {
  name: string;
  description: string;
  aliases?: string[];
  version?: number;
  params?: CommandParamDef[];
  context?: CommandContextSource[];
  prompt?: string;
  output?: CommandOutputDef;
  hooks?: CommandHooksDef;
}

export type CommandOrigin = 'builtin' | 'file';

export interface RegisteredCommand {
  definition: CommandDefinition;
  origin: CommandOrigin;
  filePath?: string;
  /** Built-in handlers bypass YAML prompt execution */
  handler?: (args: string[], ctx: ExtensionShellContext) => Promise<string>;
}

export interface ExtensionShellContext {
  gatewayHttp: string;
  authToken: string;
  tenantId: string;
  config: AgentConfig;
}

export type SkillParamType = 'string' | 'number' | 'boolean' | 'enum';

export interface SkillParamDef {
  name: string;
  type: SkillParamType;
  required?: boolean;
  default?: string | number | boolean;
  values?: string[];
  description?: string;
}

export interface SkillTriggerDef {
  explicit?: string[];
  implicit?: {
    patterns: string[];
    confidence_threshold?: number;
  };
}

export interface SkillContextFileSource {
  type: 'file';
  path: string;
  condition?: string;
}

export interface SkillContextIntegrationSource {
  type: 'integration';
  name: string;
  action: string;
  limit?: string | number;
  query?: string;
  condition?: string;
}

export type SkillContextSource = SkillContextFileSource | SkillContextIntegrationSource;

export interface SkillOutputDef {
  format?: 'markdown' | 'text' | 'json';
  review_before_send?: boolean;
  action_after?: string;
}

export interface SkillManifest {
  name: string;
  description: string;
  version?: string;
  author?: string;
  trigger: SkillTriggerDef;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  tools_required?: string[];
  context?: SkillContextSource[];
  params?: SkillParamDef[];
  output?: SkillOutputDef;
  permissions?: {
    read?: string[];
    write?: string[];
  };
  knowledge?: PersonaKnowledgeRef[];
  system_prompt_file?: string;
}

export interface LoadedSkill {
  manifest: SkillManifest;
  systemPrompt: string;
  directory: string;
  enabled: boolean;
}

export interface SkillMatch {
  skill: LoadedSkill;
  confidence: number;
  trigger: 'explicit' | 'implicit';
}

export interface SkillExecutionResult {
  output: string;
  tokens: number;
  model: string;
  skillName: string;
  needsReview: boolean;
}

export interface PersonaContextWindow {
  strategy?: 'sliding' | 'full' | 'summarize';
  max_messages?: number;
  summarize_after?: number;
}

export interface PersonaKnowledgeRef {
  path: string;
  type?: 'rag' | 'structured';
  refresh?: string;
}

export interface PersonaRestrictions {
  no_pii_in_output?: boolean;
  disclaimer_required?: boolean;
  max_conversation_length?: number;
}

export interface PersonaAgentDefinition {
  name: string;
  display_name?: string;
  description: string;
  avatar?: string;
  version?: string;
  system_prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: string[];
  knowledge?: PersonaKnowledgeRef[];
  restrictions?: PersonaRestrictions;
  context_window?: PersonaContextWindow;
}

export interface LoadedPersonaAgent {
  definition: PersonaAgentDefinition;
  filePath: string;
  isDefault?: boolean;
}

export interface PersonaHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface PersonaChatResult {
  output: string;
  tokens: number;
  model: string;
  agentName: string;
  disclaimer?: string;
}

export interface PermissionsConfig {
  commands: {
    allow_network: boolean;
    allow_file_write: 'ask' | 'allow' | 'deny';
    allow_shell: 'restricted' | 'allow' | 'deny';
  };
  skills: {
    allow_network: boolean;
    allow_file_write: 'ask' | 'allow' | 'deny';
    allow_llm: boolean;
    require_review: boolean;
  };
  mcp_servers: {
    allow_write: 'per_server' | 'allow' | 'deny';
    max_concurrent_calls: number;
    timeout_per_call_ms: number;
    log_all_calls: boolean;
  };
  agents: {
    inherit_user_permissions: boolean;
    max_conversation_length: number;
    allow_multi_agent: boolean;
    max_agent_depth: number;
  };
}

export interface McpServerAuth {
  type: 'bearer';
  token: string;
}

export interface McpServerRestrictions {
  read_only?: boolean;
  max_rows?: number;
  timeout?: string;
  rate_limit?: string;
}

export interface McpHealthCheckConfig {
  interval?: string;
  timeout?: string;
}

export interface McpServerDefinition {
  name: string;
  description?: string;
  transport: 'stdio' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  auth?: McpServerAuth;
  auto_start?: boolean;
  enabled?: boolean;
  tools_exposed?: string[];
  restrictions?: McpServerRestrictions;
  health_check?: McpHealthCheckConfig;
}

export interface McpConfigDocument {
  mcp_servers: McpServerDefinition[];
}

export interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export type McpServerStatus = 'stopped' | 'starting' | 'running' | 'error';

export interface McpServerRuntime {
  definition: McpServerDefinition;
  status: McpServerStatus;
  tools: McpToolDefinition[];
  lastError?: string;
  lastHealthCheckAt?: number;
  pid?: number;
}

export interface McpToolCallResult {
  content: string;
  isError: boolean;
  serverName: string;
  toolName: string;
  durationMs: number;
}

export interface ExtensionsLockEntry {
  type: 'command' | 'skill' | 'agent' | 'mcp';
  name: string;
  version?: string;
  checksum?: string;
  installedAt: string;
}

export interface ExtensionsLockFile {
  version: 1;
  entries: ExtensionsLockEntry[];
}
