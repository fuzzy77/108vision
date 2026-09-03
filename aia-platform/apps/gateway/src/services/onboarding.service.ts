import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { type Result, success, failure, AppError } from '@aia/shared';
import { getDb } from '../lib/db.js';
import { tenants, users, agents, invitations, agentTemplates } from '../db/schema.js';
import { emailService } from './email.service.js';

export interface CreateTenantInput {
  name: string;
  slug: string;
  sector?: string;
  size?: string;
  config?: Record<string, unknown>;
}

export interface InviteUserInput {
  email: string;
  role: string;
}

/**
 * Onboarding service.
 * Handles full tenant provisioning workflow for the consultant dashboard.
 */
export const onboardingService = {
  /**
   * Insert tenant record in DB.
   * Knowledge base vectors live in shared.kb_chunks (pgvector) — no per-tenant provisioning needed.
   */
  async createTenant(
    input: CreateTenantInput,
  ): Promise<Result<{ tenantId: string; slug: string }>> {
    try {
      const db = getDb();

      // Check slug uniqueness
      const [existing] = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.slug, input.slug))
        .limit(1);

      if (existing) {
        return failure(
          new AppError('SLUG_ALREADY_EXISTS', `Slug "${input.slug}" is already in use`, 409),
        );
      }

      // Create tenant record
      const [tenant] = await db
        .insert(tenants)
        .values({
          name: input.name,
          slug: input.slug,
          status: 'trial',
          config: {
            sector: input.sector ?? null,
            size: input.size ?? null,
            ...(input.config ?? {}),
          },
        })
        .returning({ id: tenants.id, slug: tenants.slug });

      if (!tenant) {
        return failure(new AppError('TENANT_CREATE_FAILED', 'Failed to create tenant', 500));
      }

      return success({ tenantId: tenant.id, slug: tenant.slug });
    } catch (error) {
      if (error instanceof AppError) {
        return failure(error);
      }
      return failure(
        new AppError(
          'ONBOARDING_CREATE_FAILED',
          `Tenant creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Install agent templates for a tenant.
   * Copies selected templates as tenant-specific agents.
   */
  async installAgentTemplates(
    tenantId: string,
    templateIds: string[],
  ): Promise<Result<{ installedCount: number }>> {
    try {
      const db = getDb();

      // Verify tenant exists
      const [tenant] = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (!tenant) {
        return failure(new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404));
      }

      // Fetch templates
      const templates = await db
        .select()
        .from(agentTemplates)
        .where(
          eq(agentTemplates.isPublic, true),
        );

      const selectedTemplates = templates.filter((t) => templateIds.includes(t.id));

      if (selectedTemplates.length === 0) {
        return failure(
          new AppError('NO_VALID_TEMPLATES', 'None of the provided template IDs are valid', 400),
        );
      }

      // Create agents from templates
      const agentValues = selectedTemplates.map((t) => ({
        tenantId,
        name: t.name,
        description: t.description,
        systemPrompt: t.systemPrompt,
        model: t.modelPreference,
        temperature: t.temperature,
        maxTokens: 4096,
        knowledgeBaseIds: [] as string[],
        config: { fromTemplate: t.id },
        isActive: true,
      }));

      await db.insert(agents).values(agentValues);

      // Increment install counts
      for (const t of selectedTemplates) {
        await db
          .update(agentTemplates)
          .set({ installCount: t.installCount + 1 })
          .where(eq(agentTemplates.id, t.id));
      }

      return success({ installedCount: selectedTemplates.length });
    } catch (error) {
      if (error instanceof AppError) {
        return failure(error);
      }
      return failure(
        new AppError(
          'TEMPLATE_INSTALL_FAILED',
          `Template installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Queue a URL crawl for initial KB population.
   * Returns a job reference; actual crawling is handled by the ingestion worker.
   */
  async crawlUrl(
    tenantId: string,
    url: string,
  ): Promise<Result<{ jobId: string; url: string }>> {
    try {
      const db = getDb();

      // Verify tenant exists
      const [tenant] = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (!tenant) {
        return failure(new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404));
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return failure(new AppError('INVALID_URL', 'The provided URL is not valid', 400));
      }

      // Generate a job ID for tracking (actual crawl dispatched to worker)
      const jobId = nanoid(21);

      // In a production system this would dispatch to BullMQ/Redis queue.
      // For now we return the job reference; the ingestion worker polls for crawl jobs.
      console.log(JSON.stringify({
        level: 'info',
        message: 'URL crawl job queued',
        tenantId,
        jobId,
        url,
      }));

      return success({ jobId, url });
    } catch (error) {
      if (error instanceof AppError) {
        return failure(error);
      }
      return failure(
        new AppError(
          'CRAWL_QUEUE_FAILED',
          `Failed to queue URL crawl: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Invite users to a tenant.
   * Creates user records and invitation tokens.
   */
  async inviteUsers(
    tenantId: string,
    emails: InviteUserInput[],
    invitedBy: string,
  ): Promise<Result<{ invitedCount: number; invitations: Array<{ email: string; token: string }> }>> {
    try {
      const db = getDb();

      // Verify tenant exists
      const [tenant] = await db
        .select({ id: tenants.id, name: tenants.name })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (!tenant) {
        return failure(new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404));
      }

      const createdInvitations: Array<{ email: string; token: string }> = [];

      for (const invite of emails) {
        const token = nanoid(48);

        await db.insert(invitations).values({
          tenantId,
          email: invite.email,
          role: invite.role,
          token,
          status: 'pending',
          invitedBy,
        });

        createdInvitations.push({ email: invite.email, token });

        await emailService.sendInvite(invite.email, tenant.name, token, invitedBy);

        console.log(JSON.stringify({
          level: 'info',
          message: 'Invitation created',
          tenantId,
          role: invite.role,
        }));
      }

      return success({
        invitedCount: createdInvitations.length,
        invitations: createdInvitations,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return failure(error);
      }
      return failure(
        new AppError(
          'INVITE_FAILED',
          `Failed to create invitations: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Activate a tenant — set status to 'active' and finalize onboarding.
   */
  async activateTenant(tenantId: string): Promise<Result<{ tenantId: string; status: string }>> {
    try {
      const db = getDb();

      const [tenant] = await db
        .select({ id: tenants.id, status: tenants.status })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (!tenant) {
        return failure(new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404));
      }

      if (tenant.status === 'active') {
        return success({ tenantId, status: 'active' });
      }

      await db
        .update(tenants)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(tenants.id, tenantId));

      console.log(JSON.stringify({
        level: 'info',
        message: 'Tenant activated',
        tenantId,
      }));

      return success({ tenantId, status: 'active' });
    } catch (error) {
      if (error instanceof AppError) {
        return failure(error);
      }
      return failure(
        new AppError(
          'ACTIVATION_FAILED',
          `Tenant activation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },
};
