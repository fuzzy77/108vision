import { z } from 'zod';

const commandParamSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean']).default('string'),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  required: z.boolean().optional(),
  description: z.string().optional(),
});

const commandContextSchema = z.object({
  source: z.literal('integration'),
  name: z.string().min(1),
  action: z.string().min(1),
  limit: z.union([z.string(), z.number()]).optional(),
  query: z.string().optional(),
  condition: z.string().optional(),
});

const commandOutputSchema = z.object({
  format: z.enum(['markdown', 'text', 'json']).optional(),
  max_tokens: z.number().int().positive().optional(),
  model: z.string().optional(),
});

const commandHooksSchema = z.object({
  before: z.string().nullable().optional(),
  after: z.string().nullable().optional(),
});

export const commandDefinitionSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-]*$/i, 'name must be alphanumeric with hyphens'),
  description: z.string().min(1),
  aliases: z.array(z.string()).optional(),
  version: z.number().int().positive().optional(),
  params: z.array(commandParamSchema).optional(),
  context: z.array(commandContextSchema).optional(),
  prompt: z.string().optional(),
  output: commandOutputSchema.optional(),
  hooks: commandHooksSchema.optional(),
});

export type ParsedCommandDefinition = z.infer<typeof commandDefinitionSchema>;

export function parseCommandDefinition(raw: unknown): ParsedCommandDefinition {
  return commandDefinitionSchema.parse(raw);
}

export const permissionsConfigSchema = z.object({
  commands: z
    .object({
      allow_network: z.boolean().default(false),
      allow_file_write: z.enum(['ask', 'allow', 'deny']).default('ask'),
      allow_shell: z.enum(['restricted', 'allow', 'deny']).default('restricted'),
    })
    .default({}),
  skills: z
    .object({
      allow_network: z.boolean().default(true),
      allow_file_write: z.enum(['ask', 'allow', 'deny']).default('ask'),
      allow_llm: z.boolean().default(true),
      require_review: z.boolean().default(true),
    })
    .default({}),
  mcp_servers: z
    .object({
      allow_write: z.enum(['per_server', 'allow', 'deny']).default('per_server'),
      max_concurrent_calls: z.number().int().positive().default(10),
      timeout_per_call_ms: z.number().int().positive().default(30_000),
      log_all_calls: z.boolean().default(true),
    })
    .default({}),
  agents: z
    .object({
      inherit_user_permissions: z.boolean().default(true),
      max_conversation_length: z.number().int().positive().default(100),
      allow_multi_agent: z.boolean().default(true),
      max_agent_depth: z.number().int().positive().default(3),
    })
    .default({}),
});

export type ParsedPermissionsConfig = z.infer<typeof permissionsConfigSchema>;

export function parsePermissionsConfig(raw: unknown): ParsedPermissionsConfig {
  return permissionsConfigSchema.parse(raw);
}

const skillParamSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'enum']).default('string'),
  required: z.boolean().optional(),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  values: z.array(z.string()).optional(),
  description: z.string().optional(),
});

const skillTriggerSchema = z.object({
  explicit: z.array(z.string()).optional(),
  implicit: z
    .object({
      patterns: z.array(z.string()).min(1),
      confidence_threshold: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

const skillContextSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('file'),
    path: z.string().min(1),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal('integration'),
    name: z.string().min(1),
    action: z.string().min(1),
    limit: z.union([z.string(), z.number()]).optional(),
    query: z.string().optional(),
    condition: z.string().optional(),
  }),
]);

const skillOutputSchema = z.object({
  format: z.enum(['markdown', 'text', 'json']).optional(),
  review_before_send: z.boolean().optional(),
  action_after: z.string().optional(),
});

const personaKnowledgeSchema = z.object({
  path: z.string().min(1),
  type: z.enum(['rag', 'structured']).optional(),
  refresh: z.string().optional(),
});

export const skillManifestSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-]*$/i),
  description: z.string().min(1),
  version: z.string().optional(),
  author: z.string().optional(),
  trigger: skillTriggerSchema,
  model: z.string().optional(),
  max_tokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  tools_required: z.array(z.string()).optional(),
  context: z.array(skillContextSchema).optional(),
  params: z.array(skillParamSchema).optional(),
  output: skillOutputSchema.optional(),
  permissions: z
    .object({
      read: z.array(z.string()).optional(),
      write: z.array(z.string()).optional(),
    })
    .optional(),
  knowledge: z.array(personaKnowledgeSchema).optional(),
});

export type ParsedSkillManifest = z.infer<typeof skillManifestSchema>;

export function parseSkillManifest(raw: unknown): ParsedSkillManifest {
  return skillManifestSchema.parse(raw);
}

const personaContextWindowSchema = z.object({
  strategy: z.enum(['sliding', 'full', 'summarize']).optional(),
  max_messages: z.number().int().positive().optional(),
  summarize_after: z.number().int().positive().optional(),
});

const personaRestrictionsSchema = z.object({
  no_pii_in_output: z.boolean().optional(),
  disclaimer_required: z.boolean().optional(),
  max_conversation_length: z.number().int().positive().optional(),
});

export const personaAgentSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-]*$/i),
  display_name: z.string().optional(),
  description: z.string().min(1),
  avatar: z.string().optional(),
  version: z.string().optional(),
  system_prompt: z.string().min(1),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  tools: z.array(z.string()).optional(),
  knowledge: z.array(personaKnowledgeSchema).optional(),
  restrictions: personaRestrictionsSchema.optional(),
  context_window: personaContextWindowSchema.optional(),
});

export type ParsedPersonaAgentDefinition = z.infer<typeof personaAgentSchema>;

export function parsePersonaAgentDefinition(raw: unknown): ParsedPersonaAgentDefinition {
  return personaAgentSchema.parse(raw);
}

const mcpAuthSchema = z.object({
  type: z.literal('bearer'),
  token: z.string().min(1),
});

const mcpRestrictionsSchema = z.object({
  read_only: z.boolean().optional(),
  max_rows: z.number().int().positive().optional(),
  timeout: z.string().optional(),
  rate_limit: z.string().optional(),
});

const mcpHealthSchema = z.object({
  interval: z.string().optional(),
  timeout: z.string().optional(),
});

export const mcpServerSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-]*$/i),
  description: z.string().optional(),
  transport: z.enum(['stdio', 'sse']).default('stdio'),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  url: z.string().url().optional(),
  env: z.record(z.string()).optional(),
  auth: mcpAuthSchema.optional(),
  auto_start: z.boolean().optional(),
  enabled: z.boolean().optional(),
  tools_exposed: z.array(z.string()).optional(),
  restrictions: mcpRestrictionsSchema.optional(),
  health_check: mcpHealthSchema.optional(),
});

export const mcpConfigSchema = z.object({
  mcp_servers: z.array(mcpServerSchema).default([]),
});

export type ParsedMcpServerDefinition = z.infer<typeof mcpServerSchema>;

export function parseMcpConfig(raw: unknown): z.infer<typeof mcpConfigSchema> {
  return mcpConfigSchema.parse(raw);
}
