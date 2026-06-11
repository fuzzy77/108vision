import { eq, and, sql, desc } from 'drizzle-orm';
import { type Result, success, failure, AppError } from '@aia/shared';
import { getDb } from '../lib/db.js';
import { agentTemplates, agents, tenants } from '../db/schema.js';

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category: string;
  systemPrompt: string;
  modelPreference: string;
  temperature: number;
  icon?: string;
  isPublic: boolean;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: string;
  systemPrompt?: string;
  modelPreference?: string;
  temperature?: number;
  icon?: string;
  isPublic?: boolean;
}

export interface TemplateFilters {
  category?: string;
  isPublic?: boolean;
}

/**
 * Marketplace service for managing agent templates.
 */
export const marketplaceService = {
  /**
   * List all agent templates with optional filters.
   */
  async listTemplates(
    filters?: TemplateFilters,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<Result<{ items: typeof agentTemplates.$inferSelect[]; total: number }>> {
    try {
      const db = getDb();
      const offset = (page - 1) * pageSize;

      const conditions = [];
      if (filters?.category) {
        conditions.push(eq(agentTemplates.category, filters.category));
      }
      if (filters?.isPublic !== undefined) {
        conditions.push(eq(agentTemplates.isPublic, filters.isPublic));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(agentTemplates)
        .where(whereClause);

      const total = countResult?.count ?? 0;

      const items = await db
        .select()
        .from(agentTemplates)
        .where(whereClause)
        .orderBy(desc(agentTemplates.installCount))
        .limit(pageSize)
        .offset(offset);

      return success({ items, total });
    } catch (error) {
      return failure(
        new AppError(
          'TEMPLATES_LIST_FAILED',
          `Failed to list templates: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Get a single template by ID.
   */
  async getTemplate(id: string): Promise<Result<typeof agentTemplates.$inferSelect>> {
    try {
      const db = getDb();

      const [template] = await db
        .select()
        .from(agentTemplates)
        .where(eq(agentTemplates.id, id))
        .limit(1);

      if (!template) {
        return failure(new AppError('TEMPLATE_NOT_FOUND', 'Template not found', 404));
      }

      return success(template);
    } catch (error) {
      return failure(
        new AppError(
          'TEMPLATE_GET_FAILED',
          `Failed to get template: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Create a new agent template.
   */
  async createTemplate(
    input: CreateTemplateInput,
    createdBy: string,
  ): Promise<Result<typeof agentTemplates.$inferSelect>> {
    try {
      const db = getDb();

      const [template] = await db
        .insert(agentTemplates)
        .values({
          name: input.name,
          description: input.description ?? null,
          category: input.category,
          systemPrompt: input.systemPrompt,
          modelPreference: input.modelPreference,
          temperature: String(input.temperature),
          icon: input.icon ?? null,
          isPublic: input.isPublic,
          installCount: 0,
          createdBy,
        })
        .returning();

      if (!template) {
        return failure(new AppError('TEMPLATE_CREATE_FAILED', 'Failed to create template', 500));
      }

      return success(template);
    } catch (error) {
      return failure(
        new AppError(
          'TEMPLATE_CREATE_FAILED',
          `Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Install a template for a specific tenant (create agent from template).
   */
  async installTemplate(
    templateId: string,
    tenantId: string,
  ): Promise<Result<{ agentId: string }>> {
    try {
      const db = getDb();

      // Verify template exists
      const [template] = await db
        .select()
        .from(agentTemplates)
        .where(eq(agentTemplates.id, templateId))
        .limit(1);

      if (!template) {
        return failure(new AppError('TEMPLATE_NOT_FOUND', 'Template not found', 404));
      }

      // Verify tenant exists
      const [tenant] = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (!tenant) {
        return failure(new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404));
      }

      // Create agent from template
      const [agent] = await db
        .insert(agents)
        .values({
          tenantId,
          name: template.name,
          description: template.description,
          systemPrompt: template.systemPrompt,
          model: template.modelPreference,
          temperature: template.temperature,
          maxTokens: 4096,
          knowledgeBaseIds: [],
          config: { fromTemplate: template.id },
          isActive: true,
        })
        .returning({ id: agents.id });

      if (!agent) {
        return failure(new AppError('AGENT_CREATE_FAILED', 'Failed to create agent from template', 500));
      }

      // Increment install count
      await db
        .update(agentTemplates)
        .set({ installCount: template.installCount + 1, updatedAt: new Date() })
        .where(eq(agentTemplates.id, templateId));

      return success({ agentId: agent.id });
    } catch (error) {
      if (error instanceof AppError) {
        return failure(error);
      }
      return failure(
        new AppError(
          'TEMPLATE_INSTALL_FAILED',
          `Failed to install template: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Update an existing template.
   */
  async updateTemplate(
    id: string,
    input: UpdateTemplateInput,
  ): Promise<Result<typeof agentTemplates.$inferSelect>> {
    try {
      const db = getDb();

      // Verify template exists
      const [existing] = await db
        .select({ id: agentTemplates.id })
        .from(agentTemplates)
        .where(eq(agentTemplates.id, id))
        .limit(1);

      if (!existing) {
        return failure(new AppError('TEMPLATE_NOT_FOUND', 'Template not found', 404));
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name !== undefined) updateData['name'] = input.name;
      if (input.description !== undefined) updateData['description'] = input.description;
      if (input.category !== undefined) updateData['category'] = input.category;
      if (input.systemPrompt !== undefined) updateData['systemPrompt'] = input.systemPrompt;
      if (input.modelPreference !== undefined) updateData['modelPreference'] = input.modelPreference;
      if (input.temperature !== undefined) updateData['temperature'] = String(input.temperature);
      if (input.icon !== undefined) updateData['icon'] = input.icon;
      if (input.isPublic !== undefined) updateData['isPublic'] = input.isPublic;

      const [updated] = await db
        .update(agentTemplates)
        .set(updateData)
        .where(eq(agentTemplates.id, id))
        .returning();

      if (!updated) {
        return failure(new AppError('TEMPLATE_UPDATE_FAILED', 'Failed to update template', 500));
      }

      return success(updated);
    } catch (error) {
      return failure(
        new AppError(
          'TEMPLATE_UPDATE_FAILED',
          `Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Unpublish (soft-delete) a template by marking it as not public.
   */
  async deleteTemplate(id: string): Promise<Result<void>> {
    try {
      const db = getDb();

      const [existing] = await db
        .select({ id: agentTemplates.id })
        .from(agentTemplates)
        .where(eq(agentTemplates.id, id))
        .limit(1);

      if (!existing) {
        return failure(new AppError('TEMPLATE_NOT_FOUND', 'Template not found', 404));
      }

      await db
        .update(agentTemplates)
        .set({ isPublic: false, updatedAt: new Date() })
        .where(eq(agentTemplates.id, id));

      return success(undefined);
    } catch (error) {
      return failure(
        new AppError(
          'TEMPLATE_DELETE_FAILED',
          `Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },
};
